// CSS-переменные из токенов темы. Корневой layout кладёт результат в <style>:
// страница статическая, поэтому строка собирается при сборке, а не на каждый запрос.

import { fontFaces } from "@/theme/fonts";
import tokens from "@/theme/tokens";
import { COLOR_KEYS, type FontRole, type Palette, type ThemeTokens } from "./theme-schema";

function kebab(key: string): string {
  return key.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`);
}

function paletteVars(palette: Palette): string {
  return COLOR_KEYS.map((key) => `--c-${kebab(key)}:${palette[key]};`).join("");
}

/**
 * Переменные шрифтов. Семейства приходят из next/font (theme/fonts.ts ставит их
 * переменные классом на <html>), шрифт без файлов или без имени даёт системный.
 */
function fontVars(t: ThemeTokens): string {
  const roles: FontRole[] = ["display", "accent", "body", "ui"];
  return roles
    .map((role) => {
      const f = t.fonts[role];
      const faces = f.family ? fontFaces[f.family] : undefined;
      if (f.family && !faces) {
        throw new Error(`Шрифт «${f.family}» из theme/tokens.ts не подключён: npm run fonts:add -- ${f.family}`);
      }
      const family = faces ? `${faces}, ${f.fallback}` : f.fallback;
      return [
        `--font-${role}:${family};`,
        `--font-${role}-style:${f.italic ? "italic" : "normal"};`,
        `--font-${role}-transform:${f.uppercase ? "uppercase" : "none"};`,
        `--font-${role}-spacing:${f.letterSpacing ?? 0}em;`,
        `--font-${role}-weight:${f.weight ?? (role === "body" || role === "ui" ? 400 : 500)};`,
      ].join("");
    })
    .join("");
}

export function themeCss(t: ThemeTokens = tokens): string {
  const common = [
    ...Object.entries(t.radius).map(([k, v]) => `--radius-${k}:${v}px;`),
    ...Object.entries(t.shadow).map(([k, v]) => `--shadow-${k}:${v};`),
    ...Object.entries(t.space).map(([k, v]) => `--space-${k}:${v}px;`),
    ...Object.entries(t.fontSize).map(([k, v]) => `--fs-${k}:${v}px;`),
    fontVars(t),
  ].join("");

  const light = paletteVars(t.colors.light);
  const dark = paletteVars(t.colors.dark);

  // Блок с принудительной схемой (data-scheme): /styleguide показывает обе рядом.
  const scoped =
    `[data-scheme=light]{${light}color-scheme:light;background:var(--c-bg);color:var(--c-text)}` +
    `[data-scheme=dark]{${dark}color-scheme:dark;background:var(--c-bg);color:var(--c-text)}`;

  // Схема: по системной настройке, если вручную не выбрана (атрибут data-theme
  // ставит components/ThemeToggle.tsx). defaultScheme фиксирует схему сайта.
  if (t.defaultScheme === "light") {
    return `:root{${common}${light}color-scheme:light}:root[data-theme=dark]{${dark}color-scheme:dark}${scoped}`;
  }
  if (t.defaultScheme === "dark") {
    return `:root{${common}${dark}color-scheme:dark}:root[data-theme=light]{${light}color-scheme:light}${scoped}`;
  }
  return (
    `:root{${common}${light}color-scheme:light}` +
    `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${dark}color-scheme:dark}}` +
    `:root[data-theme=dark]{${dark}color-scheme:dark}` +
    scoped
  );
}

export { tokens };
