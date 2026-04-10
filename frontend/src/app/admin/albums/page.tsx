"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  adminAddPhoto,
  adminCreateAlbum,
  adminDeleteAlbum,
  adminDeletePhoto,
  adminListAlbums,
  adminListPhotos,
  adminUpdateAlbum,
  fetchOssToken,
  type AdminAlbum,
  type AdminAlbumPayload,
  type AdminPhoto,
  uploadFileToQiniu,
} from "@/lib/api";

const emptyAlbum: AdminAlbumPayload = {
  title: "",
  album_date: null,
  description: "",
  location: "",
  cover_photo_id: null,
  sort_order: 0,
};

function withThumb(url: string) {
  if (!url) return url;
  const fop = "imageView2/2/w/180/h/180/interlace/1/q/75";
  return `${url}${url.includes("?") ? "&" : "?"}${fop}`;
}

export default function AdminAlbumsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [albums, setAlbums] = useState<AdminAlbum[]>([]);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [form, setForm] = useState<AdminAlbumPayload>(emptyAlbum);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoKey, setPhotoKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const refreshAlbums = async (t: string) => setAlbums(await adminListAlbums(t));
  const refreshPhotos = async (t: string, albumId: number) => setPhotos(await adminListPhotos(t, albumId));

  useEffect(() => {
    const t = localStorage.getItem("admin_token") || "";
    if (!t) return router.replace("/admin/login");
    setToken(t);
    refreshAlbums(t);
  }, [router]);

  const submitAlbum = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    const payload: AdminAlbumPayload = {
      ...form,
      title: form.title.trim(),
      location: form.location?.trim() || null,
      description: form.description?.trim() || null,
      album_date: form.album_date?.trim() || null,
    };
    try {
      if (editingAlbumId) {
        await adminUpdateAlbum(token, editingAlbumId, payload);
      } else {
        await adminCreateAlbum(token, payload);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存相册失败");
      return;
    }
    setForm(emptyAlbum);
    setEditingAlbumId(null);
    await refreshAlbums(token);
  };

  const beginEditAlbum = (album: AdminAlbum) => {
    setEditingAlbumId(album.id);
    setForm({
      title: album.title || "",
      album_date: album.album_date,
      description: album.description || "",
      location: album.location || "",
      cover_photo_id: album.cover_photo_id,
      sort_order: album.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditAlbum = () => {
    setEditingAlbumId(null);
    setForm(emptyAlbum);
    setError("");
  };

  const uploadSelectedFiles = async (files: FileList | null) => {
    if (!files || !selectedAlbumId || !token) return;
    setError("");
    setUploading(true);
    try {
      const tokenPayload = await fetchOssToken(token, selectedAlbumId);
      for (const file of Array.from(files)) {
        const uploaded = await uploadFileToQiniu(
          tokenPayload.upload_host,
          tokenPayload.token,
          file,
        );
        const fileUrl = tokenPayload.public_base_url
          ? `${tokenPayload.public_base_url.replace(/\/$/, "")}/${uploaded.key}`
          : uploaded.key;
        await adminAddPhoto(token, selectedAlbumId, {
          qiniu_key: uploaded.key,
          url: fileUrl,
          description: null,
          sort_order: 0,
        });
      }
      await refreshPhotos(token, selectedAlbumId);
      await refreshAlbums(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">相册管理</h1>
      </header>
      <form onSubmit={submitAlbum} className="space-y-2 rounded-xl border border-slate-800 p-4">
        <p className="text-sm text-slate-300">
          {editingAlbumId ? `正在编辑相册 #${editingAlbumId}` : "创建新相册"}
        </p>
        <input className="w-full rounded bg-slate-900 p-2" placeholder="相册标题" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
        <input className="w-full rounded bg-slate-900 p-2" placeholder="地点" value={form.location || ""} onChange={(e)=>setForm({...form,location:e.target.value})} />
        <textarea className="w-full rounded bg-slate-900 p-2" rows={3} placeholder="描述" value={form.description || ""} onChange={(e)=>setForm({...form,description:e.target.value})} />
        <input className="w-full rounded bg-slate-900 p-2" placeholder="日期（YYYY-MM-DD，可选）" value={form.album_date || ""} onChange={(e)=>setForm({...form,album_date:e.target.value})} />
        <div className="flex items-center gap-3">
          <button className="rounded bg-blue-600 px-4 py-2">{editingAlbumId ? "保存更新" : "创建相册"}</button>
          {editingAlbumId ? (
            <button type="button" onClick={cancelEditAlbum} className="rounded border border-slate-700 px-4 py-2 text-slate-200">
              取消编辑
            </button>
          ) : null}
        </div>
      </form>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {albums.map((a) => (
          <li key={a.id} className="rounded border border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-100">{a.title || `相册 ${a.id}`}</p>
              <div className="space-x-2">
                <button className="text-xs text-emerald-300" onClick={()=>beginEditAlbum(a)}>编辑</button>
                <button className="text-xs text-blue-300" onClick={async()=>{setSelectedAlbumId(a.id); if(token) await refreshPhotos(token,a.id);}}>照片</button>
                <button
                  className="text-xs text-red-300"
                  onClick={async () => {
                    if (!token) return;
                    const ok = window.confirm(
                      "确认删除该相册吗？将同步删除关联照片数据和七牛文件。",
                    );
                    if (!ok) return;
                    const result = await adminDeleteAlbum(token, a.id);
                    if (!result.ok) {
                      setError("删除相册失败：可能是七牛删除失败，请稍后重试");
                      return;
                    }
                    if (selectedAlbumId === a.id) {
                      setSelectedAlbumId(null);
                      setPhotos([]);
                    }
                    await refreshAlbums(token);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">{a.location || "未知地点"} · {a.photo_count} 张</p>
          </li>
        ))}
      </ul>

      {selectedAlbumId ? (
        <section className="space-y-3 rounded-xl border border-slate-800 p-4">
          <h2 className="text-sm text-slate-200">相册 #{selectedAlbumId} 照片管理</h2>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="mb-2 text-xs text-slate-400">选择图片后自动上传到七牛并写入照片表</p>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => uploadSelectedFiles(e.target.files)}
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-blue-500"
            />
            {uploading ? <p className="mt-2 text-xs text-blue-300">上传中，请稍候...</p> : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded bg-slate-900 p-2" placeholder="qiniu key" value={photoKey} onChange={(e)=>setPhotoKey(e.target.value)} />
            <input className="rounded bg-slate-900 p-2" placeholder="图片URL" value={photoUrl} onChange={(e)=>setPhotoUrl(e.target.value)} />
          </div>
          <button
            className="rounded bg-blue-600 px-3 py-2 text-sm"
            onClick={async()=>{ if(token && photoKey && photoUrl){ await adminAddPhoto(token, selectedAlbumId,{qiniu_key:photoKey,url:photoUrl,description:null,sort_order:0}); setPhotoKey(""); setPhotoUrl(""); await refreshPhotos(token,selectedAlbumId); await refreshAlbums(token);} }}
          >
            添加照片
          </button>
          <ul className="space-y-2">
            {photos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded border border-slate-800 p-2 text-xs">
                <div className="flex min-w-0 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb_url || withThumb(p.url)}
                    alt={p.description || `photo-${p.id}`}
                    className="h-14 w-14 flex-none rounded object-cover ring-1 ring-slate-700"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-slate-300">{p.url}</p>
                    <p className="truncate text-[11px] text-slate-500">{p.qiniu_key}</p>
                  </div>
                </div>
                <button
                  className="text-red-300"
                  onClick={async () => {
                    if (!token) return;
                    const ok = window.confirm("确认删除这张照片吗？将同步删除七牛上的文件。");
                    if (!ok) return;
                    const result = await adminDeletePhoto(token, p.id);
                    if (!result.ok) {
                      setError("删除失败：可能是七牛删除失败，请稍后重试");
                      return;
                    }
                    await refreshPhotos(token, selectedAlbumId);
                  }}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
