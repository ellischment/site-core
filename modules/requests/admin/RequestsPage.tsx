import { ActionForm } from "@/components/admin/ActionForm";
import { Badge, Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { config } from "@/lib/config";
import { OWNER_ROLES } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { isTelegramConfigured } from "@/lib/telegram";
import { TZ } from "@/lib/time";
import { kindTitle } from "../lib/notify";
import { CHANNEL_LABELS } from "@/lib/contact";
import { deleteRequest, sendTestNotification, setRequestStatus } from "./actions";
import { NOTIFY_TITLES, REQUEST_STATUSES, STATUS_TITLES, type RequestStatus } from "./statuses";
import page from "./requests.module.css";

const PAGE = 100;

function safeDecrypt(value: string): string {
  try {
    return decrypt(value);
  } catch {
    return "не расшифровать (сменился ключ?)";
  }
}

/** Ссылка, по которой владелец сразу пишет или звонит гостю. */
function contactHref(channel: string, contact: string): string | null {
  if (contact.startsWith("@")) return `https://t.me/${contact.slice(1)}`;
  if (channel === "email") return `mailto:${contact}`;
  if (contact.startsWith("+")) return channel === "whatsapp" ? `https://wa.me/${contact.slice(1)}` : `tel:${contact}`;
  return null;
}

export default async function RequestsPage({ status }: { status?: string }) {
  const user = await requireSection("requests");
  const filter = REQUEST_STATUSES.includes(status as RequestStatus) ? (status as RequestStatus) : undefined;

  const [rows, counts] = await Promise.all([
    prisma.request.findMany({ where: filter ? { status: filter } : { status: { not: "spam" } }, orderBy: { createdAt: "desc" }, take: PAGE }),
    prisma.request.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
  const keepDays = config.modules.requests?.keepDays ?? 180;

  return (
    <>
      <h1>Заявки</h1>
      <p className={styles.hint}>
        Заявки с сайта. Контакты хранятся зашифрованными {keepDays} дней, потом заявка удаляется сама.
      </p>

      <nav className={page.filters} aria-label="Фильтр по статусу">
        <a href="/admin/requests" aria-current={!filter ? "page" : undefined}>
          Все, кроме спама
        </a>
        {REQUEST_STATUSES.map((s) => (
          <a key={s} href={`/admin/requests?status=${s}`} aria-current={filter === s ? "page" : undefined}>
            {STATUS_TITLES[s]} ({count(s)})
          </a>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Panel>
          <p className={styles.hint}>Заявок нет.</p>
        </Panel>
      ) : (
        <ul className={page.list}>
          {rows.map((r) => {
            const contact = safeDecrypt(r.contactEnc);
            const href = contactHref(r.channel, contact);
            return (
              <li key={r.id} className={page.card}>
                <div className={page.head}>
                  <b>{safeDecrypt(r.nameEnc)}</b>
                  <span className={styles.hint}>{fmt.format(r.createdAt)}</span>
                  <Badge tone={r.status === "new" ? "info" : r.status === "done" ? "ok" : r.status === "spam" ? "bad" : "warn"}>
                    {STATUS_TITLES[r.status as RequestStatus] ?? r.status}
                  </Badge>
                </div>
                <p className={page.meta}>
                  {kindTitle(r.kind)}
                  {r.subject ? `: ${r.subject}` : ""} · {CHANNEL_LABELS[r.channel as keyof typeof CHANNEL_LABELS] ?? r.channel}:{" "}
                  {href ? <a href={href}>{contact}</a> : contact}
                </p>
                {r.comment ? <p className={page.comment}>{r.comment}</p> : null}
                <p className={styles.hint}>
                  {NOTIFY_TITLES[r.notifyStatus] ?? r.notifyStatus}
                  {r.source ? ` · со страницы ${r.source}` : ""}
                </p>
                <div className={page.actions}>
                  <ActionForm action={setRequestStatus} submitLabel="Сменить статус" variant="ghost" inline>
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} className={styles.select} aria-label="Статус заявки">
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_TITLES[s]}
                        </option>
                      ))}
                    </select>
                  </ActionForm>
                  <ActionForm action={deleteRequest} submitLabel="Удалить" variant="danger" inline>
                    <input type="hidden" name="id" value={r.id} />
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {OWNER_ROLES.includes(user.role) ? (
        <Panel
          title="Уведомления в Telegram"
          hint="В уведомлении нет имени и контактов гостя: только вид заявки. Контакты смотрите здесь."
        >
          <p>{isTelegramConfigured() ? <Badge tone="ok">настроено</Badge> : <Badge tone="warn">не настроено: нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID</Badge>}</p>
          <ActionForm action={sendTestNotification} submitLabel="Отправить тестовое" variant="ghost" />
        </Panel>
      ) : null}
    </>
  );
}
