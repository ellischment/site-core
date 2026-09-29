import { srcSet } from "@/lib/media";
import type { PublicReview } from "../lib/data";
import styles from "./reviews.module.css";

export function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`Оценка ${value} из 5`}>
      <span aria-hidden="true">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>
    </span>
  );
}

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) return <p>Отзывов пока нет.</p>;
  return (
    <ul className={styles.list}>
      {reviews.map((r) => (
        <li key={r.id} className={styles.card}>
          <figure className={styles.figure}>
            {r.photo?.path ? (
              // eslint-disable-next-line @next/next/no-img-element -- версии webp уже нарезаны, srcset свой
              <img className={styles.photo} src={r.photo.path} srcSet={srcSet(r.photo.path)} sizes="(max-width: 700px) 100vw, 360px" alt={r.photo.alt ?? ""} loading="lazy" decoding="async" />
            ) : null}
            {r.videoEmbed ? (
              <div className={styles.video}>
                <iframe src={r.videoEmbed} title={`Видеоотзыв: ${r.authorName}`} loading="lazy" allowFullScreen />
              </div>
            ) : null}
            {r.rating ? <Stars value={r.rating} /> : null}
            <blockquote className={styles.text}>{r.text}</blockquote>
            <figcaption className={styles.author}>{r.authorName}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
