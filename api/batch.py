import os
import uuid
import traceback
from fastapi import UploadFile, BackgroundTasks, File, HTTPException

# allowed file types
allowed_types = ["image/jpeg", "image/png", "application/pdf"]


async def save_files_to_disk(uploaded_files: list[UploadFile], batch_id = None) -> list[str]:
    """
    function to save files to disk. Returns a list of saved file locations on the disk.
    """
    try:
        # data raw, originally uploaded. 
        save_dir = f"data/raw/{batch_id}"
        
        os.makedirs(save_dir)
        
        paths = []
        
        # iterate over the files in the uploaded folder.
        for file in uploaded_files:
            
            # TODO: flag back the file to send to user. 
            if file.content_type not in allowed_types: 
                continue  
            
            # read the file contents. 
            contents = await file.read()
            
            # strip the webkitRelativePath prefix:
            curr_filename = str(file.filename)
            file.filename = curr_filename.split("/").pop()
            
            # create the filepath.
            filepath = f"{save_dir}/{file.filename}"
            
            # TODO: this current webkitRelativePath prefix might work only with non-nested folders. Need to fix the full thing afterwards. 

            with open(filepath, "wb") as f:
                f.write(contents)

            paths.append(filepath)
        
        return paths
    except Exception as error: 
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))
