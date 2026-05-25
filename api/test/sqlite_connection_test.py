from contextlib import asynccontextmanager
from fastapi import FastAPI
from db.sqlite import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()  # runs once on startup
    yield

app = FastAPI(lifespan=lifespan)