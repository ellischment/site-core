"use client";

// Вкладка со страницей входа, открытая до выкатки новой версии, отправляет форму
// на серверное действие старой сборки, и Next отвечает «Failed to find Server
// Action». Лечится перезагрузкой: reset() не помогает, он переигрывает рендер с
// той же устаревшей разметкой.
import { useEffect } from "react";
import { Button } from "@/components/Button";
import styles from "@/components/admin/admin.module.css";

export default function LoginError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <h1>Страница устарела</h1>
        <p className={styles.hint}>
          Сайт обновился, пока эта страница была открыта. Обновите её и войдите заново: почта и пароль в порядке.
        </p>
        <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
      </div>
    </main>
  );
}
