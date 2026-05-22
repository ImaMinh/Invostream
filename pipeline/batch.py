import os
import uuid
from fastapi import BackgroundTasks
from concurrent.futures import ProcessPoolExecutor

# import the modules:
from pipeline.ingest import save_files_to_disk
from pipeline.runner import pipeline_runner


# TODO: get the thread processing to handle the file folder.

async def batch_setup(files: list[tuple[str | None, bytes]], background_tasks: BackgroundTasks):
    batch_id = str(uuid.uuid4())
    
    file_paths = await save_files_to_disk(files, batch_id)
    
    background_tasks.add_task(pipeline_runner, file_paths, batch_id)
    
    return batch_id