"use client";

// Переключатель схемы: как в системе, светлая, тёмная. Выбор хранится в
// localStorage и ставится атрибутом data-theme на <html> (до отрисовки его
// ставит скрипт в app/layout.tsx, чтобы страница не мигала).

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Scheme = "system" | "light" | "dark";
const ORDER: Scheme[] = ["system", "light", "dark"];
const LABELS: Record<Scheme, string> = { system: "Как в системе", light: "Светлая", dark: "Тёмная" };

function apply(scheme: Scheme) {
  const root = document.documentElement;
  if (scheme === "system") delete root.dataset.theme;
  else root.dataset.theme = scheme;
  try {
    if (scheme === "system") localStorage.removeItem("scheme");
    else localStorage.setItem("scheme", scheme);
  } catch {
    // приватный режим: схема просто не запомнится
  }
}

export function ThemeToggle() {
  const [scheme, setScheme] = useState<Scheme>("system");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    // Синхронизация с атрибутом, который поставил скрипт до гидратации.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current === "light" || current === "dark") setScheme(current);
  }, []);

  const next = ORDER[(ORDER.indexOf(scheme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => {
        apply(next);
        setScheme(next);
      }}
      aria-label={`Оформление: ${LABELS[scheme]}. Переключить на: ${LABELS[next]}`}
    >
      <span aria-hidden="true">{scheme === "dark" ? "☾" : scheme === "light" ? "☀" : "◐"}</span>
      <span className={styles.text}>{LABELS[scheme]}</span>
    </button>
  );
}
