import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { Field, Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { GALLERY_PATH } from "../lib/data";
import { deleteGalleryItemAction, saveGalleryItemAction } from "./actions";

type Item = { id?: string; title?: string; description?: string; tag?: string; visible?: boolean; sort?: number };

function ItemForm({ item }: { item: Item }) {
  return (
    <ActionForm action={saveGalleryItemAction} submitLabel={item.id ? "Сохранить" : "Добавить работу"} resetOnSuccess={!item.id}>
      {item.id ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="Название">
        <input className={styles.input} name="title" defaultValue={item.title} />
      </Field>
      <div className={styles.row}>
        <Field label="Группа">
          <input className={styles.input} name="tag" defaultValue={item.tag} placeholder="необязательно" />
        </Field>
        <Field label="Порядок">
          <input className={styles.input} name="sort" type="number" defaultValue={item.sort ?? 0} />
        </Field>
      </div>
      <Field label="Описание">
        <textarea className={styles.textarea} name="description" defaultValue={item.description} rows={3} />
      </Field>
      <label className={styles.row}>
        <input type="checkbox" name="visible" defaultChecked={item.visible ?? true} /> Показывать на сайте
      </label>
    </ActionForm>
  );
}

export default async function GalleryPage() {
  await requireSection("gallery");
  const items = await prisma.galleryItem.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <h1>Работы</h1>
      <p className={styles.hint}>
        На сайте: <Link href={GALLERY_PATH}>{GALLERY_PATH}</Link>. Работа без фото на сайте не показывается.
      </p>
      <Panel>
        <div className={styles.form} style={{ maxWidth: "none" }}>
          {items.map((item) => (
            <details key={item.id}>
              <summary>
                <b>{item.title}</b> {item.visible ? "" : "(скрыта)"}
              </summary>
              <ItemForm item={item} />
              <MediaManager entity="galleryItem" entityId={item.id} />
              <ActionForm action={deleteGalleryItemAction} submitLabel="Удалить работу" variant="danger">
                <input type="hidden" name="id" value={item.id} />
              </ActionForm>
            </details>
          ))}
          <details open={items.length === 0}>
            <summary>Новая работа</summary>
            <p className={styles.hint}>Фото добавляются после сохранения.</p>
            <ItemForm item={{}} />
          </details>
        </div>
      </Panel>
    </>
  );
}
