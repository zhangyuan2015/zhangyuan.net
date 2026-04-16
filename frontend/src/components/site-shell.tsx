import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} zhangyuan.net · yvan.zhang
        </p>
      </footer>
    </div>
  );
}
