// Токены темы клиента: единственное место с сырыми цветами. Из них при рендере
// корневого layout получаются CSS-переменные (lib/theme.ts), компоненты берут
// только var(--*). Светлая и тёмная схемы обязательны.

import type { ThemeTokens } from "@/lib/theme-schema";

const tokens: ThemeTokens = {
  defaultScheme: "system",
  colors: {
    light: {
      bg: "#FAFAF7",
      surface: "#FFFFFF",
      surface2: "#F1F1EC",
      text: "#1C1D21",
      textMuted: "#5B5E66",
      border: "#DEDED6",
      accent: "#3B5BDB",
      accentSoft: "#E3E8FB",
      onAccent: "#FFFFFF",
      danger: "#B42318",
      ok: "#1E7B34",
      warn: "#8A5A00",
    },
    dark: {
      bg: "#121316",
      surface: "#1B1C20",
      surface2: "#24262B",
      text: "#ECEDEF",
      textMuted: "#A2A6AF",
      border: "#34363C",
      accent: "#8EA6F5",
      accentSoft: "#26304F",
      onAccent: "#10131C",
      danger: "#F97066",
      ok: "#6CD58B",
      warn: "#F5C451",
    },
  },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  shadow: {
    sm: "0 1px 2px rgb(0 0 0 / 0.06)",
    md: "0 8px 24px rgb(0 0 0 / 0.08)",
  },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 },
  fontSize: { xs: 13, sm: 14, base: 16, lg: 18, xl: 22, h3: 24, h2: 32, h1: 44 },
  fonts: {
    display: { family: "", fallback: "Georgia, serif" },
    accent: { family: "", fallback: "Georgia, serif", italic: true },
    body: { family: "", fallback: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
    ui: { family: "", fallback: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  },
};

export default tokens;
