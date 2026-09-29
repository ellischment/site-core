import type { Metadata } from "next";
import { redirect } from "next/navigation";
import styles from "@/components/admin/admin.module.css";
import { currentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const user = await currentUser();
  const params = await searchParams;

  const rawNext = params.next;
  const next = typeof rawNext === "string" && rawNext.startsWith("/admin") && !rawNext.startsWith("//") ? rawNext : "/admin";

  if (user) {
    redirect(next);
  }

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <h1>Вход</h1>
        <p className={styles.hint}>{config.name}</p>
        {params.changed === "1" ? (
          <p className={styles.success} role="status">
            Пароль изменён. Войдите с новым.
          </p>
        ) : null}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
