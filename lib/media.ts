// lib/media.ts
// Загруженные изображения: проверка типа по содержимому → проверка размера →
// sharp → версии 400/800/1600 в webp → запись в базу. Файлы лежат в UPLOAD_DIR
// (на сервере постоянный том), отдаёт их app/uploads/[...path]/route.ts.

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "./db";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_WIDTHS = [400, 800, 1600] as const;

export function uploadRoot(): string {
  return process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
}

export class MediaValidationError extends Error {}

/** Тип по первым байтам файла, не по расширению: имя ничего не решает. */
async function detectImageFormat(buffer: Buffer): Promise<string | null> {
  const meta = await sharp(buffer).metadata().catch(() => null);
  if (!meta?.format) return null;
  return ["jpeg", "png", "webp"].includes(meta.format) ? meta.format : null;
}

export type ProcessedImage = { path: string; width: number; height: number; bytes: number };

/**
 * Приводит изображение к webp и создаёт версии 400/800/1600 (крупнее оригинала
 * не растягивает). Возвращает путь к самой крупной: страница выбирает нужную
 * по srcset, поэтому в базе одна запись.
 */
export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  if (file.size > MAX_UPLOAD_BYTES) throw new MediaValidationError("Файл больше 10 МБ");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!(await detectImageFormat(buffer))) {
    throw new MediaValidationError("Файл не похож на изображение JPEG, PNG или WebP");
  }

  const now = new Date();
  const sub = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const dir = path.join(uploadRoot(), sub);
  await mkdir(dir, { recursive: true });

  const baseName = randomUUID();
  const original = sharp(buffer).rotate();
  const meta = await original.metadata();
  const sourceWidth = meta.width ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];

  let best: ProcessedImage | null = null;
  for (const width of IMAGE_WIDTHS) {
    if (width > sourceWidth && width !== IMAGE_WIDTHS[0]) continue;
    const output = await original
      .clone()
      .resize({ width: Math.min(width, sourceWidth), withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const fileName = `${baseName}-${width}.webp`;
    await writeFile(path.join(dir, fileName), output.data);
    best = {
      path: `/uploads/${sub.replace(/\\/g, "/")}/${fileName}`,
      width: output.info.width,
      height: output.info.height,
      bytes: output.data.byteLength,
    };
  }
  if (!best) throw new MediaValidationError("Не удалось обработать изображение");
  return best;
}

/** Все версии файла по пути основной: /uploads/2026/09/<uuid>-1600.webp → три файла. */
export function versionPaths(mainPath: string): string[] {
  const m = /^\/uploads\/(.+)-(400|800|1600)\.webp$/.exec(mainPath);
  if (!m) return [];
  return IMAGE_WIDTHS.map((w) => path.join(uploadRoot(), `${m[1]}-${w}.webp`));
}

/** Удаление фото: строка в базе и все версии файла. */
export async function deleteMediaFiles(mainPath: string | null): Promise<void> {
  if (!mainPath) return;
  await Promise.all(versionPaths(mainPath).map((file) => rm(file, { force: true })));
}

/** srcset для <img>: только версии не шире записанной в пути. */
export function srcSet(mainPath: string | null | undefined): string | undefined {
  const m = mainPath ? /^(\/uploads\/.+)-(400|800|1600)\.webp$/.exec(mainPath) : null;
  if (!m) return undefined;
  const widths = IMAGE_WIDTHS.filter((w) => w <= Number(m[2]));
  return widths.map((w) => `${m[1]}-${w}.webp ${w}w`).join(", ");
}

/** Фото сущности модуля по порядку. */
export function mediaFor(entity: string, entityId: string) {
  return prisma.media.findMany({ where: { entity, entityId }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
}

/** Первые фото для списка сущностей одним запросом: обложки карточек. */
export async function coversFor(entity: string, ids: string[]): Promise<Map<string, { path: string | null; alt: string | null; width: number | null; height: number | null }>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.media.findMany({
    where: { entity, entityId: { in: ids }, kind: "image" },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const out = new Map<string, { path: string | null; alt: string | null; width: number | null; height: number | null }>();
  for (const r of rows) if (r.entityId && !out.has(r.entityId)) out.set(r.entityId, r);
  return out;
}
