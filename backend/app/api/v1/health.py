from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.health_service import run_health_checks

router = APIRouter()


@router.get("")
def dependency_health() -> JSONResponse:
    """
    心跳检查：
    - MySQL 是否可用
    - 七牛密钥是否可用
    - 七牛 Bucket 是否存在并可访问
    """
    payload = run_health_checks()
    status_code = 200 if payload["status"] == "ok" else 503
    return JSONResponse(status_code=status_code, content=payload)
