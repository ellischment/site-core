// Загрузка фото из админки: POST multipart (file, entity, entityId, alt).
// Роль проверяется на сервере, тип файла по содержимому (lib/media.ts).

import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { AccessError, requireUser } from "@/lib/auth";
import { revalidateEntityFromRoute } from "@/lib/cache";
import { ALL_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { MediaValidationError, processUploadedImage } from "@/lib/media";
import { mediaCacheEntity } from "@/lib/media-entities";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let user;
  try {
    user = await requireUser(ALL_ROLES);
  } catch (error: unknown) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }

  const form = await request.formData();
  const file = form.get("file");
  const entity = String(form.get("entity") ?? "");
  const entityId = String(form.get("entityId") ?? "");
  const alt = String(form.get("alt") ?? "").trim().slice(0, 300);

  const cacheEntity = mediaCacheEntity(entity);
  if (!cacheEntity || !entityId) return NextResponse.json({ error: "Неизвестно, к чему загружать фото" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });

  let processed;
  try {
    processed = await processUploadedImage(file);
  } catch (error: unknown) {
    const message = error instanceof MediaValidationError ? error.message : "Не удалось обработать файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const last = await prisma.media.findFirst({ where: { entity, entityId }, orderBy: { sort: "desc" } });
  const media = await prisma.media.create({
    data: {
      kind: "image",
      path: processed.path,
      alt: alt || null,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      entity,
      entityId,
      sort: (last?.sort ?? -1) + 1,
    },
  });

  await writeAudit({ userId: user.id, action: "media.upload", entity, entityId, payload: { mediaId: media.id } });
  revalidateEntityFromRoute(cacheEntity);

  return NextResponse.json({ id: media.id, path: media.path, width: media.width, height: media.height });
}
