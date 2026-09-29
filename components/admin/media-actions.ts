"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { revalidateEntity } from "@/lib/cache";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { deleteMediaFiles } from "@/lib/media";
import { mediaCacheEntity } from "@/lib/media-entities";

// Действия над фото сущности. entity у Media сбрасывается дополнительно своим
// тегом модуля: panelAction знает только «media», а карточка живёт в теге модуля.

const remove = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "media",
  action: "media.delete",
  run: async (input, tx) => {
    const row = await tx.media.findUnique({ where: { id: input.id } });
    if (!row) throw new ActionError("Фото уже удалено");
    await tx.media.delete({ where: { id: row.id } });
    return { path: row.path, entity: row.entity };
  },
  entityId: (i) => i.id,
});

const setAlt = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1), alt: z.string().trim().max(300, "Описание не длиннее 300 знаков") }),
  entity: "media",
  action: "media.alt",
  run: async (input, tx) => {
    const row = await tx.media.update({ where: { id: input.id }, data: { alt: input.alt || null } });
    return { entity: row.entity };
  },
  entityId: (i) => i.id,
});

const move = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1), dir: z.enum(["up", "down"]) }),
  entity: "media",
  action: "media.move",
  run: async (input, tx) => {
    const row = await tx.media.findUnique({ where: { id: input.id } });
    if (!row) throw new ActionError("Фото не найдено");
    const siblings = await tx.media.findMany({ where: { entity: row.entity, entityId: row.entityId }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
    const i = siblings.findIndex((s) => s.id === row.id);
    const j = input.dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= siblings.length) return { entity: row.entity };
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    for (const [sort, s] of siblings.entries()) await tx.media.update({ where: { id: s.id }, data: { sort } });
    return { entity: row.entity };
  },
  entityId: (i) => i.id,
});

function revalidateOwner(entity: string | null) {
  const cacheEntity = entity ? mediaCacheEntity(entity) : undefined;
  if (cacheEntity) revalidateEntity(cacheEntity);
}

export async function deleteMediaAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await remove(formToObject(fd));
  if (result.ok) {
    await deleteMediaFiles(result.data.path);
    revalidateOwner(result.data.entity);
  }
  return toFormState(result, "Фото удалено");
}

export async function setMediaAltAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await setAlt(formToObject(fd));
  if (result.ok) revalidateOwner(result.data.entity);
  return toFormState(result, "Описание сохранено");
}

export async function moveMediaAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await move(formToObject(fd));
  if (result.ok) revalidateOwner(result.data.entity);
  return toFormState(result, "Порядок изменён");
}
