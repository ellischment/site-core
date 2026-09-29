import { cachedRead } from "@/lib/cache";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

export const BLOG_TAG = "blog";
export const BLOG_PATH = "/blog";

export function perPage(): number {
  return config.modules.blog?.perPage ?? 9;
}

/** Страница списка: опубликованные, свежие сверху. Даты приходят строками (cachedRead), поэтому отдаём ISO. */
export const getArticlesPage = cachedRead(["blog-page"], [BLOG_TAG], async (page: number) => {
  const size = perPage();
  const where = { status: "published" };
  const [total, rows] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * size, take: size }),
  ]);
  const covers = await prisma.media.findMany({
    where: { entity: "article", entityId: { in: rows.map((r) => r.id) }, kind: "image" },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const coverOf = new Map<string, { path: string | null; alt: string | null }>();
  for (const c of covers) if (c.entityId && !coverOf.has(c.entityId)) coverOf.set(c.entityId, { path: c.path, alt: c.alt });
  return {
    total,
    pages: Math.max(1, Math.ceil(total / size)),
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      cover: coverOf.get(r.id) ?? null,
    })),
  };
});

export const getArticle = cachedRead(["blog-article"], [BLOG_TAG], async (slug: string) => {
  const row = await prisma.article.findUnique({ where: { slug } });
  if (!row || row.status !== "published") return null;
  const cover = await prisma.media.findFirst({ where: { entity: "article", entityId: row.id, kind: "image" }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
  return {
    ...row,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    cover: cover ? { path: cover.path, alt: cover.alt, width: cover.width, height: cover.height } : null,
  };
});

export async function blogSitemap(): Promise<{ path: string; lastModified?: Date }[]> {
  const rows = await prisma.article.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } });
  return [{ path: BLOG_PATH }, ...rows.map((r) => ({ path: `${BLOG_PATH}/${r.slug}`, lastModified: r.updatedAt }))];
}
