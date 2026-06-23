from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Aplicación
    app_name: str = "DANI-ETH Backend"
    app_env: str = "development"
    app_debug: bool = True
    app_port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Firebase
    firebase_credentials_path: str = "./credentials/firebase-admin-key.json"
    firebase_project_id: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Orquestador
    orchestrator_url: str = "http://localhost:8001"
    orchestrator_service_token: str = "changeme-usa-un-secreto-real"

    # Runner
    runner_url: str = "http://localhost:8002"

    # Supabase Storage — para PDFs, plan gratuito sin tarjeta
    supabase_url: str = ""
    supabase_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def supabase_configured(self) -> bool:
        """True solo si ambas variables están en el .env."""
        return bool(self.supabase_url and self.supabase_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()