import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { Field, Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { CATALOG_PATH, catalogTitle } from "../lib/data";
import { deleteCategoryAction, deleteItemAction, saveCategoryAction, saveItemAction } from "./actions";

type Category = { id: string; title: string };
type Item = {
  id?: string;
  categoryId?: string | null;
  title?: string;
  slug?: string;
  short?: string;
  description?: string;
  priceText?: string;
  priceFrom?: number | null;
  duration?: string;
  visible?: boolean;
  sort?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

function ItemForm({ item, categories }: { item: Item; categories: Category[] }) {
  return (
    <ActionForm action={saveItemAction} submitLabel={item.id ? "Сохранить" : "Добавить позицию"} resetOnSuccess={!item.id}>
      {item.id ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="Название">
        <input className={styles.input} name="title" defaultValue={item.title} required />
      </Field>
      <div className={styles.row}>
        <Field label="Категория">
          <select className={styles.select} name="categoryId" defaultValue={item.categoryId ?? ""}>
            <option value="">Без категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Цена текстом">
          <input className={styles.input} name="priceText" defaultValue={item.priceText} placeholder="от 2 500 ₽" />
        </Field>
        <Field label="Цена числом, ₽">
          <input className={styles.input} name="priceFrom" type="number" min={0} defaultValue={item.priceFrom ?? ""} />
        </Field>
        <Field label="Длительность">
          <input className={styles.input} name="duration" defaultValue={item.duration} placeholder="60 минут" />
        </Field>
      </div>
      <Field label="Коротко для карточки">
        <input className={styles.input} name="short" defaultValue={item.short} />
      </Field>
      <Field label="Описание (markdown: **жирный**, списки через «- »)">
        <textarea className={styles.textarea} name="description" defaultValue={item.description} rows={6} />
      </Field>
      <div className={styles.row}>
        <Field label="Адрес страницы">
          <input className={styles.input} name="slug" defaultValue={item.slug} placeholder="из названия" />
        </Field>
        <Field label="Порядок">
          <input className={styles.input} name="sort" type="number" defaultValue={item.sort ?? 0} />
        </Field>
      </div>
      <Field label="Заголовок для поисковиков">
        <input className={styles.input} name="seoTitle" defaultValue={item.seoTitle ?? ""} />
      </Field>
      <Field label="Описание для поисковиков">
        <input className={styles.input} name="seoDescription" defaultValue={item.seoDescription ?? ""} />
      </Field>
      <label className={styles.row}>
        <input type="checkbox" name="visible" defaultChecked={item.visible ?? true} /> Показывать на сайте
      </label>
    </ActionForm>
  );
}

export default async function CatalogPage() {
  await requireSection("catalog");
  const [categories, items] = await Promise.all([
    prisma.catalogCategory.findMany({ orderBy: [{ sort: "asc" }, { title: "asc" }] }),
    prisma.catalogItem.findMany({ orderBy: [{ sort: "asc" }, { title: "asc" }] }),
  ]);

  return (
    <>
      <h1>{catalogTitle()}</h1>
      <p className={styles.hint}>
        На сайте: <Link href={CATALOG_PATH}>{CATALOG_PATH}</Link>. Скрытая позиция на сайте не видна и из карты сайта исчезает.
      </p>

      <Panel title="Позиции">
        <div className={styles.form} style={{ maxWidth: "none" }}>
          {items.map((item) => (
            <details key={item.id}>
              <summary>
                <b>{item.title}</b> {item.priceText ? `· ${item.priceText}` : ""} {item.visible ? "" : "(скрыта)"}
              </summary>
              <ItemForm item={item} categories={categories} />
              <MediaManager entity="catalogItem" entityId={item.id} />
              <ActionForm action={deleteItemAction} submitLabel="Удалить позицию" variant="danger">
                <input type="hidden" name="id" value={item.id} />
              </ActionForm>
            </details>
          ))}
          <details open={items.length === 0}>
            <summary>Новая позиция</summary>
            <p className={styles.hint}>Фото добавляются после сохранения.</p>
            <ItemForm item={{}} categories={categories} />
          </details>
        </div>
      </Panel>

      <Panel title="Категории" hint="Необязательно. Удаление категории не удаляет позиции.">
        {categories.map((c) => (
          <details key={c.id}>
            <summary>{c.title}</summary>
            <ActionForm action={saveCategoryAction} submitLabel="Сохранить категорию">
              <input type="hidden" name="id" value={c.id} />
              <Field label="Название">
                <input className={styles.input} name="title" defaultValue={c.title} />
              </Field>
              <Field label="Адрес">
                <input className={styles.input} name="slug" defaultValue={c.slug} />
              </Field>
              <Field label="Порядок">
                <input className={styles.input} name="sort" type="number" defaultValue={c.sort} />
              </Field>
              <label className={styles.row}>
                <input type="checkbox" name="visible" defaultChecked={c.visible} /> Показывать
              </label>
            </ActionForm>
            <ActionForm action={deleteCategoryAction} submitLabel="Удалить категорию" variant="danger">
              <input type="hidden" name="id" value={c.id} />
            </ActionForm>
          </details>
        ))}
        <ActionForm action={saveCategoryAction} submitLabel="Добавить категорию" resetOnSuccess inline>
          <Field label="Новая категория">
            <input className={styles.input} name="title" />
          </Field>
          <input type="hidden" name="visible" value="on" />
        </ActionForm>
      </Panel>
    </>
  );
}
