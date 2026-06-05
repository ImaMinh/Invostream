from image_process.ingest import ingest_image
from ocr.extraction import extract_invoices
import os
import asyncio

def run_worker(batch_file_paths, batch_id, hash_map=None):
    return asyncio.run(worker_process(batch_file_paths, batch_id, hash_map))

async def worker_process(batch_file_paths: list[str], batch_id, hash_map: dict[str, str] | None = None):
    """
    Worker process to handle one batch.
    hash_map: dict mapping raw file_path → content_hash (for deduplication tracking).
    """
    pid = os.getpid()
    if hash_map is None:
        hash_map = {}
    print(f"\n[PID: {pid}] WORKER PROCESS STARTED for batch: {batch_id} | Files: {len(batch_file_paths)}")
    try: 
        # -- 2nd task, sending the images over to ingest.py --:
        processed_images_paths, failures = ingest_image(batch_file_paths, batch_id)
        
        # -- Remap hash_map: raw_path → processed_path
        # Image processing may change file paths (e.g. normalize_dpi saves to a new location),
        # so we remap the hash from the original path to the processed path using the filename as key.
        processed_hash_map = {}
        for raw_path, processed_path in zip(batch_file_paths, processed_images_paths):
            raw_hash = hash_map.get(raw_path)
            if raw_hash:
                processed_hash_map[processed_path] = raw_hash
        
        extraction_results = []

        # -- 3rd task, send the processed paths over to OCR extraction --
        try: 
            extraction_results = await extract_invoices(processed_images_paths, batch_id, processed_hash_map)
            print(f"[PID: {pid}] ✅ <PIPELINE RUNNER> successfully received extraction results for batch {batch_id} with extraction results = {extraction_results}")
        except Exception as e:
            print(f"[PID: {pid}] ❌ Error extracting invoices from {processed_images_paths} in batch {batch_id}: {e}")
            raise 

        # -- 4th task, Convert to dicts so they can be sent back to main process
        return [invoice.model_dump() for invoice in extraction_results]
        
    except Exception as e:
        print(f"[PID: {pid}] Error in worker process: {e}")
        raise