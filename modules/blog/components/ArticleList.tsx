import Link from "next/link";
import { srcSet } from "@/lib/media";
import { TZ } from "@/lib/time";
import { BLOG_PATH } from "../lib/data";
import styles from "./blog.module.css";

export type ArticleCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  cover: { path: string | null; alt: string | null } | null;
};

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function ArticleList({ items }: { items: ArticleCard[] }) {
  return (
    <ul className={styles.grid}>
      {items.map((a) => (
        <li key={a.id} className={styles.card}>
          {a.cover?.path ? (
            // eslint-disable-next-line @next/next/no-img-element -- версии webp уже нарезаны, srcset свой
            <img className={styles.cover} src={a.cover.path} srcSet={srcSet(a.cover.path)} sizes="(max-width: 700px) 100vw, 400px" alt={a.cover.alt ?? ""} loading="lazy" decoding="async" />
          ) : null}
          <div className={styles.body}>
            {a.publishedAt ? <time dateTime={a.publishedAt} className={styles.date}>{formatDate(a.publishedAt)}</time> : null}
            <h2 className={styles.title}>
              <Link href={`${BLOG_PATH}/${a.slug}`} className={styles.link}>
                {a.title}
              </Link>
            </h2>
            {a.excerpt ? <p className={styles.excerpt}>{a.excerpt}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Pager({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (p: number) => (p === 1 ? BLOG_PATH : `${BLOG_PATH}?page=${p}`);
  return (
    <nav className={styles.pager} aria-label="Страницы блога">
      {page > 1 ? <Link href={href(page - 1)}>← Новее</Link> : <span />}
      <span>
        {page} из {pages}
      </span>
      {page < pages ? <Link href={href(page + 1)}>Раньше →</Link> : <span />}
    </nav>
  );
}
