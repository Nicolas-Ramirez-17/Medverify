from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    database_url: str = 'postgresql+psycopg://medverify:medverify_dev@localhost:5432/medverify'
    jwt_secret: str = 'medverify-dev-secret-cambialo-en-produccion-32chars'
    jwt_expire_minutes: int = 480
    smtp_host: str = 'localhost'
    smtp_port: int = 1025
    smtp_from: str = 'Medverify <no-responder@medverify.test>'
    pdf_dir: Path = Path('./data/pdf')
    cors_origins: str = 'http://localhost:5173,http://localhost:8080'
    frontend_url: str = 'http://localhost:5173'
    max_pdf_bytes: int = 5 * 1024 * 1024
    app_version: str = '0.9.0'

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(',') if o.strip()]


settings = Settings()
