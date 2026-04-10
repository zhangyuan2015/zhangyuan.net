from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from qiniu import Auth, BucketManager
from sqlalchemy import create_engine, text

from app.core.config import settings


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    detail: str


def check_database() -> CheckResult:
    """检查数据库连通性。"""
    try:
        engine = create_engine(
            settings.sqlalchemy_database_uri,
            pool_pre_ping=True,
            pool_recycle=1800,
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
        return CheckResult(ok=True, detail="database reachable")
    except Exception as exc:
        return CheckResult(ok=False, detail=f"database unavailable: {exc}")


def check_qiniu_credentials() -> CheckResult:
    """检查七牛 AccessKey / SecretKey 基本可用。"""
    if not settings.qiniu_access_key or not settings.qiniu_secret_key:
        return CheckResult(ok=False, detail="qiniu access/secret key not configured")
    if not settings.qiniu_bucket:
        return CheckResult(ok=False, detail="qiniu bucket not configured")

    try:
        auth = Auth(settings.qiniu_access_key, settings.qiniu_secret_key)
        _ = auth.upload_token(settings.qiniu_bucket, expires=60)
        return CheckResult(ok=True, detail="qiniu credentials available")
    except Exception as exc:
        return CheckResult(ok=False, detail=f"qiniu credentials invalid: {exc}")


def check_qiniu_bucket() -> CheckResult:
    """检查七牛 bucket 是否存在且可访问。"""
    if not settings.qiniu_access_key or not settings.qiniu_secret_key:
        return CheckResult(ok=False, detail="qiniu access/secret key not configured")
    if not settings.qiniu_bucket:
        return CheckResult(ok=False, detail="qiniu bucket not configured")

    try:
        auth = Auth(settings.qiniu_access_key, settings.qiniu_secret_key)
        bucket_manager = BucketManager(auth)
        _, _, info = bucket_manager.list(settings.qiniu_bucket, limit=1)
        if info is None:
            return CheckResult(ok=False, detail="qiniu bucket check failed: no response info")
        if info.status_code == 200:
            return CheckResult(ok=True, detail="qiniu bucket exists and accessible")
        return CheckResult(
            ok=False,
            detail=f"qiniu bucket check failed: status_code={info.status_code}",
        )
    except Exception as exc:
        return CheckResult(ok=False, detail=f"qiniu bucket check exception: {exc}")


def run_health_checks() -> dict[str, Any]:
    db = check_database()
    qiniu_cred = check_qiniu_credentials()
    qiniu_bucket = check_qiniu_bucket()

    all_ok = db.ok and qiniu_cred.ok and qiniu_bucket.ok
    return {
        "status": "ok" if all_ok else "degraded",
        "checks": {
            "database": {"ok": db.ok, "detail": db.detail},
            "qiniu_credentials": {"ok": qiniu_cred.ok, "detail": qiniu_cred.detail},
            "qiniu_bucket": {"ok": qiniu_bucket.ok, "detail": qiniu_bucket.detail},
        },
    }
