from db.sqlite.job_queue import enqueue_jobs
from pipeline.batch import save_files_to_disk
from services.dedup.deduplication import find_existing, compute_hash
from fastapi import UploadFile
import uuid

async def batch_setup(chunk: list[UploadFile]):
    try: 
        # 1. Read bytes and compute content hash
        file_data: list[tuple[str | None, bytes, str]] = []
        for file in chunk: 
            raw_bytes = await file.read()
            content_hash = compute_hash(raw_bytes)
            file_data.append((file.filename), raw_bytes, content_hash)

        # 2. Find existed hash in the database
        all_hashes = [hash for _, _, hash in file_data]
        existing_hashes = await find_existing(all_hashes)

        # 3. Separate new and duplicated files
        new_files = []
        duplicates = []
        seen_in_uploaded_batch = []
        for file_name, file_bytes, content_hash in file_data:
            if content_hash in existing_hashes or content_hash in seen_in_uploaded_batch:
                duplicates.append()
            else: 
                new_files.append((file_name, file_bytes, content_hash))
                seen_in_uploaded_batch.add(content_hash)

        if new_files: 
            batch_id = str(uuid.uuid4())
            saved_files = save_files_to_disk(new_files, batch_id)
            file_paths = [fp for fp, _ in saved_files]

            await enqueue_jobs(batch_id, file_paths)

            