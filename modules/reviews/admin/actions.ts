"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { deleteMediaFiles } from "@/lib/media";
import { embedUrl } from "@/lib/video";

const saveSchema = z.object({
  id: z.string().optional(),
  authorName: z.string().trim().min(2, "Подпись от 2 символов").max(60),
  text: z.string().trim().min(2, "Текст отзыва пустой").max(3000),
  rating: z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.number().int().min(1).max(5).optional()),
  videoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || embedUrl(v) !== null, "Видео: ссылка на VK Видео, Rutube или YouTube")
    .optional(),
  status: z.enum(["pending", "published", "rejected"]),
  consent: z.boolean(),
  sort: z.coerce.number().int().default(0),
});

const save = panelAction({
  roles: ALL_ROLES,
  schema: saveSchema,
  entity: "review",
  action: "review.save",
  run: async (input, tx) => {
    const before = input.id ? await tx.review.findUnique({ where: { id: input.id } }) : null;
    const consentAt = input.consent ? (before?.consentAt ?? new Date()) : null;
    // Без согласия автора имя и текст не публикуем: сервер отказывает, а не только форма.
    if (input.status === "published" && !consentAt) {
      throw new ActionError("Нельзя опубликовать без согласия автора на публикацию");
    }
    const data = {
      authorName: input.authorName,
      text: input.text,
      rating: input.rating ?? null,
      videoUrl: input.videoUrl || null,
      status: input.status,
      consentAt,
      sort: input.sort,
      publishedAt: input.status === "published" ? (before?.publishedAt ?? new Date()) : before?.publishedAt ?? null,
    };
    const row = before ? await tx.review.update({ where: { id: before.id }, data }) : await tx.review.create({ data: { ...data, source: "admin" } });
    return { id: row.id };
  },
  entityId: (_i, o) => o.id,
});

const remove = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "review",
  action: "review.delete",
  run: async (input, tx) => {
    const photos = await tx.media.findMany({ where: { entity: "review", entityId: input.id }, select: { path: true } });
    await tx.media.deleteMany({ where: { entity: "review", entityId: input.id } });
    await tx.review.deleteMany({ where: { id: input.id } });
    return { paths: photos.map((p) => p.path) };
  },
  entityId: (i) => i.id,
});

export async function saveReviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await save(formToObject(fd, ["consent"])), "Сохранено");
}

export async function deleteReviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await remove(formToObject(fd));
  if (result.ok) await Promise.all(result.data.paths.map((p) => deleteMediaFiles(p)));
  return toFormState(result, "Отзыв удалён");
}
