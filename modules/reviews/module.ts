import type { ModuleDefinition } from "../types";

export const reviewsModule: ModuleDefinition = {
  id: "reviews",
  title: "Отзывы",
  sections: [{ slug: "reviews", title: "Отзывы", roles: ["owner", "admin", "tech"], order: 40 }],
  cacheMap: { review: ["reviews"] },
  publicPaths: ["/reviews"],
  apiPaths: ["/api/reviews"],
  mediaEntities: { review: "review" },
  cron: [{ id: "prune-personal", title: "Уборка ПДн отзывов", run: async () => (await import("./lib/data")).pruneReviews() }],
  sitemap: async () => [{ path: "/reviews" }],
  auditLabels: { "review.save": "Сохранён отзыв", "review.delete": "Удалён отзыв" },
};
