import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services import qiniu_service


def _ensure_site_title_column(db: Session) -> None:
    try:
        db.execute(text("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_title VARCHAR(128) NULL"))
        db.commit()
    except Exception:
        db.rollback()


def get_public_site_settings(db: Session) -> dict:
    _ensure_site_title_column(db)
    row = db.execute(
        text("SELECT site_title, hero_intro, social_links FROM site_settings WHERE id = 1 LIMIT 1")
    ).mappings().first()
    if not row:
        return {"site_title": None, "hero_intro": None, "social_links": []}

    social_links_raw = row.get("social_links")
    if isinstance(social_links_raw, str):
        social_links = json.loads(social_links_raw or "[]")
    else:
        social_links = social_links_raw or []
    return {
        "site_title": row.get("site_title"),
        "hero_intro": row.get("hero_intro"),
        "social_links": social_links,
    }


def list_public_posts(db: Session, *, limit: int = 20) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id, title, slug, summary, cover_url, published_at
            FROM posts
            WHERE status = 'published'
            ORDER BY published_at DESC, id DESC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()
    payload = []
    for row in rows:
        item = dict(row)
        item["cover_url"] = qiniu_service.resolve_resource_url(url=item.get("cover_url"))
        payload.append(item)
    return payload


def list_public_albums(db: Session, *, limit: int = 20) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT
                a.id,
                a.title,
                a.album_date,
                a.description,
                a.location,
                cp.qiniu_key AS cover_qiniu_key,
                cp.url AS cover_url,
                COUNT(p.id) AS photo_count
            FROM albums a
            LEFT JOIN photos p ON p.album_id = a.id
            LEFT JOIN photos cp ON cp.id = a.cover_photo_id
            GROUP BY
                a.id, a.title, a.album_date, a.description, a.location, cp.qiniu_key, cp.url
            ORDER BY a.album_date DESC, a.id DESC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()
    payload = []
    for row in rows:
        item = dict(row)
        item["cover_url"] = qiniu_service.resolve_resource_url(
            qiniu_key=item.get("cover_qiniu_key"),
            url=item.get("cover_url"),
        )
        item.pop("cover_qiniu_key", None)
        payload.append(item)
    return payload


def get_public_album_detail(db: Session, *, album_id: int) -> dict | None:
    album = db.execute(
        text(
            """
            SELECT id, title, album_date, description, location
            FROM albums
            WHERE id = :album_id
            LIMIT 1
            """
        ),
        {"album_id": album_id},
    ).mappings().first()
    if not album:
        return None

    photos = db.execute(
        text(
            """
            SELECT id, qiniu_key, url, description, sort_order
            FROM photos
            WHERE album_id = :album_id
            ORDER BY sort_order ASC, id ASC
            """
        ),
        {"album_id": album_id},
    ).mappings().all()

    payload = dict(album)
    photo_list = []
    for item in photos:
        photo = dict(item)
        photo["url"] = qiniu_service.resolve_resource_url(
            qiniu_key=photo.get("qiniu_key"),
            url=photo.get("url"),
        )
        photo["thumb_url"] = qiniu_service.resolve_resource_url(
            qiniu_key=photo.get("qiniu_key"),
            url=photo.get("url"),
            fop="imageView2/2/w/560/h/560/interlace/1/q/75",
        )
        photo["preview_url"] = qiniu_service.resolve_resource_url(
            qiniu_key=photo.get("qiniu_key"),
            url=photo.get("url"),
            fop="imageView2/2/w/1800/interlace/1/q/90",
        )
        photo.pop("qiniu_key", None)
        photo_list.append(photo)
    payload["photos"] = photo_list
    return payload
