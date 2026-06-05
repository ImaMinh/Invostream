import os
import uuid
import hashlib
from concurrent.futures import ProcessPoolExecutor
from fastapi import UploadFile
from fastapi import HTTPException
import traceback
import asyncio
from db.postgresql.invoices import insert_invoice
from db.clickhouse.analytics import insert_analytics
from db.sqlite.job_queue import enqueue_jobs
from db.postgresql.pool import get_db_connection
from pipeline.runner import run_worker
from models.invoice import Invoice
from models.batch import DuplicateFileInfo

# global job queue
JOB_QUEUE = asyncio.Queue() 

def compute_content_hash(file_bytes: bytes) -> str:
    """Compute a SHA-256 hex digest of the file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


async def check_existing_hashes(hashes: list[str]) -> set[str]:
    """
    Query the database for content_hashes that already exist.
    Returns the set of hashes that are already in the invoices table.
    """
    if not hashes:
        return set()
    
    async with get_db_connection() as connection:
        # Use ANY($1::text[]) to check all hashes in a single query
        rows = await connection.fetch(
            "SELECT content_hash FROM invoices WHERE content_hash = ANY($1::text[])",
            hashes
        )
        return {row["content_hash"] for row in rows}


def save_files_to_disk(uploaded_files: list[tuple[str | None, bytes, str]], batch_id: str) -> list[tuple[str, str]]:
    """
    Save files to disk. Returns a list of (file_path, content_hash) tuples.
    Args:
        uploaded_files: list of (filename, file_bytes, content_hash) from the API layer.
        batch_id: batch ID generated from batch setup.
    """
    try:
        # data raw, originally uploaded. 
        save_dir = f"data/raw/{batch_id}"

        os.makedirs(save_dir)
        results = []
        
        # iterate over the files in the uploaded folder.
        for file_name, file_content, content_hash in uploaded_files:
            
            # check if the file is not empty and has a file name.
            if not (file_content and file_name):
                continue
            
            # create the save file path
            file_name = file_name.split("/").pop()
            file_path = f"{save_dir}/{file_name}"
            with open(file_path, "wb") as f:
                f.write(file_content)

            # append the file path and its hash to the results.
            results.append((file_path, content_hash))

        return results

    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))

async def batch_setup(chunk: list[UploadFile]) -> list[DuplicateFileInfo]:
    """
    Receive a chunk of files from ingestion. Read the file bytes, check for duplicates,
    and enqueue only novel files. Returns a list of DuplicateFileInfo for files that 
    were skipped.
    """
    try:
        # -- 1. read the file bytes and compute content hashes.
        file_data: list[tuple[str | None, bytes, str]] = []
        for file in chunk:
            raw_bytes = await file.read()
            content_hash = compute_content_hash(raw_bytes)
            file_data.append((file.filename, raw_bytes, content_hash))

        # -- 2. check which hashes already exist in the database.
        all_hashes = [h for _, _, h in file_data]
        existing_hashes = await check_existing_hashes(all_hashes)

        # -- 3. separate novel files from duplicates.
        novel_files = []
        duplicates: list[DuplicateFileInfo] = []
        seen_in_batch: set[str] = set()  # also dedup within the same batch

        for file_name, file_bytes, content_hash in file_data:
            if content_hash in existing_hashes or content_hash in seen_in_batch:
                duplicates.append(DuplicateFileInfo(
                    file_name=file_name or "unknown",
                    content_hash=content_hash
                ))
                print(f"<--BATCH--> Skipping duplicate file: {file_name} (hash: {content_hash[:12]}...)")
            else:
                novel_files.append((file_name, file_bytes, content_hash))
                seen_in_batch.add(content_hash)

        # -- 4. if there are novel files, save and enqueue them.
        if novel_files:
            batch_id = str(uuid.uuid4())
            saved_results = save_files_to_disk(novel_files, batch_id)

            file_paths = [fp for fp, _ in saved_results]
            hash_map = {fp: ch for fp, ch in saved_results}  # path → hash lookup for workers

            await enqueue_jobs(batch_id=batch_id, file_paths=file_paths)
            await JOB_QUEUE.put({
                "batch_id": batch_id,
                "file_paths": file_paths,
                "hash_map": hash_map,
            })

        return duplicates
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))

# --- helper handler for worker result (DB insertion and other jobs (TODO)) ---
async def handle_worker_result(future: asyncio.Future, batch_id: str):
    try:
        extraction_results = await future
        for extracted_data in extraction_results:
            try: 
                invoice = Invoice(**extracted_data)   # dict → model
                invoice_uuid = await insert_invoice(invoice)
                
                # insert_invoice returns None if a duplicate was caught at the DB level
                if invoice_uuid is None:
                    continue
                
                print(f"<PIPELINE RUNNER> successfully inserted invoice with UUID {invoice_uuid} into database for batch {batch_id} and image {invoice.file_name}")
                
                # --- Dual Write: insert into ClickHouse analytics tables ---
                insert_analytics(invoice, invoice_uuid, batch_id)
            except Exception as e:
                print(f"Error inserting invoice data into database for batch {batch_id}: {e}")
                continue  # Continue processing the next invoice even if one fails
        JOB_QUEUE.task_done()
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error)) 

# -------------- MAIN PROCESS -------------- #
async def main_process():
    # main process pipeline: 
    # - split job into chunks
    # - each chunk dispatched to a worker process.
    # - as each worker finishes, results flows back.
    # - main process reconstruct Invoice, inserts to PostgreSQL
    # - loop ends when all chunks are done.

    loop = asyncio.get_running_loop()
    executor = ProcessPoolExecutor(max_workers=os.cpu_count())

    while True:
        job = await JOB_QUEUE.get()

        batch_id = job["batch_id"]
        file_paths = job["file_paths"]
        hash_map = job.get("hash_map", {})  # path → content_hash
        
        print(f"<-- MAIN PROCESS--> Main Process received job: {batch_id}. Dispatching to workers...")
        
        # -------------------------
        # the reason why we use run_in_executor here is because executor.submit blocks the main process current
        # thread here causing the main process to freeze here and it will never get the chance to listen
        # for new batch submissions. Hence, it makes more sense to create a task from this submission
        # and pass it over to the async loop so that the main process can continue listening for the
        # next batch submission.
        # -------------------------

        # -- a. run_in_executor submits the worker process to the process pool. --
        future = loop.run_in_executor(executor, run_worker, file_paths, batch_id, hash_map)
        # -- b. at this point the child process is running and future doesn't hold any value --

        # -------------------------
        # We use asyncio.create_task so the main_process doesn't freeze!
        # It handles the DB insertion in the background, while the while-loop 
        # instantly goes back to listening for the next chunk from batch_setup.
        # -------------------------

        # listing for finished worker process and trigger the callback function handle_worker_result
        # to handle the results from the worker process in the background. 
        asyncio.create_task(handle_worker_result(future, batch_id))
