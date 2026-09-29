import { ActionForm } from "@/components/admin/ActionForm";
import { Badge, adminStyles as styles } from "@/components/admin/Panel";
import { CHANNEL_LABELS } from "@/lib/contact";
import { decrypt } from "@/lib/crypto";
import { TZ } from "@/lib/time";
import { locationTitle } from "../lib/data";
import { setBookingStatusAction } from "./actions";
import { BOOKING_STATUSES, BOOKING_STATUS_TITLES, type BookingStatus } from "./statuses";
import page from "./booking.module.css";

type Row = {
  id: string;
  startsAt: Date;
  locationId: string;
  nameEnc: string;
  contactEnc: string;
  channel: string;
  comment: string | null;
  status: string;
  service: { title: string };
};

function safe(value: string): string {
  try {
    return decrypt(value);
  } catch {
    return "не расшифровать";
  }
}

export function BookingList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <p className={styles.hint}>{empty}</p>;
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <ul className={page.list}>
      {rows.map((b) => (
        <li key={b.id} className={page.card}>
          <div className={page.head}>
            <b>{fmt.format(b.startsAt)}</b>
            <span>{b.service.title}</span>
            <span className={styles.hint}>{locationTitle(b.locationId)}</span>
            <Badge tone={b.status === "new" ? "info" : b.status === "cancelled" ? "bad" : "ok"}>{BOOKING_STATUS_TITLES[b.status as BookingStatus] ?? b.status}</Badge>
          </div>
          <p>
            {safe(b.nameEnc)} · {CHANNEL_LABELS[b.channel as keyof typeof CHANNEL_LABELS] ?? b.channel}: {safe(b.contactEnc)}
          </p>
          {b.comment ? <p className={styles.hint}>{b.comment}</p> : null}
          <ActionForm action={setBookingStatusAction} submitLabel="Сменить статус" variant="ghost" inline>
            <input type="hidden" name="id" value={b.id} />
            <select name="status" defaultValue={b.status} className={styles.select} aria-label="Статус записи">
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BOOKING_STATUS_TITLES[s]}
                </option>
              ))}
            </select>
          </ActionForm>
        </li>
      ))}
    </ul>
  );
}
