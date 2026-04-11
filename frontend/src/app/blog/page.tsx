import { fetchPublicPosts } from "@/lib/api";

export default async function BlogPage() {
  let posts = [] as Awaited<ReturnType<typeof fetchPublicPosts>>;
  try {
    posts = await fetchPublicPosts();
  } catch {
    posts = [];
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-50">博客</h1>
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center text-sm text-slate-500">
          暂无已发布文章
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h2 className="text-base font-medium text-slate-100">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{post.summary || "暂无摘要"}</p>
              <p className="mt-3 text-xs text-slate-500">
                {post.published_at ? new Date(post.published_at).toLocaleString() : "未设置发布时间"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
