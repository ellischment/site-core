import { describe, expect, it } from "vitest";
import { aggregate, reviewSchema, type PublicReview } from "./data";

const r = (rating: number | null): PublicReview => ({ id: "x", authorName: "А", text: "т", rating, videoEmbed: null, photo: null, publishedAt: null });

describe("отзывы", () => {
  it("средняя оценка только по отзывам с оценкой, без оценок null", () => {
    expect(aggregate([r(5), r(4), r(null)])).toEqual({ ratingValue: 4.5, reviewCount: 2 });
    expect(aggregate([r(null)])).toBeNull();
  });

  it("без согласия на публикацию отзыв не принимается", () => {
    expect(reviewSchema.safeParse({ authorName: "Мария", text: "Очень понравилось, спасибо!", consent: false }).success).toBe(false);
  });

  it("оценка вне 1..5 отклоняется, пустая допустима", () => {
    expect(reviewSchema.safeParse({ authorName: "Мария", text: "Очень понравилось, спасибо!", consent: true, rating: 7 }).success).toBe(false);
    expect(reviewSchema.safeParse({ authorName: "Мария", text: "Очень понравилось, спасибо!", consent: true, rating: "" }).success).toBe(true);
  });
});
