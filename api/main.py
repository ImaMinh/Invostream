# import FastAPI modules 
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, HTTPException, APIRouter, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# import pydantic validation error
from pydantic import ValidationError

# import the modules:
from pipeline import pipeline_ingest
from pipeline.batch import main_process
from api import dashboard

# import pydantic models
from models.batch import BatchUploadResponse

import uuid
import asyncio

# import database connection pool management functions
from db.postgresql.pool import init_db_pool, close_db_pool, get_db_connection

# --- life cycle management for the database connection pool ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan function to manage the database connection pool.
    """
    await init_db_pool()    # runs once when the app starts
    asyncio.create_task(main_process()) # initialize the infinite listener loop in the background
    yield                   # app runs here, handling requests
    await close_db_pool()   # runs once when the app shuts down

# --- initiate the application ---
app = FastAPI(lifespan=lifespan)
router = APIRouter()


# configure CORS networks #
allowed_origins = ['http://127.0.0.1:5500', 'http://localhost:5173']

# -- configure the app middle ware (traffic control layer (ASGI specification)) --- #
app.add_middleware( 
    CORSMiddleware,
    allow_origins = allowed_origins,
    allow_methods = ['*'], # allows all methods, defaults to only 'GET' if not specified
    allow_headers = ['*'] # clarify this later
)

# Serve raw images/pdfs for the frontend dashboard
import os
os.makedirs("data/raw", exist_ok=True)
app.mount("/data/raw", StaticFiles(directory="data/raw"), name="raw_data")

# === API for orchestrating files from `Upload Folder` === #
@router.post("/invoices/batch")
async def ingest(folder: list[UploadFile] = File(...)): # TODO: define a response model here.
    try:
        # pass the uploaded HTTP files to the pipeline ingest module.
        duplicates = await pipeline_ingest.ingest(folder)
        accepted_count = len(folder) - len(duplicates)
        
        return BatchUploadResponse(
            status="pending" if accepted_count > 0 else "all_duplicates",
            accepted_count=accepted_count,
            duplicate_count=len(duplicates),
            duplicates=duplicates
        )
    except ValidationError as validationError: 
        print('Validation error occured', validationError) 
        raise HTTPException(status_code=422, detail=str(validationError))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


app.include_router(router)
app.include_router(dashboard.router)