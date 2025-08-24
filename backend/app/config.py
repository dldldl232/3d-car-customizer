from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    allowed_origins: List[str] = ["http://localhost:3000"]
    access_token_expire_minutes: int = 30
    sketchfab_api_token: str = "cda1c4c6ac7b4371b586beed96687b90"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

