
from fastapi import BackgroundTasks
import uuid
from pipeline.ingest import save_files_to_disk

async def pipeline_runner(file_paths: list[str], batch_id):
    """
    Orchestrate the end-to-end processing of one invoice batch.
    Receives a prepared batch, validate it is ready, enqueues or starts processing.
    Returns a batch receipt + status. 
    """

    print("batch_folder_type:", type(file_paths))
    
    
    # create multi-processors tasks.
    # multi-processors tasks takes over the logic.
    # receives the results from multi-processors tasks. 
    
    