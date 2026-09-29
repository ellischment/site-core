"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import type { RequestChannel } from "@/lib/config-schema";
import { CHANNEL_LABELS, CONTACT_LABELS } from "../lib/validation";
import styles from "./RequestForm.module.css";

type Fields = "name" | "contact" | "comment" | "consent" | "form";
type Errors = Partial<Record<Fields, string>>;

export type RequestFormProps = {
  kind: string;
  channels: RequestChannel[];
  subject?: string;
  submitLabel?: string;
  doneTitle?: string;
  doneText?: string;
  commentLabel?: string;
  commentPlaceholder?: string;
  /** Адрес политики обработки ПДн. */
  privacyHref?: string;
};

/**
 * Форма заявки. Серверная проверка основная (modules/requests/lib/validation.ts),
 * здесь только быстрые подсказки. Версию согласия ставит сервер.
 */
export function RequestForm({
  kind,
  channels,
  subject,
  submitLabel = "Отправить",
  doneTitle = "Заявка отправлена",
  doneText = "Спасибо! Отвечу в ближайшее время.",
  commentLabel = "Сообщение",
  commentPlaceholder = "Коротко о задаче",
  privacyHref = "/privacy",
}: RequestFormProps) {
  const pathname = usePathname();
  const [channel, setChannel] = useState<RequestChannel>(channels[0]);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  function focusFirst(next: Errors) {
    if (next.name) nameRef.current?.focus();
    else if (next.contact) contactRef.current?.focus();
    else if (next.consent) consentRef.current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      kind,
      subject,
      name: String(data.get("name") ?? ""),
      channel,
      contact: String(data.get("contact") ?? ""),
      comment: String(data.get("comment") ?? "") || undefined,
      consent: data.get("consent") === "on",
      source: pathname,
      website: String(data.get("website") ?? ""),
    };

    const next: Errors = {};
    if (payload.name.trim().length < 2) next.name = "Как к вам обращаться";
    if (!payload.contact.trim()) next.contact = "Оставьте контакт";
    if (!payload.consent) next.consent = "Нужно согласие на обработку данных";
    setErrors(next);
    if (Object.keys(next).length > 0) return focusFirst(next);

    setPending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: { duplicate?: boolean; error?: string; fields?: Errors } = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldErrors = body.fields ?? {};
        const shown: Errors = { ...fieldErrors, form: Object.keys(fieldErrors).length ? undefined : (body.error ?? "Не удалось отправить") };
        setErrors(shown);
        focusFirst(shown);
        return;
      }
      setDone({ duplicate: Boolean(body.duplicate) });
    } catch {
      setErrors({ form: "Нет связи с сервером. Попробуйте ещё раз." });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className={styles.done} role="status">
        <h3>{doneTitle}</h3>
        <p>{done.duplicate ? "Такая заявка уже пришла, второй раз отправлять не нужно." : doneText}</p>
      </div>
    );
  }

  const contact = CONTACT_LABELS[channel];

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>Имя</span>
        <input ref={nameRef} name="name" className={styles.input} autoComplete="name" aria-invalid={Boolean(errors.name)} placeholder="Как к вам обращаться" />
        {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
      </label>

      {channels.length > 1 ? (
        <fieldset className={styles.channels}>
          <legend className={styles.label}>Как удобнее связаться</legend>
          {channels.map((ch) => (
            <button key={ch} type="button" className={styles.channel} aria-pressed={channel === ch} onClick={() => setChannel(ch)}>
              {CHANNEL_LABELS[ch]}
            </button>
          ))}
        </fieldset>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>{contact.label}</span>
        <input
          ref={contactRef}
          name="contact"
          className={styles.input}
          inputMode={contact.inputMode}
          autoComplete={contact.inputMode === "tel" ? "tel" : contact.inputMode === "email" ? "email" : "off"}
          placeholder={contact.placeholder}
          aria-invalid={Boolean(errors.contact)}
        />
        {errors.contact ? <span className={styles.error}>{errors.contact}</span> : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{commentLabel}</span>
        <textarea name="comment" className={styles.textarea} rows={4} placeholder={commentPlaceholder} />
        {errors.comment ? <span className={styles.error}>{errors.comment}</span> : null}
      </label>

      {/* Ловушка для ботов: человек поле не видит и не заполняет. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />

      <label className={styles.consent}>
        <input ref={consentRef} type="checkbox" name="consent" aria-invalid={Boolean(errors.consent)} />
        <span>
          Согласен на обработку персональных данных по <Link href={privacyHref}>политике</Link>. Данные нужны только чтобы ответить.
        </span>
      </label>
      {errors.consent ? <p className={styles.error}>{errors.consent}</p> : null}
      {errors.form ? (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Отправляем" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
