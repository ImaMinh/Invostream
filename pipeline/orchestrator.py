import os
from fastapi import UploadFile
from fastapi import HTTPException
import traceback
import asyncio
from db.postgresql.invoices import insert_invoice

from models.invoice import Invoice
from models.batch import DuplicateFileInfo
from services.dedup.deduplication import compute_hash, find_existing

# --- Pipeline Queue Configurations ---
NUM_PRODUCERS = int(os.getenv("NUM_PRODUCERS", "3"))
NUM_CONSUMERS = int(os.getenv("NUM_CONSUMERS", "3"))

RAW_QUEUE_MAXSIZE = int(os.getenv("RAW_QUEUE_MAXSIZE", "20"))
DEDUPED_QUEUE_MAXSIZE = int(os.getenv("DEDUPED_QUEUE_MAXSIZE", "50"))

# Queue 1: API Ingestion -> Producers (Holds raw 20-file folders + batch UUID)
INGEST_TO_PRODUCER: asyncio.Queue = asyncio.Queue(maxsize=RAW_QUEUE_MAXSIZE)

# Queue 2: Producers -> Consumers (Holds deduplicated/novel batch file paths for OCR & DB)
PRODUCER_CONSUMER_BUFFER: asyncio.Queue = asyncio.Queue(maxsize=DEDUPED_QUEUE_MAXSIZE)


# -------------- STAGE 0: SAVE RAW FILES TO DISK & ENQUEUE TO QUEUE 1 -------------- #
async def save_raw_batch(chunk: list[UploadFile], batch_id: str) -> list[str]:
    """
    Saves a chunk of up to 20 raw uploaded files into data/raw/{batch_id}
    and enqueues the folder + batch UUID into INGEST_TO_PRODUCER (Queue 1).
    """
    try:
        save_dir = f"data/raw/{batch_id}"
        os.makedirs(save_dir, exist_ok=True)
        saved_file_paths = []

        for file in chunk:
            if not file.filename:
                continue
            clean_name = os.path.basename(file.filename)
            file_path = os.path.join(save_dir, clean_name)
            
            raw_bytes = await file.read()
            with open(file_path, "wb") as f:
                f.write(raw_bytes)
            saved_file_paths.append(file_path)

        # Push raw job payload (folder + 20 files + batch UUID) to Queue 1
        await INGEST_TO_PRODUCER.put({
            "batch_id": batch_id,
            "folder_path": save_dir,
            "file_paths": saved_file_paths,
        })

        print(f"<API INGESTION> Saved folder of {len(saved_file_paths)} files for batch {batch_id} -> Pushed to INGEST_TO_PRODUCER.")
        return saved_file_paths

    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


# -------------- STAGE 1: PRODUCER WORKERS (DEDUP & COMPUTE HASH) -------------- #
async def producer_worker(producer_id: int):
    """
    Producer task:
    1. Grabs a folder of 20 files along with batch UUID from INGEST_TO_PRODUCER (Queue 1).
    2. Reads file bytes from disk.
    3. Computes content hash and checks DB for duplicates.
    4. Appends novel files to PRODUCER_CONSUMER_BUFFER (Queue 2) for consumers to poll.
    """
    print(f"<PRODUCER-{producer_id}> Started, listening on INGEST_TO_PRODUCER...")

    while True:
        try:
            job = await INGEST_TO_PRODUCER.get()
            batch_id = job["batch_id"]
            file_paths = job["file_paths"]

            print(f"<PRODUCER-{producer_id}> Picked up batch {batch_id} ({len(file_paths)} files). Computing hashes & checking duplicates...")

            # 1. Read file bytes & compute content hashes
            file_data: list[tuple[str, bytes, str]] = []
            for path in file_paths:
                if not os.path.exists(path):
                    continue
                with open(path, "rb") as f:
                    content_bytes = f.read()
                content_hash = compute_hash(content_bytes)
                file_data.append((path, content_bytes, content_hash))

            # 2. Check DB for existing hashes
            all_hashes = [h for _, _, h in file_data]
            existing_hashes = await find_existing(all_hashes)

            # 3. Separate novel files from duplicates
            novel_file_paths = []
            duplicates = []
            seen_in_batch = set()

            for path, _, content_hash in file_data:
                file_name = os.path.basename(path)
                if content_hash in existing_hashes or content_hash in seen_in_batch:
                    duplicates.append(DuplicateFileInfo(file_name=file_name, content_hash=content_hash))
                    print(f"<PRODUCER-{producer_id}> Skipped duplicate file: {file_name} (hash: {content_hash[:12]}...)")
                else:
                    novel_file_paths.append(path)
                    seen_in_batch.add(content_hash)

            # 4. Append to Queue 2 for consumers to poll
            if novel_file_paths:
                # await enqueue_jobs(batch_id=batch_id, file_paths=novel_file_paths)
                
                await PRODUCER_CONSUMER_BUFFER.put({
                    "batch_id": batch_id,
                    "novel_file_paths": novel_file_paths,
                })
                print(f"<PRODUCER-{producer_id}> Enqueued batch {batch_id} with {len(novel_file_paths)} novel files to PRODUCER_CONSUMER_BUFFER.")
            else:
                print(f"<PRODUCER-{producer_id}> Batch {batch_id} contains only duplicates. Skipping Consumer queue.")

        except asyncio.CancelledError:
            break
        except Exception as error:
            print(f"<PRODUCER-{producer_id}> Error in Producer task: {error}")
            traceback.print_exc()
        finally:
            INGEST_TO_PRODUCER.task_done()


