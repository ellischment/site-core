import type { ModuleDefinition } from "../types";

export const catalogModule: ModuleDefinition = {
  id: "catalog",
  title: "Каталог",
  sections: [{ slug: "catalog", title: "Каталог", roles: ["owner", "admin", "tech"], order: 20 }],
  cacheMap: { catalogItem: ["catalog"], catalogCategory: ["catalog"] },
  publicPaths: ["/catalog"],
  mediaEntities: { catalogItem: "catalogItem" },
  sitemap: async () => (await import("./lib/data")).catalogSitemap(),
  auditLabels: {
    "catalogItem.save": "Сохранена позиция каталога",
    "catalogItem.delete": "Удалена позиция каталога",
    "catalogCategory.save": "Сохранена категория каталога",
    "catalogCategory.delete": "Удалена категория каталога",
  },
};
