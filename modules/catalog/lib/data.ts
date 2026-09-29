// Чтение каталога для публичных страниц. Помечено тегом catalog: правка в
// админке сбрасывает его (module.ts, cacheMap).

import { cachedRead } from "@/lib/cache";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

export const CATALOG_TAG = "catalog";
export const CATALOG_PATH = "/catalog";

export function catalogTitle(): string {
  const c = config.modules.catalog;
  if (c?.title) return c.title;
  return c?.mode === "products" ? "Товары" : "Услуги";
}

export const getCatalog = cachedRead(["catalog-all"], [CATALOG_TAG], async () => {
  const [categories, items] = await Promise.all([
    prisma.catalogCategory.findMany({ where: { visible: true }, orderBy: [{ sort: "asc" }, { title: "asc" }] }),
    prisma.catalogItem.findMany({ where: { visible: true }, orderBy: [{ sort: "asc" }, { title: "asc" }] }),
  ]);
  const covers = await prisma.media.findMany({
    where: { entity: "catalogItem", entityId: { in: items.map((i) => i.id) }, kind: "image" },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const coverOf = new Map<string, { path: string | null; alt: string | null }>();
  for (const c of covers) if (c.entityId && !coverOf.has(c.entityId)) coverOf.set(c.entityId, { path: c.path, alt: c.alt });
  return {
    categories,
    items: items.map((i) => ({ ...i, cover: coverOf.get(i.id) ?? null })),
  };
});

export const getCatalogItem = cachedRead(["catalog-item"], [CATALOG_TAG], async (slug: string) => {
  const item = await prisma.catalogItem.findUnique({ where: { slug }, include: { category: true } });
  if (!item || !item.visible) return null;
  const photos = await prisma.media.findMany({ where: { entity: "catalogItem", entityId: item.id }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
  return { ...item, photos };
});

export async function catalogSitemap(): Promise<{ path: string; lastModified?: Date }[]> {
  const items = await prisma.catalogItem.findMany({ where: { visible: true }, select: { slug: true, updatedAt: true } });
  return [{ path: CATALOG_PATH }, ...items.map((i) => ({ path: `${CATALOG_PATH}/${i.slug}`, lastModified: i.updatedAt }))];
}
