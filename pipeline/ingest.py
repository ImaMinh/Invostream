import uuid
import traceback
from fastapi import HTTPException
from fastapi import UploadFile
from pipeline.orchestrator import save_raw_batch

# -- helper function to chunk uploaded files into batches of 20 files.
def chunk_files(uploaded_files: list[UploadFile], chunk_size: int = 20):
    for i in range(0, len(uploaded_files), chunk_size):
        yield uploaded_files[i:i + chunk_size]

# Ingestion endpoint for files received from the API layer.
async def ingest(uploaded_files: list[UploadFile], upload_id: str = "", user_id: str | None = None) -> list[str]:
    """
    Process uploaded files through the pipeline.
    Chunks files into batches of 20, assigns a batch UUID to each batch,
    saves the raw folder to disk, and pushes the job to RAW_BATCH_QUEUE (Queue 1).
    """
    batch_ids: list[str] = []
    try:
        for chunk in chunk_files(uploaded_files, 20):
            batch_id = str(uuid.uuid4())
            await save_raw_batch(chunk, batch_id=batch_id, upload_id=upload_id, user_id=user_id)
            batch_ids.append(batch_id)
        return batch_ids
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))