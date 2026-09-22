import asyncpg
from supabase import create_client, Client
from app.config import settings
from contextlib import asynccontextmanager
from typing import Optional


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.supabase: Optional[Client] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
        self.supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

    @asynccontextmanager
    async def acquire(self):
        async with self.pool.acquire() as conn:
            yield conn


db = Database()


async def get_db():
    async with db.acquire() as conn:
        yield conn


def get_supabase() -> Client:
    if not db.supabase:
        raise RuntimeError("Supabase client not initialized")
    return db.supabase