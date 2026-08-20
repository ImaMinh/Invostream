import os, sys, asyncio, uuid

# import FastAPI modules
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, HTTPException, APIRouter, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from services.security.clerk_auth import verify_clerk_token

# import pydantic validation error
from pydantic import ValidationError

# import the modules:
from pipeline import ingest
from pipeline.orchestrator import main_process
from api.frontend import invoices
from api.frontend import telemetry 

# import pydantic models
from models.batch import BatchUploadResponse

# import progress tracking module
from services.telemetry.progress import upload_progress_tracker

# import database connection pool management functions
from db.postgresql.pool import init_db_pool, close_db_pool, get_db_connection


# --- life cycle management for the database connection pool ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan function to manage the database connection pool.
    """
    # -- runs before the main listener loop --
    await init_db_pool()  # init db pool connection
    asyncio.create_task(
        main_process()
    )  # create background task for the main listener loop in main process
    # -- returns control to the app and pauses the startup routine--
    yield
    # -- runs after the server shuts down (sigkill, sigint, ...) --
    await close_db_pool()


# --- initiate the application ---
app = FastAPI(lifespan=lifespan)
router = APIRouter()


# configure CORS networks #
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    cors_regex = None
else:
    allowed_origins = [
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "https://invostreamer.netlify.app",
    ]
    
# -- configure the app middleware (traffic control layer (ASGI specification)) --- #
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],  # allows all methods, defaults to only 'GET' if not specified
    allow_headers=["*"],  # clarify this later
)

os.makedirs("data/raw", exist_ok=True)
app.mount("/data/raw", StaticFiles(directory="data/raw"), name="raw_data")


# === API for orchestrating files from `Upload Folder` === #
@router.post("/invoices/batch")
async def upload_batch(
    folder: list[UploadFile] = File(...),
    user: dict = Depends(verify_clerk_token)
) -> BatchUploadResponse:  
    try:
        # TODO: Add guard: if not folder: raise HTTPException(status_code=400, detail="No files uploaded")

        # register the upload job
        upload_id = str(uuid.uuid4())
        user_id = user.get("sub")

        upload_progress_tracker.register_upload(upload_id=upload_id, total_files=len(folder))
        
        # pass the uploaded HTTP files and user_id to the pipeline ingest module.
        await ingest.ingest(folder, upload_id=upload_id, user_id=user_id)

        return BatchUploadResponse(status="pending", upload_id=upload_id)
    except ValidationError as validationError:
        print("Validation error occured", validationError)
        raise HTTPException(status_code=422, detail=str(validationError))
    except Exception as error:
        print(f"Upload batch error: {error}")
        raise HTTPException(status_code=500, detail=str(error))

app.include_router(router)
app.include_router(invoices.router)
app.include_router(telemetry.router)
