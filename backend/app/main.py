from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models import *  # noqa - register all models

settings = get_settings()
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Load ML models at startup
    try:
        from app.services.ml_service import load_models
        load_models()
    except Exception as e:
        logging.warning(f"ML models not loaded: {e}")
    yield


app = FastAPI(title=settings.project_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def read_root():
    return {"message": "AcadeX Backend is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
