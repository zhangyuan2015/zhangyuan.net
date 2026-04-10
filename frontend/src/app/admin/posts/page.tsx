"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  adminCreatePost,
  adminDeletePost,
  adminGetPost,
  adminListPosts,
  adminUpdatePost,
  type AdminPost,
  type AdminPostPayload,
} from "@/lib/api";

const emptyForm: AdminPostPayload = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  cover_url: "",
  status: "draft",
  published_at: null,
};

export default function AdminPostsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [form, setForm] = useState<AdminPostPayload>(emptyForm);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async (t: string) => setPosts(await adminListPosts(t));

  useEffect(() => {
    const t = localStorage.getItem("admin_token") || "";
    if (!t) return router.replace("/admin/login");
    setToken(t);
    refresh(t).catch((e) => setError(e.message));
  }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSubmitting(true);
    try {
      const payload: AdminPostPayload = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content.trim(),
        summary: form.summary?.trim() || null,
        cover_url: form.cover_url?.trim() || null,
        published_at: form.published_at?.trim() || null,
      };
      if (editingId) {
        await adminUpdatePost(token, editingId, payload);
      } else {
        await adminCreatePost(token, payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存文章失败");
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = async (postId: number) => {
    if (!token) return;
    setError("");
    try {
      const post = await adminGetPost(token, postId);
      setEditingId(postId);
      setForm({
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        cover_url: post.cover_url,
        status: post.status,
        published_at: post.published_at,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载文章失败");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">博客管理</h1>
      </header>
      <form onSubmit={submit} className="space-y-2 rounded-xl border border-slate-800 p-4">
        <p className="text-sm text-slate-300">
          {editingId ? `正在编辑文章 #${editingId}` : "创建新文章"}
        </p>
        <input required className="w-full rounded bg-slate-900 p-2" placeholder="标题" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
        <input required className="w-full rounded bg-slate-900 p-2" placeholder="slug（例如 hello-world）" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})} />
        <input className="w-full rounded bg-slate-900 p-2" placeholder="摘要" value={form.summary || ""} onChange={(e)=>setForm({...form,summary:e.target.value})} />
        <input className="w-full rounded bg-slate-900 p-2" placeholder="封面 URL（可选）" value={form.cover_url || ""} onChange={(e)=>setForm({...form,cover_url:e.target.value})} />
        <input className="w-full rounded bg-slate-900 p-2" placeholder="发布时间（可选，ISO 格式）" value={form.published_at || ""} onChange={(e)=>setForm({...form,published_at:e.target.value})} />
        <textarea required className="w-full rounded bg-slate-900 p-2" rows={6} placeholder="Markdown 内容" value={form.content} onChange={(e)=>setForm({...form,content:e.target.value})} />
        <select className="rounded bg-slate-900 p-2" value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as "draft" | "published"})}>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <div className="flex items-center gap-3">
          <button disabled={submitting} className="rounded bg-blue-600 px-4 py-2 disabled:opacity-60">
            {editingId ? "保存更新" : "创建文章"}
          </button>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="rounded border border-slate-700 px-4 py-2 text-slate-200">
              取消编辑
            </button>
          ) : null}
        </div>
      </form>
      {error ? <p className="text-red-400">{error}</p> : null}
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded border border-slate-800 p-3">
            <div>
              <p className="text-slate-100">{p.title}</p>
              <p className="text-xs text-slate-400">{p.slug} · {p.status}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="text-xs text-blue-300 hover:text-blue-200"
                onClick={async ()=>{ await beginEdit(p.id); }}
              >
                编辑
              </button>
              <button
                className="text-xs text-red-300 hover:text-red-200"
                onClick={async ()=>{ if(token){ await adminDeletePost(token,p.id); await refresh(token);} }}
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
