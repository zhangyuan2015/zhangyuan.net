"""
七牛云 Kodo 上传凭证（Upload Token）生成。

前端拿到 token 后直传七牛；`album_id` 存在时通过 upload policy 的 saveKey
将对象限制在 `albums/{album_id}/` 前缀下，满足「相册上下文」约束。
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from qiniu import Auth, BucketManager

from app.core.config import settings


@dataclass(frozen=True)
class UploadTokenResult:
    """与前端约定字段名，便于 JSON 序列化。"""

    token: str
    expires_in: int
    bucket: str
    """上传使用的存储空间名。"""
    upload_prefix: str | None
    """本次策略对应的逻辑前缀（便于前端拼接展示 URL 等）。"""
    upload_host: str
    public_base_url: str | None


def _build_save_key_for_album(album_id: int) -> str:
    # 七牛 saveKey 占位符：$(year) $(mon) $(day) $(hour) $(min) $(sec) $(etag) $(ext) $(fname) 等
    # 命名规则：原文件名 + 时间戳（秒），便于识别和追踪来源
    return f"albums/{album_id}/$(year)$(mon)$(day)/$(fname)_$(year)$(mon)$(day)$(hour)$(min)$(sec)"


def _build_save_key_for_blog() -> str:
    return "blog/$(year)$(mon)$(day)/$(fname)_$(year)$(mon)$(day)$(hour)$(min)$(sec)"


def create_upload_token(*, album_id: int | None = None) -> UploadTokenResult:
    """
    生成七牛上传 Token。

    - 未传 `album_id`：按博客/Markdown 图片路径 `blog/...` 写入。
    - 传入 `album_id`：限制写入 `albums/{album_id}/...`。
    """
    if not settings.qiniu_access_key or not settings.qiniu_secret_key:
        raise ValueError("七牛 AccessKey / SecretKey 未配置")
    if not settings.qiniu_bucket:
        raise ValueError("七牛 Bucket 未配置")

    ttl = max(60, int(settings.qiniu_upload_token_ttl))
    deadline = int(time.time()) + ttl
    auth = Auth(settings.qiniu_access_key, settings.qiniu_secret_key)
    bucket = settings.qiniu_bucket

    if album_id is not None:
        if album_id < 1:
            raise ValueError("album_id 必须为正整数")
        save_key = _build_save_key_for_album(album_id)
        policy = {
            "scope": bucket,
            "deadline": deadline,
            "saveKey": save_key,
        }
        prefix = f"albums/{album_id}/"
    else:
        save_key = _build_save_key_for_blog()
        policy = {
            "scope": bucket,
            "deadline": deadline,
            "saveKey": save_key,
        }
        prefix = "blog/"

    token = auth.upload_token(bucket, policy=policy)
    return UploadTokenResult(
        token=token,
        expires_in=ttl,
        bucket=bucket,
        upload_prefix=prefix,
        upload_host=settings.qiniu_upload_host,
        public_base_url=(settings.qiniu_public_base_url or None),
    )


def resolve_resource_url(
    *,
    qiniu_key: str | None = None,
    url: str | None = None,
    fop: str | None = None,
) -> str | None:
    """
    生成可访问的图片 URL。

    - 公有空间：返回原 URL（或由 key + public_base_url 拼接）
    - 私有空间：返回带时效签名的下载 URL
    """
    candidate = (url or "").strip()

    # 只要有 qiniu_key 且配置了公开域名，优先用 key 重建基础 URL，
    # 避免复用数据库里已带签名 query 的 URL 导致参数叠加。
    if qiniu_key and settings.qiniu_public_base_url:
        base = settings.qiniu_public_base_url.rstrip("/")
        candidate = f"{base}/{qiniu_key.lstrip('/')}"
    elif candidate and not candidate.startswith(("http://", "https://")) and settings.qiniu_public_base_url:
        base = settings.qiniu_public_base_url.rstrip("/")
        candidate = f"{base}/{candidate.lstrip('/')}"

    if not candidate:
        return None

    if fop:
        candidate = f"{candidate}{'&' if '?' in candidate else '?'}{fop}"

    if settings.qiniu_private_bucket:
        if not settings.qiniu_access_key or not settings.qiniu_secret_key:
            return candidate
        auth = Auth(settings.qiniu_access_key, settings.qiniu_secret_key)
        ttl = max(60, int(settings.qiniu_private_download_ttl))
        return auth.private_download_url(candidate, expires=ttl)

    return candidate


def delete_object(qiniu_key: str) -> bool:
    """
    删除七牛对象。
    返回 True 表示删除成功或对象不存在；False 表示删除失败。
    """
    if not qiniu_key:
        return False
    if not settings.qiniu_access_key or not settings.qiniu_secret_key or not settings.qiniu_bucket:
        return False

    try:
        auth = Auth(settings.qiniu_access_key, settings.qiniu_secret_key)
        bucket_manager = BucketManager(auth)
        ret, info = bucket_manager.delete(settings.qiniu_bucket, qiniu_key)
        # 200: deleted; 612: no such file (视为幂等成功)
        if info and info.status_code in (200, 612):
            return True
        # 某些 SDK 版本删除成功 ret 为 None
        return info is None and ret is None
    except Exception:
        return False
