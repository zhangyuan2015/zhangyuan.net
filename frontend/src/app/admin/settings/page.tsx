"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fetchAdminSiteSettings,
  type SiteSettingsPayload,
  updateAdminSiteSettings,
} from "@/lib/api";

type SocialItem = { name: string; url: string };

export default function AdminSettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [heroIntro, setHeroIntro] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialItem[]>([{ name: "", url: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedToken = window.localStorage.getItem("admin_token") || "";
    if (!savedToken) {
      router.replace("/admin/login");
      return;
    }
    setToken(savedToken);
    fetchAdminSiteSettings(savedToken)
      .then((data) => {
        setSiteTitle(data.site_title || "");
        setHeroIntro(data.hero_intro || "");
        setSocialLinks(data.social_links.length > 0 ? data.social_links : [{ name: "", url: "" }]);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");

    const payload: SiteSettingsPayload = {
      site_title: siteTitle.trim() ? siteTitle.trim() : null,
      hero_intro: heroIntro.trim() ? heroIntro.trim() : null,
      social_links: socialLinks.filter((item) => item.name.trim() && item.url.trim()),
    };

    try {
      const updated = await updateAdminSiteSettings(token, payload);
      setSiteTitle(updated.site_title || "");
      setHeroIntro(updated.hero_intro || "");
      setSocialLinks(updated.social_links.length > 0 ? updated.social_links : [{ name: "", url: "" }]);
      setMessage("保存成功");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400">正在加载系统设置...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-50">系统设置</h1>
        <p className="text-sm text-slate-400">
          配置首页个人简介与社交链接。公开页面会实时读取这些配置。
        </p>
      </header>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="siteTitle">
            博客标题
          </label>
          <input
            id="siteTitle"
            value={siteTitle}
            onChange={(event) => setSiteTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
            placeholder="例如：我的博客"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="heroIntro">
            个人简介
          </label>
          <textarea
            id="heroIntro"
            value={heroIntro}
            onChange={(event) => setHeroIntro(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
            placeholder="请输入首页展示的自我介绍"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">社交链接</label>
            <button
              type="button"
              onClick={() => setSocialLinks((prev) => [...prev, { name: "", url: "" }])}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + 新增一行
            </button>
          </div>
          <div className="space-y-2">
            {socialLinks.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_auto]">
                <input
                  value={item.name}
                  onChange={(event) =>
                    setSocialLinks((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)),
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="名称"
                />
                <input
                  value={item.url}
                  onChange={(event) =>
                    setSocialLinks((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, url: event.target.value } : row)),
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() =>
                    setSocialLinks((prev) =>
                      prev.length <= 1 ? [{ name: "", url: "" }] : prev.filter((_, i) => i !== index),
                    )
                  }
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-3 py-2 text-xs text-emerald-300">
            {message}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-300">
            返回首页
          </Link>
        </div>
      </form>
    </div>
  );
}
