import type { ModuleDefinition } from "../types";

export const galleryModule: ModuleDefinition = {
  id: "gallery",
  title: "Работы",
  sections: [{ slug: "gallery", title: "Работы", roles: ["owner", "admin", "tech"], order: 50 }],
  cacheMap: { galleryItem: ["gallery"] },
  publicPaths: ["/gallery"],
  mediaEntities: { galleryItem: "galleryItem" },
  sitemap: async () => [{ path: "/gallery" }],
  auditLabels: { "galleryItem.save": "Сохранена работа", "galleryItem.delete": "Удалена работа" },
};
