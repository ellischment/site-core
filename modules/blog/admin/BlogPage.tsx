import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { Badge, Field, Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { ARTICLE_COVER } from "@/lib/cover-notice";
import { prisma } from "@/lib/db";
import { TZ } from "@/lib/time";
import { BLOG_PATH } from "../lib/data";
import { deleteArticleAction, saveArticleAction } from "./actions";

type Article = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  bodyMarkdown?: string;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

function ArticleForm({ a }: { a: Article }) {
  return (
    <ActionForm action={saveArticleAction} submitLabel={a.id ? "Сохранить" : "Создать статью"} resetOnSuccess={!a.id}>
      {a.id ? <input type="hidden" name="id" value={a.id} /> : null}
      <Field label="Заголовок">
        <input className={styles.input} name="title" defaultValue={a.title} required />
      </Field>
      <Field label="Анонс для списка и поисковиков">
        <textarea className={styles.textarea} name="excerpt" defaultValue={a.excerpt} rows={2} />
      </Field>
      <Field label="Текст (markdown: ## подзаголовок, **жирный**, - список, [ссылка](https://…), ![описание](/uploads/…))">
        <textarea className={styles.textarea} name="bodyMarkdown" defaultValue={a.bodyMarkdown} rows={16} />
      </Field>
      <Field label="Адрес">
        <input className={styles.input} name="slug" defaultValue={a.slug} placeholder="из заголовка" />
      </Field>
      <Field label="Заголовок для поисковиков">
        <input className={styles.input} name="seoTitle" defaultValue={a.seoTitle ?? ""} />
      </Field>
      <Field label="Описание для поисковиков">
        <input className={styles.input} name="seoDescription" defaultValue={a.seoDescription ?? ""} />
      </Field>
      <label className={styles.row}>
        <input type="checkbox" name="published" defaultChecked={a.status === "published"} /> Опубликовать на сайте
      </label>
    </ActionForm>
  );
}

export default async function BlogPage() {
  await requireSection("blog");
  const articles = await prisma.article.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, dateStyle: "medium" });

  return (
    <>
      <h1>Блог</h1>
      <p className={styles.hint}>
        На сайте: <Link href={BLOG_PATH}>{BLOG_PATH}</Link>. Черновик на сайте не виден. Сменили адрес опубликованной статьи: старая ссылка сама ведёт на новую.
      </p>
      <Panel>
        <div className={styles.form} style={{ maxWidth: "none" }}>
          {articles.map((a) => (
            <details key={a.id}>
              <summary>
                <b>{a.title}</b> {a.status === "published" ? <Badge tone="ok">опубликована {a.publishedAt ? fmt.format(a.publishedAt) : ""}</Badge> : <Badge tone="warn">черновик</Badge>}
              </summary>
              <ArticleForm a={a} />
              <p className={styles.hint}>Обложка: первое фото. Чтобы вставить фото в текст, скопируйте его адрес из списка ниже.</p>
              <MediaManager entity="article" entityId={a.id} shape={ARTICLE_COVER} />
              <ActionForm action={deleteArticleAction} submitLabel="Удалить статью" variant="danger">
                <input type="hidden" name="id" value={a.id} />
              </ActionForm>
            </details>
          ))}
          <details open={articles.length === 0}>
            <summary>Новая статья</summary>
            <ArticleForm a={{}} />
          </details>
        </div>
      </Panel>
    </>
  );
}
