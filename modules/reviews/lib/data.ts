import { z } from "zod";
import { cachedRead } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { embedUrl } from "@/lib/video";

export const REVIEWS_TAG = "reviews";
export const REVIEWS_PATH = "/reviews";
export const RATE_MAX = 3;
export const RATE_MINUTES = 30;
export const REJECTED_KEEP_DAYS = 30;

export const reviewSchema = z.object({
  authorName: z.string().trim().min(2, "Как подписать отзыв").max(60, "Имя не длиннее 60 знаков"),
  text: z.string().trim().min(10, "Напишите хотя бы пару предложений").max(3000, "Отзыв не длиннее 3000 знаков"),
  rating: z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().int().min(1).max(5).optional()),
  consent: z.literal(true, "Нужно согласие на публикацию"),
  website: z.string().max(0, "Похоже на автоматическую отправку").optional(),
});

export type PublicReview = { id: string; authorName: string; text: string; rating: number | null; videoEmbed: string | null; photo: { path: string | null; alt: string | null } | null; publishedAt: string | null };

export const getPublishedReviews = cachedRead(["reviews-published"], [REVIEWS_TAG], async (limit?: number): Promise<PublicReview[]> => {
  const rows = await prisma.review.findMany({
    where: { status: "published" },
    orderBy: [{ sort: "asc" }, { publishedAt: "desc" }],
    take: limit,
  });
  const photos = await prisma.media.findMany({ where: { entity: "review", entityId: { in: rows.map((r) => r.id) }, kind: "image" }, orderBy: { sort: "asc" } });
  return rows.map((r) => {
    const p = photos.find((m) => m.entityId === r.id);
    return {
      id: r.id,
      authorName: r.authorName,
      text: r.text,
      rating: r.rating,
      videoEmbed: r.videoUrl ? embedUrl(r.videoUrl) : null,
      photo: p ? { path: p.path, alt: p.alt } : null,
      publishedAt: r.publishedAt?.toISOString() ?? null,
    };
  });
});

/** Средняя оценка для разметки AggregateRating. Нет оценок: null, поле не выводится. */
export function aggregate(reviews: PublicReview[]): { ratingValue: number; reviewCount: number } | null {
  const rated = reviews.filter((r) => r.rating);
  if (rated.length === 0) return null;
  const sum = rated.reduce((s, r) => s + (r.rating ?? 0), 0);
  return { ratingValue: Math.round((sum / rated.length) * 10) / 10, reviewCount: rated.length };
}

export async function pruneReviews(now: Date = new Date()): Promise<{ ipCleared: number; deleted: number }> {
  const cleared = await prisma.review.updateMany({ where: { ip: { not: null }, createdAt: { lt: new Date(now.getTime() - 60 * 60_000) } }, data: { ip: null } });
  const deleted = await prisma.review.deleteMany({ where: { status: "rejected", updatedAt: { lt: new Date(now.getTime() - REJECTED_KEEP_DAYS * 86_400_000) } } });
  return { ipCleared: cleared.count, deleted: deleted.count };
}
