# import FastAPI modules 
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, HTTPException, APIRouter, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware  

# import pydantic validation error
from pydantic import ValidationError

# import the modules:
from pipeline.batch import batch_setup

# import pydantic models
from models.batch import BatchUploadResponse

import uuid

# import database connection pool management functions
from db.postgresql import init_db_pool, close_db_pool, get_db_connection

# --- life cycle management for the database connection pool ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan function to manage the database connection pool.
    """
    await init_db_pool()    # runs once when the app starts
    yield                   # app runs here, handling requests
    await close_db_pool()   # runs once when the app shuts down

# --- initiate the application ---
app = FastAPI(lifespan=lifespan)
router = APIRouter()


# configure CORS networks #
allowed_origins = ['http://127.0.0.1:5500']

# -- configure the app middle ware (traffic control layer (ASGI specification)) --- #
app.add_middleware( 
    CORSMiddleware,
    allow_origins = allowed_origins,
    allow_methods = ['*'], # allows all methods, defaults to only 'GET' if not specified
    allow_headers = ['*'] # clarify this later
)

# === API for orchestrating files from `Upload Folder` === #
@router.post("/invoices/batch", response_model=BatchUploadResponse)
async def ingest(background_tasks: BackgroundTasks, folder: list[UploadFile] = File(...)): # TODO: define a response model here.
    try:
        # --- read the bytes from HTTP ---
        files_bytes = [(f.filename, await f.read()) for f in folder]
        
        # --- run the pipeline in background ---
        batch_id = await batch_setup(files_bytes, background_tasks)
       
        # return process response
        return BatchUploadResponse(batch_id=batch_id, status="pending")
    except ValidationError as validationError: 
        print('Validation error occured', validationError) 
        raise HTTPException(status_code=422, detail=str(validationError))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


app.include_router(router)