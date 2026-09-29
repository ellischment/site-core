import styles from "@/components/admin/admin.module.css";

/**
 * Ответ 403 для разделов, закрытых по роли. Страница зовёт forbidden(), Next
 * отдаёт настоящий 403 (флаг experimental.authInterrupts в next.config.ts).
 * Код держится, только пока над админкой нет границы Suspense: loading.tsx
 * сюда не ставить.
 */
export default function Forbidden() {
  return (
    <>
      <h1>Недостаточно прав</h1>
      <p className={styles.denied}>
        Этот раздел доступен владельцу. Если доступ нужен по работе, попросите владельца изменить вашу роль в разделе «Доступы».
      </p>
    </>
  );
}
