// Человеческие подписи действий для журнала. Ядро здесь, модули в module.ts.

import { ALL_MODULES } from "@/modules/registry";

const CORE_LABELS: Record<string, string> = {
  "user.create": "Создан доступ",
  "user.role": "Изменена роль",
  "user.active": "Доступ включён или отключён",
  "user.password": "Задан пароль пользователю",
  "user.changeOwnPassword": "Сменён свой пароль",
  "session.terminateAll": "Завершены все входы",
  "siteText.save": "Изменён текст сайта",
  "media.upload": "Загружено фото",
  "media.delete": "Удалено фото",
  "media.alt": "Изменено описание фото",
  "media.move": "Изменён порядок фото",
  "redirect.save": "Изменён редирект",
  "redirect.delete": "Удалён редирект",
};

export function auditLabel(action: string): string {
  if (CORE_LABELS[action]) return CORE_LABELS[action];
  for (const m of ALL_MODULES) {
    const label = m.auditLabels?.[action];
    if (label) return label;
  }
  return action;
}
