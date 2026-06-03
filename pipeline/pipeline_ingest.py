import os
import traceback
from fastapi import BackgroundTasks, HTTPException
from fastapi import UploadFile
from pipeline.batch import batch_setup

# -- helper function to chunk the file paths into batches of 20 files.
def chunk_files(uploaded_files: list[UploadFile], chunk_size: int = 20):
    print(type(uploaded_files))
    for i in range(0, len(uploaded_files), chunk_size):
        yield uploaded_files[i:i + chunk_size]

# ingestion endpoint for files received from the API layer.
async def ingest(uploaded_files: list[UploadFile]):
    try:
        for chunk in chunk_files(uploaded_files, 20): # loop through chunks of files.
            # pass the chunk to the batch setup function.
            await batch_setup(chunk)
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))