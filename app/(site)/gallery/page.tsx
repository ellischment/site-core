// Маршрут модуля gallery. Выключенный модуль: proxy отвечает 404 (lib/routing.ts).
import type { Metadata } from "next";
import { GalleryGrid } from "@/modules/gallery/components/GalleryGrid";
import { GALLERY_PATH, getGallery } from "@/modules/gallery/lib/data";
import styles from "../page.module.css";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Работы", alternates: { canonical: GALLERY_PATH } };

export default async function Page() {
  return (
    <main className={styles.main}>
      <h1>Работы</h1>
      <GalleryGrid items={await getGallery()} />
    </main>
  );
}
