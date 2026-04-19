import os
import uuid
from fastapi import APIRouter, UploadFile, BackgroundTasks

from models.batch import BatchUploadResponse

router = APIRouter()
ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"]

async def save_files(files: list[UploadFile], batch_id: str) -> list[str]:
    save_dir = f"data/raw/{batch_id}"
    os.makedirs(save_dir, exist_ok=True)
    paths = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            continue  
        contents = await file.read()
        filepath = f"{save_dir}/{file.filename}"
        with open(filepath, "wb") as f:
            f.write(contents)
        paths.append(filepath)
    return paths


async def upload_batch(files: list[UploadFile], background_tasks: BackgroundTasks):
    batch_id = str(uuid.uuid4())
    paths = await save_files(files, batch_id)
    background_tasks.add_task(run_batch, batch_id, paths)
    return BatchUploadResponse(
        batch_id=batch_id,
        total_files=len(paths),
        message="batch queued"
    )