
# from fastapi import UploadFile
import uuid
from pipeline.ingest import save_files_to_disk

async def pipeline_runner(batch_folder, batch_id):
    """
    Orchestrate the end-to-end processing of one invoice batch.
    Receives a prepared batch, validate it is ready, enqueues or starts processing.
    Returns a batch receipt + status. 
    """

    print("batch_folder_type:", type(batch_folder))
    
    # create a new batch job.
    # batch_id = str(uuid.uuid4())
    files_path = await save_files_to_disk(batch_folder, batch_id)
    
    # create background tasks. 
    # create multi-processors tasks.
    # multi-processors tasks takes over the logic.
    # receives the results from multi-processors tasks. 
    
    