// Файл сгенерирован scripts/fonts-lib.ts (npm run fonts:add). Руками не править:
// next/font/local требует буквальные пути, поэтому подключения выписаны явно.

import localFont from "next/font/local";

const manrope_cyrillic = localFont({
  src: [
    { path: "./fonts/manrope/manrope-cyrillic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/manrope/manrope-cyrillic-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--ff-manrope-cyrillic",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116" }],
});

const manrope_latin = localFont({
  src: [
    { path: "./fonts/manrope/manrope-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/manrope/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--ff-manrope-latin",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

export const fontClassName = [manrope_cyrillic.variable, manrope_latin.variable].join(" ");

/** Имя шрифта из theme/tokens.ts → список семейств по поднаборам. */
export const fontFaces: Record<string, string> = {
  "manrope": "var(--ff-manrope-cyrillic), var(--ff-manrope-latin)",
};
