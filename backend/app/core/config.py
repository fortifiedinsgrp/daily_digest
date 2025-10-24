"""
Configuration settings for The Daily Digest backend
"""
import os
from typing import List

# Simple configuration without Pydantic BaseSettings to avoid compatibility issues
class Settings:
    PROJECT_NAME = os.getenv("PROJECT_NAME", "The Daily Digest")
    API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/daily_digest")
    
    # CORS - simple string parsing
    cors_origins = os.getenv("BACKEND_CORS_ORIGINS", '["*"]')
    try:
        import json
        BACKEND_CORS_ORIGINS = json.loads(cors_origins)
    except:
        # Fallback to allow all if parsing fails
        BACKEND_CORS_ORIGINS = ["*"]
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Curation Schedule
    MORNING_CURATION_HOUR = int(os.getenv("MORNING_CURATION_HOUR", "6"))
    EVENING_CURATION_HOUR = int(os.getenv("EVENING_CURATION_HOUR", "18"))


settings = Settings()