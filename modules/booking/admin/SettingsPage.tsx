import { ActionForm } from "@/components/admin/ActionForm";
import { Field, Panel, Table, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { localDateKey } from "@/lib/time";
import { locations, locationTitle, parseLocationIds } from "../lib/data";
import { addDayOffAction, deleteServiceAction, removeDayOffAction, saveHoursAction, saveServiceAction } from "./actions";
import page from "./booking.module.css";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type ServiceRow = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  durationMin?: number;
  priceText?: string;
  locationIds?: string;
  visible?: boolean;
  sort?: number;
};

function ServiceForm({ s }: { s: ServiceRow }) {
  const selected = parseLocationIds(s.locationIds ?? "[]");
  return (
    <ActionForm action={saveServiceAction} submitLabel={s.id ? "Сохранить услугу" : "Добавить услугу"} resetOnSuccess={!s.id}>
      {s.id ? <input type="hidden" name="id" value={s.id} /> : null}
      <Field label="Название">
        <input className={styles.input} name="title" defaultValue={s.title} required />
      </Field>
      <div className={styles.row}>
        <Field label="Длительность, мин">
          <input className={styles.input} name="durationMin" type="number" min={5} step={5} defaultValue={s.durationMin ?? 60} />
        </Field>
        <Field label="Цена текстом">
          <input className={styles.input} name="priceText" defaultValue={s.priceText} placeholder="от 2 500 ₽" />
        </Field>
        <Field label="Порядок">
          <input className={styles.input} name="sort" type="number" defaultValue={s.sort ?? 0} />
        </Field>
      </div>
      <Field label="Описание">
        <textarea className={styles.textarea} name="description" defaultValue={s.description} />
      </Field>
      <fieldset>
        <legend className={styles.label}>Где оказывается (ничего не отмечено: везде)</legend>
        {locations().map((l) => (
          <label key={l.id} className={styles.row}>
            <input type="checkbox" name="locationIds" value={l.id} defaultChecked={selected.includes(l.id)} /> {l.title}
          </label>
        ))}
      </fieldset>
      <label className={styles.row}>
        <input type="checkbox" name="visible" defaultChecked={s.visible ?? true} /> Показывать на сайте
      </label>
      {s.slug ? <p className={styles.hint}>Адрес: {s.slug}</p> : null}
    </ActionForm>
  );
}

export default async function SettingsPage() {
  await requireSection("booking-settings");
  const [services, hours, dayOffs] = await Promise.all([
    prisma.bookingService.findMany({ orderBy: [{ sort: "asc" }, { title: "asc" }] }),
    prisma.workingHours.findMany(),
    prisma.dayOff.findMany({ where: { date: { gte: localDateKey() } }, orderBy: { date: "asc" } }),
  ]);

  return (
    <>
      <h1>Услуги и часы</h1>

      <Panel title="Услуги для записи" hint="Скрытая услуга не видна на сайте, записи на неё сохраняются.">
        <div className={page.services}>
          {services.map((s) => (
            <details key={s.id} className={page.details}>
              <summary>
                {s.title} · {s.durationMin} мин {s.visible ? "" : "(скрыта)"}
              </summary>
              <ServiceForm s={s} />
              <ActionForm action={deleteServiceAction} submitLabel="Удалить услугу" variant="danger">
                <input type="hidden" name="id" value={s.id} />
              </ActionForm>
            </details>
          ))}
          <details className={page.details} open={services.length === 0}>
            <summary>Новая услуга</summary>
            <ServiceForm s={{}} />
          </details>
        </div>
      </Panel>

      {locations().map((loc) => (
        <Panel key={loc.id} title={`Часы работы: ${loc.title}`} hint="Без часов на день запись в этот день закрыта.">
          <ActionForm action={saveHoursAction} submitLabel="Сохранить часы">
            <input type="hidden" name="locationId" value={loc.id} />
            <div className={page.hours}>
              {WEEKDAYS.map((title, i) => {
                const day = hours.find((h) => h.locationId === loc.id && h.weekday === i + 1);
                return (
                  <div key={title} style={{ display: "contents" }}>
                    <span>{title}</span>
                    <input className={styles.input} type="time" name={`opensAt-${i + 1}`} defaultValue={day?.opensAt ?? "10:00"} aria-label={`${title}: открытие`} />
                    <input className={styles.input} type="time" name={`closesAt-${i + 1}`} defaultValue={day?.closesAt ?? "20:00"} aria-label={`${title}: закрытие`} />
                    <label>
                      <input type="checkbox" name={`dayOff-${i + 1}`} defaultChecked={day ? day.dayOff : i >= 5} /> выходной
                    </label>
                  </div>
                );
              })}
            </div>
          </ActionForm>
        </Panel>
      ))}

      <Panel title="Выходные даты" hint="Праздники, отпуск. В эти дни запись закрыта.">
        {dayOffs.length > 0 ? (
          <Table head={["Дата", "Где", "Заметка", ""]} label="Выходные даты">
            {dayOffs.map((d) => (
              <tr key={d.id}>
                <td>{d.date}</td>
                <td>{d.locationId ? locationTitle(d.locationId) : "везде"}</td>
                <td>{d.note}</td>
                <td>
                  <ActionForm action={removeDayOffAction} submitLabel="Убрать" variant="ghost" inline>
                    <input type="hidden" name="id" value={d.id} />
                  </ActionForm>
                </td>
              </tr>
            ))}
          </Table>
        ) : null}
        <ActionForm action={addDayOffAction} submitLabel="Добавить выходной" resetOnSuccess inline>
          <Field label="Дата">
            <input className={styles.input} type="date" name="date" />
          </Field>
          <Field label="Где">
            <select className={styles.select} name="locationId" defaultValue="">
              <option value="">Везде</option>
              {locations().map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Заметка">
            <input className={styles.input} name="note" />
          </Field>
        </ActionForm>
      </Panel>
    </>
  );
}
