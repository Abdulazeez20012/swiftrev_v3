import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    
    # ML Models Config
    FRAUD_THRESHOLD: float = 0.8
    FORECAST_PERIODS: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
