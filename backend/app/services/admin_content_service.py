from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services import qiniu_service

def list_posts(db: Session) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id, title, slug, summary, content, cover_url, status, published_at
            FROM posts
            ORDER BY updated_at DESC, id DESC
            """
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def get_post(db: Session, post_id: int) -> dict | None:
    row = db.execute(
        text(
            """
            SELECT id, title, slug, summary, content, cover_url, status, published_at
            FROM posts
            WHERE id = :id
            LIMIT 1
            """
        ),
        {"id": post_id},
    ).mappings().first()
    return dict(row) if row else None


def create_post(db: Session, payload: dict) -> dict:
    db.execute(
        text(
            """
            INSERT INTO posts(title, slug, summary, content, cover_url, status, published_at)
            VALUES(:title, :slug, :summary, :content, :cover_url, :status, :published_at)
            """
        ),
        payload,
    )
    db.commit()
    row = db.execute(text("SELECT * FROM posts WHERE slug=:slug ORDER BY id DESC LIMIT 1"), {"slug": payload["slug"]}).mappings().first()
    return dict(row)


def update_post(db: Session, post_id: int, payload: dict) -> dict | None:
    result = db.execute(
        text(
            """
            UPDATE posts
            SET title=:title, slug=:slug, summary=:summary, content=:content, cover_url=:cover_url,
                status=:status, published_at=:published_at
            WHERE id=:id
            """
        ),
        {**payload, "id": post_id},
    )
    if result.rowcount == 0:
        return None
    db.commit()
    row = db.execute(text("SELECT * FROM posts WHERE id=:id"), {"id": post_id}).mappings().first()
    return dict(row) if row else None


def delete_post(db: Session, post_id: int) -> bool:
    result = db.execute(text("DELETE FROM posts WHERE id=:id"), {"id": post_id})
    db.commit()
    return result.rowcount > 0


def list_albums(db: Session) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT a.id, a.title, a.album_date, a.description, a.location, a.cover_photo_id, a.sort_order,
                   COUNT(p.id) AS photo_count
            FROM albums a
            LEFT JOIN photos p ON p.album_id = a.id
            GROUP BY a.id, a.title, a.album_date, a.description, a.location, a.cover_photo_id, a.sort_order
            ORDER BY a.sort_order ASC, a.id DESC
            """
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def create_album(db: Session, payload: dict) -> dict:
    db.execute(
        text(
            """
            INSERT INTO albums(title, album_date, description, location, cover_photo_id, sort_order)
            VALUES(:title, :album_date, :description, :location, :cover_photo_id, :sort_order)
            """
        ),
        payload,
    )
    db.commit()
    row = db.execute(text("SELECT id FROM albums ORDER BY id DESC LIMIT 1")).mappings().first()
    album_id = int(row["id"])
    return get_album(db, album_id)


def get_album(db: Session, album_id: int) -> dict | None:
    row = db.execute(
        text(
            """
            SELECT a.id, a.title, a.album_date, a.description, a.location, a.cover_photo_id, a.sort_order,
                   COUNT(p.id) AS photo_count
            FROM albums a
            LEFT JOIN photos p ON p.album_id = a.id
            WHERE a.id=:id
            GROUP BY a.id, a.title, a.album_date, a.description, a.location, a.cover_photo_id, a.sort_order
            """
        ),
        {"id": album_id},
    ).mappings().first()
    return dict(row) if row else None


def update_album(db: Session, album_id: int, payload: dict) -> dict | None:
    result = db.execute(
        text(
            """
            UPDATE albums
            SET title=:title, album_date=:album_date, description=:description,
                location=:location, cover_photo_id=:cover_photo_id, sort_order=:sort_order
            WHERE id=:id
            """
        ),
        {**payload, "id": album_id},
    )
    if result.rowcount == 0:
        return None
    db.commit()
    return get_album(db, album_id)


def delete_album(db: Session, album_id: int) -> bool:
    rows = db.execute(
        text("SELECT qiniu_key FROM photos WHERE album_id=:album_id"),
        {"album_id": album_id},
    ).mappings().all()

    # 先删除七牛文件，确保对象存储与数据库一致。
    for row in rows:
        qiniu_key = str(row.get("qiniu_key") or "")
        if not qiniu_key:
            continue
        deleted = qiniu_service.delete_object(qiniu_key)
        if not deleted:
            return False

    # albums -> photos 是 ON DELETE CASCADE，删除相册时会级联删除照片记录
    result = db.execute(text("DELETE FROM albums WHERE id=:id"), {"id": album_id})
    db.commit()
    return result.rowcount > 0


def list_photos(db: Session, album_id: int) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id, album_id, qiniu_key, url, description, sort_order
            FROM photos
            WHERE album_id=:album_id
            ORDER BY sort_order ASC, id ASC
            """
        ),
        {"album_id": album_id},
    ).mappings().all()
    payload = []
    for r in rows:
        item = dict(r)
        item["url"] = qiniu_service.resolve_resource_url(
            qiniu_key=item.get("qiniu_key"),
            url=item.get("url"),
        )
        item["thumb_url"] = qiniu_service.resolve_resource_url(
            qiniu_key=item.get("qiniu_key"),
            url=item.get("url"),
            fop="imageView2/2/w/180/h/180/interlace/1/q/75",
        )
        payload.append(item)
    return payload


def add_photo(db: Session, album_id: int, payload: dict) -> dict:
    db.execute(
        text(
            """
            INSERT INTO photos(album_id, qiniu_key, url, description, sort_order)
            VALUES(:album_id, :qiniu_key, :url, :description, :sort_order)
            """
        ),
        {"album_id": album_id, **payload},
    )
    db.commit()
    row = db.execute(text("SELECT * FROM photos WHERE album_id=:album_id ORDER BY id DESC LIMIT 1"), {"album_id": album_id}).mappings().first()
    return dict(row)


def delete_photo(db: Session, photo_id: int) -> bool:
    row = db.execute(
        text("SELECT qiniu_key FROM photos WHERE id=:id LIMIT 1"),
        {"id": photo_id},
    ).mappings().first()
    if not row:
        return False

    qiniu_key = str(row.get("qiniu_key") or "")
    if qiniu_key:
        deleted = qiniu_service.delete_object(qiniu_key)
        if not deleted:
            # 七牛删除失败时，不删除数据库记录，避免数据不一致
            return False

    result = db.execute(text("DELETE FROM photos WHERE id=:id"), {"id": photo_id})
    db.commit()
    return result.rowcount > 0
