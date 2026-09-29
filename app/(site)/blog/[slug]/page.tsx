// Маршрут модуля blog: статья. Черновик и несуществующий адрес отвечают 404,
// сменённый адрес опубликованной статьи ведёт на новый (lib/redirects.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { config } from "@/lib/config";
import { renderMarkdown } from "@/lib/markdown";
import { srcSet } from "@/lib/media";
import { redirectIfMoved } from "@/lib/redirects";
import { formatDate } from "@/modules/blog/components/ArticleList";
import styles from "@/modules/blog/components/blog.module.css";
import { BLOG_PATH, getArticle } from "@/modules/blog/lib/data";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return {};
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt || undefined,
    alternates: { canonical: `${BLOG_PATH}/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt || undefined, images: a.cover?.path ? [a.cover.path] : undefined },
  };
}

export default async function Page({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) {
    await redirectIfMoved(`${BLOG_PATH}/${slug}`);
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domains.primary}`;
  return (
    <main className={styles.article}>
      <JsonLd
        items={[
          {
            "@type": "BlogPosting",
            headline: a.title,
            ...(a.excerpt ? { description: a.excerpt } : {}),
            ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
            dateModified: a.updatedAt,
            ...(a.cover?.path ? { image: `${siteUrl}${a.cover.path}` } : {}),
            mainEntityOfPage: `${siteUrl}${BLOG_PATH}/${a.slug}`,
            publisher: { "@type": "Organization", name: config.name },
          },
        ]}
      />
      <p>
        <a href={BLOG_PATH}>← Блог</a>
      </p>
      {a.publishedAt ? <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time> : null}
      <h1>{a.title}</h1>
      {a.cover?.path ? (
        // eslint-disable-next-line @next/next/no-img-element -- версии webp уже нарезаны, srcset свой
        <img className={styles.hero} src={a.cover.path} srcSet={srcSet(a.cover.path)} sizes="(max-width: 800px) 100vw, 760px" alt={a.cover.alt ?? ""} width={a.cover.width ?? undefined} height={a.cover.height ?? undefined} />
      ) : null}
      <div className={styles.prose} dangerouslySetInnerHTML={{ __html: renderMarkdown(a.bodyMarkdown) }} />
    </main>
  );
}
