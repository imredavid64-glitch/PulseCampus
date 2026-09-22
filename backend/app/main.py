from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import db
from app.routes import pulses, pods

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting PulseCampus backend...")
    await db.connect()
    logger.info("Database connected")
    yield
    logger.info("Shutting down...")
    await db.disconnect()
    logger.info("Database disconnected")


app = FastAPI(
    title="PulseCampus API",
    description="AI-powered campus mutual aid and study pod platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pulses.router)
app.include_router(pods.router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "pulse-campus-api",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    return {
        "message": "PulseCampus API",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )