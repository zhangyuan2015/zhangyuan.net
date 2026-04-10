from functools import lru_cache

from pydantic import Field

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "zhangyuan-blog-api"
    api_v1_prefix: str = "/api/v1"
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    # MySQL（后续 ORM 使用）
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "blog"
    mysql_password: str = "blog_secret"
    mysql_database: str = "zhangyuan_net"

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    # 七牛云 Kodo
    qiniu_access_key: str = ""
    qiniu_secret_key: str = ""
    qiniu_bucket: str = ""
    qiniu_upload_host: str = "https://upload.qiniup.com"
    qiniu_public_base_url: str = ""
    qiniu_private_bucket: bool = False
    qiniu_private_download_ttl: int = 3600
    # 上传凭证有效期（秒）
    qiniu_upload_token_ttl: int = 3600

    # JWT（后续登录）
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24
    jwt_issuer: str = "zhangyuan-blog-api"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
