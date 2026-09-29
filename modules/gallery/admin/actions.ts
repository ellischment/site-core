"use server";

import { z } from "zod";
import { panelAction } from "@/lib/action";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { deleteMediaFiles } from "@/lib/media";

const save = panelAction({
  roles: ALL_ROLES,
  schema: z.object({
    id: z.string().optional(),
    title: z.string().trim().min(1, "Нужно название").max(120),
    description: z.string().trim().max(1000).default(""),
    tag: z.string().trim().max(60).default(""),
    visible: z.boolean(),
    sort: z.coerce.number().int().default(0),
  }),
  entity: "galleryItem",
  action: "galleryItem.save",
  run: async (input, tx) => {
    const { id, ...data } = input;
    const row = id ? await tx.galleryItem.update({ where: { id }, data }) : await tx.galleryItem.create({ data });
    return { id: row.id };
  },
  entityId: (_i, o) => o.id,
});

const remove = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "galleryItem",
  action: "galleryItem.delete",
  run: async (input, tx) => {
    const photos = await tx.media.findMany({ where: { entity: "galleryItem", entityId: input.id }, select: { path: true } });
    await tx.media.deleteMany({ where: { entity: "galleryItem", entityId: input.id } });
    await tx.galleryItem.deleteMany({ where: { id: input.id } });
    return { paths: photos.map((p) => p.path) };
  },
  entityId: (i) => i.id,
});

export async function saveGalleryItemAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await save(formToObject(fd, ["visible"])), "Сохранено");
}

export async function deleteGalleryItemAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await remove(formToObject(fd));
  if (result.ok) await Promise.all(result.data.paths.map((p) => deleteMediaFiles(p)));
  return toFormState(result, "Работа удалена");
}
