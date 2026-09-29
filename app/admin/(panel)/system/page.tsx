import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Badge, Panel, Table, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { readBackupStatus } from "@/lib/system";
import { TZ } from "@/lib/time";
import { enabledModules } from "@/modules/registry";
import { terminateAllSessions } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Система" };

export default async function SystemPage() {
  await requireSection("system");
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });

  const [backup, sessions, attempts] = await Promise.all([
    readBackupStatus(),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.loginAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <h1>Система</h1>

      <Panel title="Резервная копия базы">
        {backup.found ? (
          <p>
            Последняя копия: {fmt.format(backup.at)}, {Math.round(backup.sizeBytes / 1024)} КБ <Badge tone="ok">есть</Badge>
          </p>
        ) : (
          <p>
            <Badge tone="warn">копий нет</Badge> На сервере копии делает ночной cron (scripts/backup.sh).
          </p>
        )}
      </Panel>

      <Panel title="Модули" hint="Включаются в client.config.ts.">
        <p>{enabledModules().map((m) => m.title).join(", ") || "Ни одного модуля не включено."}</p>
      </Panel>

      <Panel title="Входы" hint={`Сейчас открыто входов: ${sessions}. Если пароль мог утечь, завершите все и смените пароль.`}>
        <ActionForm action={terminateAllSessions} submitLabel="Завершить все входы" variant="danger">
          <input type="hidden" name="confirm" value="yes" />
        </ActionForm>
      </Panel>

      <Panel title="Последние попытки входа" hint="Хранятся 30 дней. Пять неудач подряд с одного адреса блокируют вход на час.">
        {attempts.length === 0 ? (
          <p className={styles.hint}>Пока пусто.</p>
        ) : (
          <Table head={["Когда", "Адрес", "Итог"]} label="Попытки входа">
            {attempts.map((a) => (
              <tr key={a.id}>
                <td>{fmt.format(a.createdAt)}</td>
                <td>{a.ip}</td>
                <td>{a.success ? <Badge tone="ok">вход</Badge> : <Badge tone="bad">неудача</Badge>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
