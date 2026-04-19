# import FastAPI modules 
from fastapi import FastAPI, UploadFile, HTTPException, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware  

# import pydantic validation error
from pydantic import ValidationError

# import pydantic models
from models.batch import BatchUploadResponse

# import json: 
import json

# import pprint:
from pprint import pprint

# --- initiate the application ---
app = FastAPI()
router = APIRouter()


# configure CORS networks #
allowed_origins = ['http://127.0.0.1:5500']

# configure the app middle ware (traffic control layer (ASGI specification)) #
app.add_middleware( 
    CORSMiddleware,
    allow_origins = allowed_origins,
    allow_methods = ['*'], # allows all methods, defaults to only 'GET' if not specified
    allow_headers = ['*'] # clarify this later
)


# === API for orchestrating files from `Upload Folder` === #
@router.post("/invoices/batch", response_model=BatchUploadResponse)
async def uploadFormImage(file: UploadFile, extraction_model: str = Form(...)): # FastAPI automatically parses multipart/form-data
    try:
        pass
        # save file to disks.
        # enqueue jobs.
        
        
    except ValidationError as validationError: 
        print('Validation error occured', validationError) 
        # return something here
    
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


    
app.include_router(router)