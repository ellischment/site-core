import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Badge, Field, Panel, Table, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { ROLE_TITLES, USER_ROLES, type UserRole } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createUser, resetUserPassword, toggleUserActive, updateUserRole } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Доступы" };

function RoleSelect({ value }: { value?: string }) {
  return (
    <select name="role" className={styles.select} defaultValue={value ?? "admin"} aria-label="Роль">
      {USER_ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_TITLES[role]}
        </option>
      ))}
    </select>
  );
}

export default async function SettingsPage() {
  const me = await requireSection("settings");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <h1>Доступы</h1>
      <Panel title="Кто входит в админку" hint="Администратор правит содержимое сайта. Владелец ещё управляет доступами и видит журнал и систему.">
        <Table head={["Почта", "Роль", "Состояние", "Действия"]} label="Доступы">
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.email}
                {u.id === me.id ? " (вы)" : ""}
              </td>
              <td>
                <ActionForm action={updateUserRole} submitLabel="Сменить" variant="ghost" inline>
                  <input type="hidden" name="id" value={u.id} />
                  <RoleSelect value={u.role} />
                </ActionForm>
                <span className={styles.hint}>{ROLE_TITLES[u.role as UserRole] ?? u.role}</span>
              </td>
              <td>{u.active ? <Badge tone="ok">активен</Badge> : <Badge tone="bad">отключён</Badge>}</td>
              <td>
                <ActionForm action={toggleUserActive} submitLabel={u.active ? "Отключить" : "Включить"} variant="ghost" inline>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                </ActionForm>
                <ActionForm action={resetUserPassword} submitLabel="Задать пароль" variant="ghost" inline>
                  <input type="hidden" name="id" value={u.id} />
                  <input className={styles.input} type="password" name="password" placeholder="Новый пароль" aria-label="Новый пароль" autoComplete="new-password" />
                </ActionForm>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel title="Новый доступ" hint="Пароль не короче 10 символов. Передайте его человеку лично и попросите сменить после входа.">
        <ActionForm action={createUser} submitLabel="Создать доступ" resetOnSuccess>
          <Field label="Почта">
            <input className={styles.input} type="email" name="email" autoComplete="off" required />
          </Field>
          <Field label="Пароль">
            <input className={styles.input} type="password" name="password" autoComplete="new-password" minLength={10} required />
          </Field>
          <Field label="Роль">
            <RoleSelect />
          </Field>
        </ActionForm>
      </Panel>
    </>
  );
}
