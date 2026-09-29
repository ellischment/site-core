import type { ModuleDefinition } from "../types";

export const blogModule: ModuleDefinition = {
  id: "blog",
  title: "Блог",
  sections: [{ slug: "blog", title: "Блог", roles: ["owner", "admin", "tech"], order: 30 }],
  cacheMap: { article: ["blog"] },
  publicPaths: ["/blog"],
  mediaEntities: { article: "article" },
  sitemap: async () => (await import("./lib/data")).blogSitemap(),
  auditLabels: {
    "article.save": "Сохранена статья",
    "article.delete": "Удалена статья",
  },
};
