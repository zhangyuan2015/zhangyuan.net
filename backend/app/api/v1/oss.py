from fastapi import APIRouter, HTTPException, Query

from app.services import qiniu_service

router = APIRouter()


@router.get("/token")
def get_qiniu_upload_token(
    album_id: int | None = Query(
        default=None,
        description="相册 ID；传入则上传路径限制在 albums/{album_id}/ 下",
        ge=1,
    ),
) -> dict:
    """
    返回七牛云上传凭证，供前端直传 Kodo。

    后续可在此校验 `album_id` 是否存在（查库），当前仅生成带路径策略的 token。
    """
    try:
        result = qiniu_service.create_upload_token(album_id=album_id)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    return {
        "token": result.token,
        "expires_in": result.expires_in,
        "bucket": result.bucket,
        "upload_prefix": result.upload_prefix,
        "upload_host": result.upload_host,
        "public_base_url": result.public_base_url,
    }
