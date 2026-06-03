import os
import uuid
from fastapi import BackgroundTasks
from concurrent.futures import ProcessPoolExecutor
from fastapi import UploadFile
from fastapi import HTTPException
import traceback
import asyncio
from db.postgresql.invoices import insert_invoice
from db.sqlite.job_queue import enqueue_jobs
from pipeline.runner import worker_process
from models.invoice import Invoice

# global job queue
JOB_QUEUE = asyncio.Queue() 

async def save_files_to_disk(uploaded_files: list[tuple[str | None, bytes]], batch_id: str) -> list[str]:
    """
    function to save files to disk. Returns a list of saved file locations on the disk.
    Args:
        uploaded_files: file bytes read from API layer.
        batch_id: batch ID generated from batch setup.
    """
    # allowed file types
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    try:
        # data raw, originally uploaded. 
        save_dir = f"data/raw/{batch_id}"

        os.makedirs(save_dir)
        paths = []
        
        # iterate over the files in the uploaded folder.
        for file_name, file_content in uploaded_files:
            
            # check if the file is not empty and has a file name.
            if not (file_content and file_name):
                continue
            
            # create the save file path
            file_name = file_name.split("/").pop()
            file_path = f"{save_dir}/{file_name}"
            with open(file_path, "wb") as f:
                f.write(file_content)

            # append the file path to the list of file paths.
            paths.append(file_path)

        return paths

    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))

async def batch_setup(chunk: list[UploadFile]):
    """
    receive a chunk of files from ingestion. Read the file bytes and assign a unique uuid to 
    the received batch. Start the pipeline runner as a background task.  
    """
    try:
        # -- 1. read the file bytes from the uploaded files.
        file_bytes = [(file.filename, await file.read()) for file in chunk]
        
        # -- 2. generate a unique batch ID for the uploaded batch of files. 
        batch_id = str(uuid.uuid4())

        # -- 3. save the raw files to disk and get the file paths for the saved files.
        file_paths = await save_files_to_disk(file_bytes, batch_id)

        # -- 4. enqueue the job to the job_queue.
        await enqueue_jobs(batch_id=batch_id, file_paths=file_paths)

        await JOB_QUEUE.put({"batch_id": batch_id, "file_paths": file_paths})
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
                print(f"<PIPELINE RUNNER> successfully inserted invoice with UUID {invoice_uuid} into database for batch {batch_id} and image {invoice.file_name}")
            except Exception as e:
                print(f"Error inserting invoice data into database for batch {batch_id} and image {invoice.file_name}: {e}")
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
        
        print(f"<-- MAIN PROCESS--> Main Process received job: {batch_id}. Dispatching to workers...")
        
        # # enqueue the job to the job_queue.
        # asyncio.create_task(enqueue_jobs(batch_id=batch_id, file_paths=file_paths))
        
        # -------------------------
        # the reason why we use run_in_executor here is because executor.submit blocks the main process current
        # thread here causing the main process to freeze here and it will never get the chance to listen
        # for new batch submissions. Hence, it makes more sense to create a task from this submission
        # and pass it over to the async loop so that the main process can continue listening for the
        # next batch submission.
        # -------------------------

        # -- a. run_in_executor submits the worker process to the process pool. --
        future = loop.run_in_executor(executor, worker_process, file_paths, batch_id)
        # -- b. at this point the child process is running and future doesn't hold any value --

        # -------------------------
        # We use asyncio.create_task so the main_process doesn't freeze!
        # It handles the DB insertion in the background, while the while-loop 
        # instantly goes back to listening for the next chunk from batch_setup.
        # -------------------------

        # listing for finished worker process and trigger the callback function handle_worker_result
        # to handle the results from the worker process in the background. 
        asyncio.create_task(handle_worker_result(future, batch_id))
