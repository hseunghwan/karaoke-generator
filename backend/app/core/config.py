from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Karaoke Generator"
    API_V1_STR: str = "/api/v1"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None  # 클라이언트용 (RLS 적용)
    SUPABASE_SECRET_KEY: Optional[str] = None  # 서버 전용 (RLS 우회)

    # Cloudflare R2 Storage
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: str = "karaoke-assets"
    R2_PUBLIC_URL: Optional[str] = None  # e.g., https://pub-xxx.r2.dev

    # Gemini / LLM
    GEMINI_API_KEY: Optional[str] = None

    # OpenAI (임베딩 생성용)
    OPENAI_API_KEY: Optional[str] = None
    COHERE_API_KEY: Optional[str] = None

    # Paths
    TEMP_DIR: str = "/tmp/karaoke-gen"

    def model_post_init(self, __context):
        if not self.REDIS_URL:
            self.REDIS_URL = (
                f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
            )

    class Config:
        env_file = ".env"


settings = Settings()
