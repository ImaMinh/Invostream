# import FastAPI modules 
from fastapi import FastAPI, UploadFile, HTTPException, APIRouter, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware  

# import pydantic validation error
from pydantic import ValidationError

# import the modules:
from pipeline.runner import pipeline_runner

# import pydantic models
from models.batch import BatchUploadResponse

import uuid

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
@router.post("/invoices/batch")
async def ingest(background_tasks: BackgroundTasks, folder: list[UploadFile] = File(...)): # TODO: define a response model here.
    try:
        # response = await pipeline_runner(folder)
        batch_id = str(uuid.uuid4())
        background_tasks.add_task(pipeline_runner, folder, batch_id)
        # return a response here.
    except ValidationError as validationError: 
        print('Validation error occured', validationError) 
        raise HTTPException(status_code=422, detail=str(validationError))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


app.include_router(router)