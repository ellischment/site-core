// Маршрут модуля catalog. Выключенный модуль: proxy отвечает 404 (lib/routing.ts).
import type { Metadata } from "next";
import { CatalogList } from "@/modules/catalog/components/CatalogList";
import { catalogTitle, CATALOG_PATH, getCatalog } from "@/modules/catalog/lib/data";
import styles from "../page.module.css";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return { title: catalogTitle(), alternates: { canonical: CATALOG_PATH } };
}

export default async function Page() {
  const { categories, items } = await getCatalog();
  return (
    <main className={styles.main}>
      <h1>{catalogTitle()}</h1>
      <CatalogList categories={categories} items={items} />
    </main>
  );
}
