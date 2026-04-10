import { fetchPublicSiteSettings } from "@/lib/api";

export default async function AboutPage() {
  let heroIntro = "这里可以写更完整的个人介绍、项目经历或联系方式。";
  try {
    const settings = await fetchPublicSiteSettings();
    if (settings.hero_intro) {
      heroIntro = settings.hero_intro;
    }
  } catch {
    // use fallback content
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          关于
        </h1>
        <p className="max-w-2xl text-slate-400">
          页面内容已接入后台站点设置接口，与首页使用同一数据源。
        </p>
      </header>
      <article className="max-w-2xl space-y-4 leading-relaxed text-slate-300">
        <p>{heroIntro}</p>
      </article>
    </div>
  );
}
