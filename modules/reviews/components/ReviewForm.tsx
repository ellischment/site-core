"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import styles from "./reviews.module.css";

type Errors = Partial<Record<"authorName" | "text" | "consent" | "form", string>>;

/** Отзыв гостя. Уходит на модерацию: на сайте появится после проверки. */
export function ReviewForm({ privacyHref = "/privacy" }: { privacyHref?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      authorName: String(data.get("authorName") ?? ""),
      text: String(data.get("text") ?? ""),
      rating: String(data.get("rating") ?? ""),
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
    };
    const next: Errors = {};
    if (payload.authorName.trim().length < 2) next.authorName = "Как подписать отзыв";
    if (payload.text.trim().length < 10) next.text = "Напишите хотя бы пару предложений";
    if (!payload.consent) next.consent = "Нужно согласие на публикацию";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body: { error?: string; fields?: Errors } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ ...(body.fields ?? {}), form: body.fields ? undefined : body.error });
        return;
      }
      setDone(true);
    } catch {
      setErrors({ form: "Нет связи с сервером. Попробуйте ещё раз." });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className={styles.done} role="status">
        Спасибо! Отзыв появится на сайте после проверки.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>Как подписать отзыв</span>
        <input name="authorName" className={styles.input} aria-invalid={Boolean(errors.authorName)} />
        {errors.authorName ? <span className={styles.error}>{errors.authorName}</span> : null}
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Отзыв</span>
        <textarea name="text" rows={5} className={styles.input} aria-invalid={Boolean(errors.text)} />
        {errors.text ? <span className={styles.error}>{errors.text}</span> : null}
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Оценка (необязательно)</span>
        <select name="rating" className={styles.input} defaultValue="">
          <option value="">Без оценки</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} из 5
            </option>
          ))}
        </select>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
      <label className={styles.consent}>
        <input type="checkbox" name="consent" />
        <span>
          Согласен на публикацию имени и текста отзыва на сайте, <Link href={privacyHref}>политика</Link>.
        </span>
      </label>
      {errors.consent ? <span className={styles.error}>{errors.consent}</span> : null}
      {errors.form ? (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Отправляем" : "Отправить отзыв"}
        </Button>
      </div>
    </form>
  );
}
