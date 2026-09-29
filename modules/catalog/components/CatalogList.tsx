import Link from "next/link";
import { srcSet } from "@/lib/media";
import { CATALOG_PATH } from "../lib/data";
import styles from "./catalog.module.css";

export type CatalogCard = {
  id: string;
  slug: string;
  title: string;
  short: string;
  priceText: string;
  duration: string;
  categoryId: string | null;
  cover: { path: string | null; alt: string | null } | null;
};

export function CatalogCards({ items }: { items: CatalogCard[] }) {
  return (
    <ul className={styles.grid}>
      {items.map((item) => (
        <li key={item.id} className={styles.card}>
          {item.cover?.path ? (
            // eslint-disable-next-line @next/next/no-img-element -- версии webp уже нарезаны, srcset свой
            <img className={styles.cover} src={item.cover.path} srcSet={srcSet(item.cover.path)} sizes="(max-width: 700px) 100vw, 360px" alt={item.cover.alt ?? ""} loading="lazy" decoding="async" />
          ) : null}
          <div className={styles.body}>
            <h3 className={styles.title}>
              <Link href={`${CATALOG_PATH}/${item.slug}`} className={styles.link}>
                {item.title}
              </Link>
            </h3>
            {item.short ? <p className={styles.short}>{item.short}</p> : null}
            <p className={styles.meta}>{[item.priceText, item.duration].filter(Boolean).join(" · ")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Каталог по категориям. Позиции без категории идут последним блоком. */
export function CatalogList({ categories, items }: { categories: { id: string; title: string; slug: string; description: string }[]; items: CatalogCard[] }) {
  if (items.length === 0) return <p>Скоро здесь появятся позиции.</p>;
  const groups = categories.map((c) => ({ ...c, items: items.filter((i) => i.categoryId === c.id) })).filter((g) => g.items.length > 0);
  const rest = items.filter((i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId));

  if (groups.length === 0) return <CatalogCards items={items} />;
  return (
    <>
      {groups.length > 1 ? (
        <nav className={styles.chips} aria-label="Категории">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.slug}`} className={styles.chip}>
              {g.title}
            </a>
          ))}
        </nav>
      ) : null}
      {groups.map((g) => (
        <section key={g.id} id={g.slug} className={styles.group} aria-labelledby={`cat-${g.slug}`}>
          <h2 id={`cat-${g.slug}`}>{g.title}</h2>
          {g.description ? <p className={styles.short}>{g.description}</p> : null}
          <CatalogCards items={g.items} />
        </section>
      ))}
      {rest.length > 0 ? (
        <section className={styles.group} aria-label="Другое">
          <CatalogCards items={rest} />
        </section>
      ) : null}
    </>
  );
}
