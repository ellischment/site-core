import { srcSet } from "@/lib/media";
import type { GalleryCard } from "../lib/data";
import styles from "./gallery.module.css";

export function GalleryGrid({ items }: { items: GalleryCard[] }) {
  if (items.length === 0) return <p>Работы скоро появятся.</p>;
  return (
    <ul className={styles.grid}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <figure className={styles.figure}>
            {/* eslint-disable-next-line @next/next/no-img-element -- версии webp уже нарезаны, srcset свой */}
            <img className={styles.photo} src={item.photos[0].path ?? ""} srcSet={srcSet(item.photos[0].path)} sizes="(max-width: 700px) 100vw, 400px" alt={item.photos[0].alt || item.title} loading="lazy" decoding="async" />
            <figcaption className={styles.caption}>
              <b>{item.title}</b>
              {item.tag ? <span className={styles.tag}>{item.tag}</span> : null}
              {item.description ? <span>{item.description}</span> : null}
              {item.photos.length > 1 ? <span className={styles.tag}>ещё фото: {item.photos.length - 1}</span> : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
