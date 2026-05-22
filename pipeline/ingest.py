import os
import traceback
import uuid
from fastapi import HTTPException

# allowed file types
allowed_types = ["image/jpeg", "image/png", "application/pdf"]

async def save_files_to_disk(uploaded_files: list[tuple[str | None, bytes]], batch_id: str) -> list[str]:
    """
    function to save files to disk. Returns a list of saved file locations on the disk.
    Args:
        uploaded_files: file bytes read from API layer.
        batch_id: batch ID generated from batch setup.
    """
    try:
        # data raw, originally uploaded. 
        save_dir = f"data/raw/{batch_id}"
        
        os.makedirs(save_dir)
        paths = []
        
        # iterate over the files in the uploaded folder.
        for file_name, file_content in uploaded_files:
            
            if not (file_content and file_name):
                continue
            
            file_name = file_name.split("/").pop()
            
            file_path = f"{save_dir}/{file_name}"
            
            with open(file_path, "wb") as f:
                f.write(file_content)

            paths.append(file_path)
        
        return paths
    
    except Exception as error: 
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


    