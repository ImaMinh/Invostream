
from fastapi import BackgroundTasks
import uuid
import os
from pipeline.ingest import save_files_to_disk
from image_process.ingest import ingest_image

async def pipeline_runner(file_paths: list[str], batch_id):
    """
    Orchestrate the end-to-end processing of one invoice batch.
    Receives a prepared batch, validate it is ready, enqueues or starts processing.
    Returns a batch receipt + status. 
    """

    print("batch_folder_type:", type(file_paths))
    
    # -- first task, sending the images over to ingest.py --:
    await ingest_image(file_paths, batch_id)
    
    # create multi-processors tasks.
    # multi-processors tasks takes over the logic.
    # receives the results from multi-processors tasks. 
    
    