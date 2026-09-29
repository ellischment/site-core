"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { CHANNEL_LABELS, CONTACT_LABELS } from "@/lib/contact";
import type { RequestChannel } from "@/lib/config-schema";
import styles from "./BookingWidget.module.css";

export type WidgetService = { id: string; title: string; durationMin: number; priceText: string; description: string; locationIds: string[] };
export type WidgetLocation = { id: string; title: string; address?: string; online: boolean };
export type WidgetDate = { key: string; label: string };

type Errors = Partial<Record<"name" | "contact" | "consent" | "form", string>>;

/**
 * Запись в четыре шага на одном экране: услуга, место, дата и время, контакты.
 * Свободное время спрашивается у сервера на каждую дату; при отправке сервер
 * проверяет его ещё раз под локом, поэтому занятый слот честно отвечает 409.
 */
export function BookingWidget({
  services,
  locations,
  dates,
  channels,
  privacyHref = "/privacy",
}: {
  services: WidgetService[];
  locations: WidgetLocation[];
  dates: WidgetDate[];
  channels: RequestChannel[];
  privacyHref?: string;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const service = services.find((s) => s.id === serviceId);
  const serviceLocations = locations.filter((l) => service?.locationIds.includes(l.id));
  const [locationId, setLocationId] = useState(serviceLocations[0]?.id ?? "");
  const [date, setDate] = useState(dates[0]?.key ?? "");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [channel, setChannel] = useState<RequestChannel>(channels[0]);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [reload, setReload] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);

  // Место по умолчанию меняется вместе с услугой, если старое ей не подходит.
  const effectiveLocation = serviceLocations.some((l) => l.id === locationId) ? locationId : (serviceLocations[0]?.id ?? "");

  useEffect(() => {
    if (!serviceId || !effectiveLocation || !date) return;
    const controller = new AbortController();
    fetch(`/api/booking?service=${encodeURIComponent(serviceId)}&location=${encodeURIComponent(effectiveLocation)}&date=${date}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((body: { slots?: string[] }) => {
        setSlots(body.slots ?? []);
        setTime("");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [serviceId, effectiveLocation, date, reload]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      serviceId,
      locationId: effectiveLocation,
      date,
      time,
      name: String(data.get("name") ?? ""),
      channel,
      contact: String(data.get("contact") ?? ""),
      comment: String(data.get("comment") ?? "") || undefined,
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
    };
    const next: Errors = {};
    if (!time) next.form = "Выберите время";
    if (payload.name.trim().length < 2) next.name = "Как к вам обращаться";
    if (!payload.contact.trim()) next.contact = "Оставьте контакт";
    if (!payload.consent) next.consent = "Нужно согласие на обработку данных";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.name) nameRef.current?.focus();
      else if (next.contact) contactRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/booking", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body: { error?: string; fields?: Errors } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ ...(body.fields ?? {}), form: body.fields ? undefined : body.error });
        if (res.status === 409) setReload((n) => n + 1);
        return;
      }
      setDone(true);
    } catch {
      setErrors({ form: "Нет связи с сервером. Попробуйте ещё раз." });
    } finally {
      setPending(false);
    }
  }

  if (services.length === 0) return <p>Запись скоро откроется.</p>;

  if (done) {
    const loc = locations.find((l) => l.id === effectiveLocation);
    const day = dates.find((d) => d.key === date)?.label ?? date;
    return (
      <div className={styles.done} role="status">
        <h2>Вы записаны</h2>
        <p>
          {service?.title}, {day}, {time}
          {loc ? `, ${loc.title}` : ""}. Мы свяжемся, чтобы подтвердить.
        </p>
      </div>
    );
  }

  const contact = CONTACT_LABELS[channel];

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <fieldset className={styles.step}>
        <legend>Услуга</legend>
        <div className={styles.options}>
          {services.map((s) => (
            <label key={s.id} className={styles.option}>
              <input type="radio" name="service" checked={s.id === serviceId} onChange={() => setServiceId(s.id)} />
              <span>
                <b>{s.title}</b>
                <span className={styles.muted}>
                  {s.durationMin} мин{s.priceText ? ` · ${s.priceText}` : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {serviceLocations.length > 1 ? (
        <fieldset className={styles.step}>
          <legend>Где</legend>
          <div className={styles.options}>
            {serviceLocations.map((l) => (
              <label key={l.id} className={styles.option}>
                <input type="radio" name="location" checked={l.id === effectiveLocation} onChange={() => setLocationId(l.id)} />
                <span>
                  <b>{l.title}</b>
                  {l.address ? <span className={styles.muted}>{l.address}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className={styles.step}>
        <legend>Дата</legend>
        <div className={styles.chips}>
          {dates.map((d) => (
            <button key={d.key} type="button" className={styles.chip} aria-pressed={d.key === date} onClick={() => setDate(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.step}>
        <legend>Время</legend>
        {slots === null ? (
          <p className={styles.muted}>Смотрим свободное время…</p>
        ) : slots.length === 0 ? (
          <p className={styles.muted}>На эту дату свободного времени нет. Выберите другую.</p>
        ) : (
          <div className={styles.chips}>
            {slots.map((t) => (
              <button key={t} type="button" className={styles.chip} aria-pressed={t === time} onClick={() => setTime(t)}>
                {t}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className={styles.step}>
        <legend>Контакты</legend>
        <label className={styles.field}>
          <span className={styles.label}>Имя</span>
          <input ref={nameRef} name="name" className={styles.input} autoComplete="name" aria-invalid={Boolean(errors.name)} />
          {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
        </label>
        {channels.length > 1 ? (
          <div className={styles.chips} role="group" aria-label="Как удобнее связаться">
            {channels.map((ch) => (
              <button key={ch} type="button" className={styles.chip} aria-pressed={ch === channel} onClick={() => setChannel(ch)}>
                {CHANNEL_LABELS[ch]}
              </button>
            ))}
          </div>
        ) : null}
        <label className={styles.field}>
          <span className={styles.label}>{contact.label}</span>
          <input ref={contactRef} name="contact" className={styles.input} inputMode={contact.inputMode} placeholder={contact.placeholder} aria-invalid={Boolean(errors.contact)} />
          {errors.contact ? <span className={styles.error}>{errors.contact}</span> : null}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Комментарий</span>
          <textarea name="comment" className={styles.input} rows={3} />
        </label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
        <label className={styles.consent}>
          <input type="checkbox" name="consent" aria-invalid={Boolean(errors.consent)} />
          <span>
            Согласен на обработку персональных данных по <Link href={privacyHref}>политике</Link>.
          </span>
        </label>
        {errors.consent ? <span className={styles.error}>{errors.consent}</span> : null}
      </fieldset>

      {errors.form ? (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Записываем" : time ? `Записаться на ${time}` : "Записаться"}
        </Button>
      </div>
    </form>
  );
}
