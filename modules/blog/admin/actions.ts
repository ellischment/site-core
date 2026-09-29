"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { deleteMediaFiles } from "@/lib/media";
import { rememberMove } from "@/lib/redirects";
import { slugify } from "@/lib/slug";
import { BLOG_PATH } from "../lib/data";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Заголовок от 2 символов").max(160),
  slug: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-z0-9-]*$/, "Адрес: латиница, цифры и дефис")
    .optional(),
  excerpt: z.string().trim().max(400, "Анонс не длиннее 400 знаков").default(""),
  bodyMarkdown: z.string().max(100_000).default(""),
  published: z.boolean(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});

const save = panelAction({
  roles: ALL_ROLES,
  schema: articleSchema,
  entity: "article",
  action: "article.save",
  run: async (input, tx) => {
    const slug = input.slug || slugify(input.title) || `post-${Date.now()}`;
    if (await tx.article.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } })) {
      throw new ActionError("Такой адрес уже у другой статьи");
    }
    if (input.published && !input.bodyMarkdown.trim()) throw new ActionError("Пустую статью опубликовать нельзя");

    const before = input.id ? await tx.article.findUnique({ where: { id: input.id } }) : null;
    const status = input.published ? "published" : "draft";
    const data = {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      bodyMarkdown: input.bodyMarkdown,
      status,
      // Дата публикации ставится один раз, при первой публикации.
      publishedAt: input.published ? (before?.publishedAt ?? new Date()) : (before?.publishedAt ?? null),
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
    };
    const row = before ? await tx.article.update({ where: { id: before.id }, data }) : await tx.article.create({ data });
    // Опубликованная статья сменила адрес: старая ссылка ведёт на новую.
    if (before && before.slug !== slug && before.status === "published") {
      await rememberMove(tx, `${BLOG_PATH}/${before.slug}`, `${BLOG_PATH}/${slug}`);
    }
    return { id: row.id, slug: row.slug, oldSlug: before?.slug };
  },
  entityId: (_i, o) => o.id,
  paths: (_i, o) => [BLOG_PATH, `${BLOG_PATH}/${o.slug}`, ...(o.oldSlug ? [`${BLOG_PATH}/${o.oldSlug}`] : [])],
});

const remove = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "article",
  action: "article.delete",
  run: async (input, tx) => {
    const photos = await tx.media.findMany({ where: { entity: "article", entityId: input.id }, select: { path: true } });
    await tx.media.deleteMany({ where: { entity: "article", entityId: input.id } });
    await tx.article.deleteMany({ where: { id: input.id } });
    return { paths: photos.map((p) => p.path) };
  },
  entityId: (i) => i.id,
});

export async function saveArticleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await save(formToObject(fd, ["published"])), "Сохранено");
}

export async function deleteArticleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await remove(formToObject(fd));
  if (result.ok) await Promise.all(result.data.paths.map((p) => deleteMediaFiles(p)));
  return toFormState(result, "Статья удалена");
}
