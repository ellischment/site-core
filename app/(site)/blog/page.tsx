// Маршрут модуля blog. Выключенный модуль: proxy отвечает 404 (lib/routing.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList, Pager } from "@/modules/blog/components/ArticleList";
import { BLOG_PATH, getArticlesPage } from "@/modules/blog/lib/data";
import styles from "../page.module.css";

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  const { page } = await searchParams;
  const n = Number(page) || 1;
  return { title: n > 1 ? `Блог, страница ${n}` : "Блог", alternates: { canonical: n > 1 ? `${BLOG_PATH}?page=${n}` : BLOG_PATH } };
}

export default async function Page({ searchParams }: PageProps<"/blog">) {
  const { page } = await searchParams;
  const n = page === undefined ? 1 : Number(page);
  if (!Number.isInteger(n) || n < 1) notFound();
  const data = await getArticlesPage(n);
  if (n > data.pages) notFound();

  return (
    <main className={styles.main}>
      <h1>Блог</h1>
      {data.items.length === 0 ? <p>Статьи скоро появятся.</p> : <ArticleList items={data.items} />}
      <Pager page={n} pages={data.pages} />
    </main>
  );
}