from ocr.extraction import extract_invoices


# -------------- STAGE 2: CONSUMER WORKERS (OCR EXTRACTION & DB PERSISTENCE) -------------- #
async def consumer_worker(consumer_id: int):
    """
    Consumer task:
    1. Polls PRODUCER_CONSUMER_BUFFER (Queue 2) for novel batches.
    2. Runs concurrent Azure DI extraction (`extract_invoices`) with 60s timeout & rate limiting.
    3. Persists extracted Invoice models into PostgreSQL database.
    """
    print(f"<CONSUMER-{consumer_id}> Started, listening on PRODUCER_CONSUMER_BUFFER...")

    while True:
        try:
            job = await PRODUCER_CONSUMER_BUFFER.get()
            batch_id = job["batch_id"]
            novel_file_paths = job["novel_file_paths"]

            print(f"<CONSUMER-{consumer_id}> Processing OCR & DB insertion for batch {batch_id} ({len(novel_file_paths)} files)...")

            # Execute OCR extraction concurrently via Azure Document Intelligence
            extraction_results = await extract_invoices(novel_file_paths, batch_id)

            # Insert extracted results into PostgreSQL
            saved_count = 0
            for invoice in extraction_results:
                try:
                    invoice_uuid = await insert_invoice(invoice)

                    if invoice_uuid is None:
                        continue
                    saved_count += 1
                    print(f"<CONSUMER-{consumer_id}> Inserted invoice '{invoice.file_name}' -> UUID: {invoice_uuid}")
                except Exception as e:
                    print(f"<CONSUMER-{consumer_id}> Error inserting invoice record for batch {batch_id}: {e}")
                    traceback.print_exc()

            print(f"<CONSUMER-{consumer_id}> Successfully processed batch {batch_id} ({saved_count}/{len(extraction_results)} inserted).")

        except asyncio.CancelledError:
            break
        except Exception as error:
            print(f"<CONSUMER-{consumer_id}> Error in Consumer task: {error}")
            traceback.print_exc()
        finally:
            PRODUCER_CONSUMER_BUFFER.task_done()


# -------------- MAIN PROCESS ORCHESTRATOR -------------- #
async def main_process():
    """
    Starts background Producer and Consumer workers for the 2-Stage Queue Pipeline:
    - Queue 1 (INGEST_TO_PRODUCER): Consumed by Producers (Hash calculation & Deduplication)
    - Queue 2 (PRODUCER_CONSUMER_BUFFER): Consumed by Consumers (OCR extraction & DB insertion)
    """
    # max_cpus = min(3, os.cpu_count() or 1)
    # executor = ProcessPoolExecutor(max_workers=max_cpus)

    print(f"<MAIN PROCESS> Starting {NUM_PRODUCERS} Producers and {NUM_CONSUMERS} Consumers...")

    producers = [
        asyncio.create_task(producer_worker(i), name=f"producer_{i}")
        for i in range(NUM_PRODUCERS)
    ]

    consumers = [
        asyncio.create_task(consumer_worker(i), name=f"consumer_{i}")
        for i in range(NUM_CONSUMERS)
    ]

    await asyncio.gather(*producers, *consumers)




