import { cachedRead } from "@/lib/cache";
import { prisma } from "@/lib/db";

export const GALLERY_TAG = "gallery";
export const GALLERY_PATH = "/gallery";

export type GalleryCard = { id: string; title: string; description: string; tag: string; photos: { path: string | null; alt: string | null; width: number | null; height: number | null }[] };

export const getGallery = cachedRead(["gallery-all"], [GALLERY_TAG], async (limit?: number): Promise<GalleryCard[]> => {
  const items = await prisma.galleryItem.findMany({ where: { visible: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }], take: limit });
  const photos = await prisma.media.findMany({
    where: { entity: "galleryItem", entityId: { in: items.map((i) => i.id) }, kind: "image" },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  return items
    .map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      tag: i.tag,
      photos: photos.filter((p) => p.entityId === i.id).map((p) => ({ path: p.path, alt: p.alt, width: p.width, height: p.height })),
    }))
    // Работа без фото в галерее ничего не показывает: не выводим пустую карточку.
    .filter((i) => i.photos.length > 0);
});
