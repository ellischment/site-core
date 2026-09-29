"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { deleteMediaFiles } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { CATALOG_PATH } from "../lib/data";

const slugField = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9-]*$/, "Адрес: латиница, цифры и дефис")
  .optional();

const categorySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Название от 2 символов").max(80),
  slug: slugField,
  description: z.string().trim().max(1000).default(""),
  visible: z.boolean(),
  sort: z.coerce.number().int().default(0),
});

const itemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().optional(),
  title: z.string().trim().min(2, "Название от 2 символов").max(120),
  slug: slugField,
  short: z.string().trim().max(200).default(""),
  description: z.string().trim().max(20000).default(""),
  priceText: z.string().trim().max(60).default(""),
  priceFrom: z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.number().int().min(0).optional()),
  duration: z.string().trim().max(60).default(""),
  visible: z.boolean(),
  sort: z.coerce.number().int().default(0),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});

const saveCategory = panelAction({
  roles: ALL_ROLES,
  schema: categorySchema,
  entity: "catalogCategory",
  action: "catalogCategory.save",
  run: async (input, tx) => {
    const slug = input.slug || slugify(input.title) || `c-${Date.now()}`;
    if (await tx.catalogCategory.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } })) {
      throw new ActionError("Такой адрес уже у другой категории");
    }
    const data = { title: input.title, slug, description: input.description, visible: input.visible, sort: input.sort };
    const row = input.id ? await tx.catalogCategory.update({ where: { id: input.id }, data }) : await tx.catalogCategory.create({ data });
    return { id: row.id };
  },
  entityId: (_i, o) => o.id,
});

const deleteCategory = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "catalogCategory",
  action: "catalogCategory.delete",
  // Позиции остаются, просто без категории (onDelete: SetNull).
  run: async (input, tx) => {
    await tx.catalogCategory.deleteMany({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (i) => i.id,
});

const saveItem = panelAction({
  roles: ALL_ROLES,
  schema: itemSchema,
  entity: "catalogItem",
  action: "catalogItem.save",
  run: async (input, tx) => {
    const slug = input.slug || slugify(input.title) || `i-${Date.now()}`;
    if (await tx.catalogItem.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } })) {
      throw new ActionError("Такой адрес уже у другой позиции, поправьте его");
    }
    const data = {
      categoryId: input.categoryId || null,
      title: input.title,
      slug,
      short: input.short,
      description: input.description,
      priceText: input.priceText,
      priceFrom: input.priceFrom ?? null,
      duration: input.duration,
      visible: input.visible,
      sort: input.sort,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
    };
    const row = input.id ? await tx.catalogItem.update({ where: { id: input.id }, data }) : await tx.catalogItem.create({ data });
    return { id: row.id, slug: row.slug };
  },
  entityId: (_i, o) => o.id,
  paths: (_i, o) => [`${CATALOG_PATH}/${o.slug}`],
});

const deleteItem = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "catalogItem",
  action: "catalogItem.delete",
  run: async (input, tx) => {
    const photos = await tx.media.findMany({ where: { entity: "catalogItem", entityId: input.id }, select: { path: true } });
    await tx.media.deleteMany({ where: { entity: "catalogItem", entityId: input.id } });
    await tx.catalogItem.deleteMany({ where: { id: input.id } });
    return { paths: photos.map((p) => p.path) };
  },
  entityId: (i) => i.id,
});

export async function saveCategoryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await saveCategory(formToObject(fd, ["visible"])), "Категория сохранена");
}

export async function deleteCategoryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await deleteCategory(formToObject(fd)), "Категория удалена");
}

export async function saveItemAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await saveItem(formToObject(fd, ["visible"])), "Сохранено");
}

export async function deleteItemAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await deleteItem(formToObject(fd));
  if (result.ok) await Promise.all(result.data.paths.map((p) => deleteMediaFiles(p)));
  return toFormState(result, "Позиция удалена");
}
