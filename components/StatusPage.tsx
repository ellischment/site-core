import type { ReactNode } from "react";
import styles from "./StatusPage.module.css";

/** Страница состояния: 404, ошибка, обслуживание. Одна вёрстка на все три. */
export function StatusPage({ code, title, text, children }: { code: string; title: string; text: string; children?: ReactNode }) {
  return (
    <main className={styles.main}>
      <p className={styles.code}>{code}</p>
      <h1>{title}</h1>
      <p>{text}</p>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </main>
  );
}
