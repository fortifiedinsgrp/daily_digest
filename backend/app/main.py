"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine
from app.models.models import Base

# Create database tables (with error handling)
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database connected successfully")
except Exception as e:
    print(f"⚠️  Database connection failed: {e}")
    print("API will run without database functionality")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="A curated news digest application"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will use settings.BACKEND_CORS_ORIGINS in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to The Daily Digest API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
