import { describe, expect, it } from "vitest";
import { parseRanges } from "./fonts-add";
import { renderFontsModule } from "./fonts-lib";

describe("шрифты", () => {
  it("достаёт unicode-range по поднаборам из CSS @fontsource", () => {
    const css = `/* manrope-cyrillic-ext-400-normal */
@font-face { font-family: 'Manrope'; unicode-range: U+0460-052F; }
/* manrope-cyrillic-400-normal */
@font-face { font-family: 'Manrope'; unicode-range: U+0301,U+0400-045F; }
/* manrope-latin-400-normal */
@font-face { font-family: 'Manrope'; unicode-range: U+0000-00FF; }`;
    expect(parseRanges(css, "manrope")).toEqual({ "cyrillic-ext": "U+0460-052F", cyrillic: "U+0301,U+0400-045F", latin: "U+0000-00FF" });
  });

  it("имя шрифта с дефисом не путается с поднабором", () => {
    const css = `/* cormorant-garamond-cyrillic-500-italic */
@font-face { font-family: 'Cormorant Garamond'; unicode-range: U+0400-045F; }`;
    expect(parseRanges(css, "cormorant-garamond")).toEqual({ cyrillic: "U+0400-045F" });
  });

  it("на каждый поднабор своё подключение с диапазоном, без запасного шрифта внутри", () => {
    const code = renderFontsModule({
      fonts: [{ name: "manrope", family: "Manrope", subsets: ["cyrillic", "latin"], ranges: { cyrillic: "U+0400-045F", latin: "U+0000-00FF" }, faces: [{ weight: "400", style: "normal" }] }],
    });
    expect(code).toContain('path: "./fonts/manrope/manrope-cyrillic-400-normal.woff2"');
    expect(code).toContain('declarations: [{ prop: "unicode-range", value: "U+0400-045F" }]');
    expect(code).toContain("adjustFontFallback: false");
    expect(code).toContain('"manrope": "var(--ff-manrope-cyrillic), var(--ff-manrope-latin)"');
  });

  it("без шрифтов модуль пустой и не импортирует next/font", () => {
    const code = renderFontsModule({ fonts: [] });
    expect(code).not.toContain('from "next/font');
    expect(code).toContain('export const fontClassName = "";');
  });
});
