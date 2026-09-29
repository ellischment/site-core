// Тип токенов темы. Сами значения: theme/tokens.ts.

export const COLOR_KEYS = [
  "bg",
  "surface",
  "surface2",
  "text",
  "textMuted",
  "border",
  "accent",
  "accentSoft",
  "onAccent",
  "danger",
  "ok",
  "warn",
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type Palette = Record<ColorKey, string>;

export type FontRole = "display" | "accent" | "body" | "ui";
export type FontToken = {
  /** Имя семейства из theme/fonts (npm run fonts:add). Пусто: системный шрифт. */
  family: string;
  fallback: string;
  italic?: boolean;
  uppercase?: boolean;
  /** Разрядка в em, например 0.08. */
  letterSpacing?: number;
  weight?: number;
};

export type ThemeTokens = {
  defaultScheme: "system" | "light" | "dark";
  colors: { light: Palette; dark: Palette };
  radius: { sm: number; md: number; lg: number; pill: number };
  shadow: { sm: string; md: string };
  space: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, number>;
  fontSize: { xs: number; sm: number; base: number; lg: number; xl: number; h3: number; h2: number; h1: number };
  fonts: Record<FontRole, FontToken>;
};
