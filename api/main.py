# import FastAPI modules 
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, HTTPException, APIRouter, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# import pydantic validation error
from pydantic import ValidationError

# import the modules:
from pipeline import ingest
from pipeline.orchestrator import main_process
from api.frontend import dashboard
from api.frontend import invoices

# import pydantic models
from models.batch import BatchUploadResponse

import uuid
import os
import asyncio
from services.telemetry.tracer import track_time

# import database connection pool management functions
from db.postgresql.pool import init_db_pool, close_db_pool, get_db_connection

# --- life cycle management for the database connection pool ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan function to manage the database connection pool.
    """
    # -- runs before the main listener loop --
    await init_db_pool() # init db pool connection
    asyncio.create_task(main_process()) # create background task for the main listener loop in main process
    # -- returns control to the app and pauses the startup routine-- 
    yield                   
    # -- runs after the server shuts down (sigkill, sigint, ...) -- 
    await close_db_pool()   

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

os.makedirs("data/raw", exist_ok=True)
app.mount("/data/raw", StaticFiles(directory="data/raw"), name="raw_data")

# === API for orchestrating files from `Upload Folder` === #
@router.post("/invoices/batch")
async def upload_batch(folder: list[UploadFile] = File(...)): # TODO: define a response model here.
    try:
        # pass the uploaded HTTP files to the pipeline ingest module.
        await ingest.ingest(folder)
        
        return BatchUploadResponse(
            status="pending"
        )
    except ValidationError as validationError: 
        print('Validation error occured', validationError) 
        raise HTTPException(status_code=422, detail=str(validationError))
    except Exception as error:
        print(f"Upload batch error: {error}")
        raise HTTPException(status_code=500, detail=str(error))


app.include_router(router)
app.include_router(dashboard.router)
app.include_router(invoices.router)