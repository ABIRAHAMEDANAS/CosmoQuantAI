from pydantic_settings import BaseSettings
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, validator, field_validator
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "CosmoQuantAI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "super_secret_cosmo_quant_key_change_this_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    # Using 'db' as hostname for docker-compose, but fallback to localhost
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/cosmoquant_db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Redis/Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    REDIS_URL: str = "redis://redis:6379/0" # Added for previous fix related request
    
    # Encryption
    ENCRYPTION_KEY: str = "Jq-w5yXp3zQ4R1t2E8y9U0i7O6p5L4k3J2h1G0f9D8s="

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore" 

settings = Settings()
