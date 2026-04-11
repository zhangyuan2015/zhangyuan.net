import { GalleryGrid } from "@/components/gallery-grid";
import { fetchPublicAlbumDetail, fetchPublicAlbums } from "@/lib/api";

export default async function GalleryPage() {
  let albums = [] as Awaited<ReturnType<typeof fetchPublicAlbums>>;
  let albumGroups: Array<{
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    albumDate: string | null;
    photos: Array<{
      id: number;
      url: string;
      thumbUrl: string | null;
      previewUrl: string | null;
      description: string | null;
      albumTitle: string;
    }>;
  }> = [];
  try {
    albums = await fetchPublicAlbums();
    const details = await Promise.all(albums.map((album) => fetchPublicAlbumDetail(album.id)));
    albumGroups = details.map((detail) => ({
      id: detail.id,
      title: detail.title || `相册 ${detail.id}`,
      description: detail.description,
      location: detail.location,
      albumDate: detail.album_date,
      photos: detail.photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        thumbUrl: photo.thumb_url || null,
        previewUrl: photo.preview_url || null,
        description: photo.description,
        albumTitle: detail.title || `相册 ${detail.id}`,
      })),
    }));
  } catch {
    albums = [];
    albumGroups = [];
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-50">相册</h1>
      {albumGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center text-sm text-slate-500">
          暂无相册数据
        </div>
      ) : (
        <div className="space-y-10">
          {albumGroups.map((group) => (
            <section key={group.id} className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-slate-100">{group.title}</h2>
                <p className="text-xs text-slate-500">
                  {(group.location || "未知地点") + (group.albumDate ? ` · ${group.albumDate}` : "")}
                </p>
                <p className="text-sm text-slate-400">{group.description || "暂无描述"}</p>
              </div>
              {group.photos.length > 0 ? (
                <GalleryGrid photos={group.photos} />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-xs text-slate-500">
                  该相册暂无照片
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
