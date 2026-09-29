"use client";

import { useEffect, useRef, useState } from "react";
import { Button, buttonClass } from "@/components/Button";
import styles from "./admin.module.css";

/**
 * Кнопка опасного действия с подтверждением на месте, без модалки. Промах по
 * «удалить» не стирает запись молча: вопрос появляется на месте кнопки, фокус
 * переезжает на «Да», с клавиатуры подтверждение не приходится искать.
 */
export function ConfirmButton({
  label,
  question,
  yes = "Да, удалить",
  disabled,
  submit,
  onConfirm,
}: {
  label: string;
  question: string;
  yes?: string;
  disabled?: boolean;
  /** Кнопка внутри формы с серверным действием: «Да» отправляет эту форму. */
  submit?: boolean;
  /** Кнопка без формы: «Да» зовёт обработчик. */
  onConfirm?: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (asking) yesRef.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <Button variant="ghost" small disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className={styles.confirmBox} role="group" aria-label={question}>
      <span className={styles.confirmQuestion}>{question}</span>
      <button
        ref={yesRef}
        type={submit ? "submit" : "button"}
        className={buttonClass("danger", true)}
        disabled={disabled}
        onClick={submit ? undefined : onConfirm}
      >
        {yes}
      </button>
      <Button variant="ghost" small onClick={() => setAsking(false)}>
        Отмена
      </Button>
    </span>
  );
}
