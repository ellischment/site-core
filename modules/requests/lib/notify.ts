// Текст уведомления о заявке. Без персональных данных: только вид обращения,
// предмет и куда смотреть (lib/telegram.ts, почему так).

import { config } from "@/lib/config";

export function kindTitle(kind: string): string {
  return config.modules.requests?.kinds.find((k) => k.id === kind)?.title ?? kind;
}

export function buildNotifyText(input: { kind: string; subject?: string | null }): string {
  const lines = [
    `Новая заявка: ${kindTitle(input.kind)}`,
    input.subject ? `О чём: ${input.subject}` : null,
    "Контакты в админке, раздел «Заявки».",
  ];
  return lines.filter(Boolean).join("\n");
}
