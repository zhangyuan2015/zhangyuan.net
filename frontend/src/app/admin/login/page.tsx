"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { initAdmin, loginAdmin } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      let tokenPayload;
      try {
        tokenPayload = await loginAdmin(username, password);
      } catch {
        // 管理员可能尚未初始化，自动尝试 init 一次
        tokenPayload = await initAdmin(username, password);
      }
      window.localStorage.setItem("admin_token", tokenPayload.access_token);
      router.push("/admin/settings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-slate-50">管理后台</h1>
        <p className="text-sm text-slate-500">
          首次登录将自动初始化管理员账号，成功后跳转系统设置
        </p>
      </header>
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm text-slate-400">
            用户名
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-blue-500/0 transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
            placeholder="admin"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-slate-400">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-blue-500/0 transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
            placeholder="••••••••"
            required
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
        >
          {loading ? "处理中..." : "登录 / 初始化"}
        </button>
      </form>
    </div>
  );
}
