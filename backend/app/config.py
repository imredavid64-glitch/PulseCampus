from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    GEMINI_API_KEY: str = Field(..., description="Google Gemini API Key")
    SUPABASE_URL: str = Field(..., description="Supabase Project URL")
    SUPABASE_SERVICE_KEY: str = Field(..., description="Supabase Service Role Key")
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string for asyncpg")
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()