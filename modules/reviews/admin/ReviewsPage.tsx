import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { Badge, Field, Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { REVIEWS_PATH } from "../lib/data";
import { deleteReviewAction, saveReviewAction } from "./actions";

const STATUS: Record<string, string> = { pending: "на проверке", published: "опубликован", rejected: "отклонён" };

type Review = {
  id?: string;
  authorName?: string;
  text?: string;
  rating?: number | null;
  videoUrl?: string | null;
  status?: string;
  consentAt?: Date | null;
  sort?: number;
};

function ReviewForm({ r }: { r: Review }) {
  return (
    <ActionForm action={saveReviewAction} submitLabel={r.id ? "Сохранить" : "Добавить отзыв"} resetOnSuccess={!r.id}>
      {r.id ? <input type="hidden" name="id" value={r.id} /> : null}
      <Field label="Подпись (имя автора)">
        <input className={styles.input} name="authorName" defaultValue={r.authorName} />
      </Field>
      <Field label="Текст">
        <textarea className={styles.textarea} name="text" defaultValue={r.text} rows={5} />
      </Field>
      <div className={styles.row}>
        <Field label="Оценка 1–5">
          <input className={styles.input} name="rating" type="number" min={1} max={5} defaultValue={r.rating ?? ""} />
        </Field>
        <Field label="Статус">
          <select className={styles.select} name="status" defaultValue={r.status ?? "published"}>
            {Object.entries(STATUS).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Порядок">
          <input className={styles.input} name="sort" type="number" defaultValue={r.sort ?? 0} />
        </Field>
      </div>
      <Field label="Видео (ссылка VK Видео, Rutube, YouTube)">
        <input className={styles.input} name="videoUrl" defaultValue={r.videoUrl ?? ""} />
      </Field>
      <label className={styles.row}>
        <input type="checkbox" name="consent" defaultChecked={Boolean(r.consentAt)} /> Автор согласен на публикацию имени и текста
      </label>
    </ActionForm>
  );
}

export default async function ReviewsPage() {
  await requireSection("reviews");
  const reviews = await prisma.review.findMany({ orderBy: [{ status: "asc" }, { sort: "asc" }, { createdAt: "desc" }] });
  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <>
      <h1>Отзывы</h1>
      <p className={styles.hint}>
        На сайте: <Link href={REVIEWS_PATH}>{REVIEWS_PATH}</Link> и блок на главной. Отзывы с сайта ждут проверки: {pending}. Отклонённые удаляются сами через 30 дней.
      </p>
      <Panel>
        <div className={styles.form} style={{ maxWidth: "none" }}>
          {reviews.map((r) => (
            <details key={r.id} open={r.status === "pending"}>
              <summary>
                <b>{r.authorName}</b> <Badge tone={r.status === "published" ? "ok" : r.status === "pending" ? "info" : "bad"}>{STATUS[r.status] ?? r.status}</Badge>{" "}
                {r.text.slice(0, 80)}
              </summary>
              <ReviewForm r={r} />
              <MediaManager entity="review" entityId={r.id} />
              <ActionForm action={deleteReviewAction} submitLabel="Удалить отзыв" variant="danger">
                <input type="hidden" name="id" value={r.id} />
              </ActionForm>
            </details>
          ))}
          <details open={reviews.length === 0}>
            <summary>Добавить отзыв вручную</summary>
            <ReviewForm r={{}} />
          </details>
        </div>
      </Panel>
    </>
  );
}
