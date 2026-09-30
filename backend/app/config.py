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
    
    # Web Push Notifications (VAPID)
    VAPID_PRIVATE_KEY: str = Field(default="", description="VAPID private key for web push")
    VAPID_PUBLIC_KEY: str = Field(default="", description="VAPID public key for web push")
    VAPID_SUBJECT: str = Field(default="mailto:admin@pulse.campus", description="VAPID subject (mailto or https)")
    
    # Sentry Error Tracking
    SENTRY_DSN: str = Field(default="", description="Sentry DSN for error tracking")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()