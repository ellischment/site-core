// Маршрут модуля reviews. Выключенный модуль: proxy отвечает 404 (lib/routing.ts).
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { config } from "@/lib/config";
import { ReviewForm } from "@/modules/reviews/components/ReviewForm";
import { ReviewList } from "@/modules/reviews/components/ReviewList";
import { aggregate, getPublishedReviews, REVIEWS_PATH } from "@/modules/reviews/lib/data";
import styles from "../page.module.css";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Отзывы", alternates: { canonical: REVIEWS_PATH } };

export default async function Page() {
  const reviews = await getPublishedReviews();
  const rating = aggregate(reviews);
  return (
    <main className={styles.main}>
      {/* Средняя оценка только из настоящих отзывов с оценкой; нет оценок: разметки нет. */}
      {rating ? <JsonLd items={[{ "@type": config.seo.businessType, name: config.name, aggregateRating: { "@type": "AggregateRating", ...rating, bestRating: 5 } }]} /> : null}
      <h1>Отзывы</h1>
      <ReviewList reviews={reviews} />
      <section aria-labelledby="review-form">
        <h2 id="review-form">Оставить отзыв</h2>
        <ReviewForm />
      </section>
    </main>
  );
}
