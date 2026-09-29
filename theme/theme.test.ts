// Тема клиента обязана читаться в обеих схемах. Тест берёт токены из
// theme/tokens.ts, а пары и пороги из lib/contrast.ts: цифр здесь нет.

import { describe, expect, it } from "vitest";
import { CONTRAST_PAIRS, contrastRatio } from "@/lib/contrast";
import { COLOR_KEYS, type Palette } from "@/lib/theme-schema";
import tokens from "./tokens";

describe.each(["light", "dark"] as const)("схема %s", (scheme) => {
  const palette: Palette = tokens.colors[scheme];

  it("все цвета заданы", () => {
    for (const key of COLOR_KEYS) expect(palette[key], key).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it.each(CONTRAST_PAIRS)("$what: контраст не ниже $min", ({ fg, bg, min }) => {
    const ratio = contrastRatio(palette[fg as keyof Palette], palette[bg as keyof Palette]);
    expect(ratio, `${fg} на ${bg}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });
});
