from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Karaoke Generator AI Engine"
    API_V1_STR: str = "/api/v1"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None

    # Storage (S3/R2)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "auto"
    AWS_BUCKET_NAME: str = "karaoke-assets"
    AWS_ENDPOINT_URL: Optional[str] = None  # For Cloudflare R2

    # Gemini / LLM
    GEMINI_API_KEY: Optional[str] = None

    # Paths
    TEMP_DIR: str = "/tmp/karaoke-gen"

    def model_post_init(self, __context):
        if not self.REDIS_URL:
            self.REDIS_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    class Config:
        env_file = ".env"

settings = Settings()
