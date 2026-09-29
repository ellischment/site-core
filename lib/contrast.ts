// Контраст по WCAG 2.1: отношение яркостей двух цветов. Нужен тесту темы и
// генератору палитры (npm run new-client): текст обязан читаться в обеих схемах.

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Не цвет: ${hex}`);
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Пары «текст на фоне», которые обязаны читаться, и нужный минимум. */
export const CONTRAST_PAIRS: { fg: string; bg: string; min: number; what: string }[] = [
  { fg: "text", bg: "bg", min: 4.5, what: "основной текст на фоне" },
  { fg: "text", bg: "surface", min: 4.5, what: "основной текст на карточке" },
  { fg: "text", bg: "surface2", min: 4.5, what: "основной текст на второй поверхности" },
  { fg: "textMuted", bg: "bg", min: 4.5, what: "вторичный текст на фоне" },
  { fg: "textMuted", bg: "surface", min: 4.5, what: "вторичный текст на карточке" },
  { fg: "accent", bg: "bg", min: 4.5, what: "ссылки на фоне" },
  { fg: "onAccent", bg: "accent", min: 4.5, what: "текст кнопки на акценте" },
  { fg: "danger", bg: "surface", min: 4.5, what: "ошибка на карточке" },
];
