"""
Configuration settings for The Daily Digest backend
"""
from typing import List, Union
from pydantic import BaseSettings, AnyHttpUrl, validator
import json


class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "The Daily Digest"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/daily_digest"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        elif isinstance(v, list):
            return v
        return v
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Curation Schedule
    MORNING_CURATION_HOUR: int = 6
    EVENING_CURATION_HOUR: int = 18
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()