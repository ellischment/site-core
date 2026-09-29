import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field, adminStyles as styles } from "@/components/admin/Panel";
import { currentUser } from "@/lib/auth";
import { changeOwnPassword } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Сменить пароль" };

export default async function PasswordPage() {
  // Раздела в реестре нет: страница доступна любой роли, layout уже проверил сессию.
  await currentUser();
  return (
    <>
      <h1>Сменить пароль</h1>
      <p className={styles.hint}>После смены все входы завершатся, войдите с новым паролем. Не короче 10 символов.</p>
      <ActionForm action={changeOwnPassword} submitLabel="Сменить пароль">
        <Field label="Текущий пароль">
          <input className={styles.input} type="password" name="current" autoComplete="current-password" required />
        </Field>
        <Field label="Новый пароль">
          <input className={styles.input} type="password" name="password" autoComplete="new-password" minLength={10} required />
        </Field>
      </ActionForm>
    </>
  );
}
