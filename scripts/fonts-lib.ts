// Манифест шрифтов (theme/fonts.json) и генерация theme/fonts.ts из него.
//
// Почему по одному localFont на поднабор. next/font/local даёт один набор
// дескрипторов на все файлы, а у кириллицы и латиницы разные unicode-range.
// Поэтому каждый поднабор отдельное семейство со своим диапазоном, а CSS
// перечисляет их подряд: браузер берёт символ из того, чей диапазон подходит.
// adjustFontFallback выключен: иначе в переменную попал бы запасной шрифт
// первого поднабора и латиница рисовалась бы им, не доходя до своего файла.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type FontFace = { weight: string; style: string };
export type FontEntry = {
  /** Имя пакета @fontsource и папки в theme/fonts: «manrope». */
  name: string;
  /** Человеческое имя: «Manrope». */
  family: string;
  subsets?: string[];
  /** unicode-range по поднаборам. */
  ranges: Record<string, string>;
  faces: FontFace[];
};
export type FontManifest = { fonts: FontEntry[] };

const MANIFEST = ["theme", "fonts.json"];
const MODULE = ["theme", "fonts.ts"];

export function readManifest(root: string): FontManifest {
  const file = path.join(root, ...MANIFEST);
  if (!existsSync(file)) return { fonts: [] };
  return JSON.parse(readFileSync(file, "utf8")) as FontManifest;
}

export function writeManifest(root: string, manifest: FontManifest): void {
  writeFileSync(path.join(root, ...MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
}

function ident(name: string, subset: string): string {
  return `${name}_${subset}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

export function renderFontsModule(manifest: FontManifest): string {
  const lines: string[] = [
    "// Файл сгенерирован scripts/fonts-lib.ts (npm run fonts:add). Руками не править:",
    "// next/font/local требует буквальные пути, поэтому подключения выписаны явно.",
    "",
  ];

  if (manifest.fonts.length === 0) {
    lines.push("// Шрифтов нет: сайт на системных (theme/tokens.ts, fallback).", "");
    lines.push('export const fontClassName = "";');
    lines.push("export const fontFaces: Record<string, string> = {};", "");
    return lines.join("\n");
  }

  lines.push('import localFont from "next/font/local";', "");
  const vars: string[] = [];
  const faces: string[] = [];

  for (const font of manifest.fonts) {
    const subsets = font.subsets ?? Object.keys(font.ranges);
    const familyVars: string[] = [];
    for (const subset of subsets) {
      const id = ident(font.name, subset);
      const cssVar = `--ff-${font.name}-${subset}`;
      lines.push(`const ${id} = localFont({`);
      lines.push("  src: [");
      for (const face of font.faces) {
        lines.push(
          `    { path: "./fonts/${font.name}/${font.name}-${subset}-${face.weight}-${face.style}.woff2", weight: "${face.weight}", style: "${face.style}" },`,
        );
      }
      lines.push("  ],");
      lines.push(`  variable: "${cssVar}",`);
      lines.push('  display: "swap",');
      lines.push("  adjustFontFallback: false,");
      if (font.ranges[subset]) {
        lines.push(`  declarations: [{ prop: "unicode-range", value: "${font.ranges[subset]}" }],`);
      }
      lines.push("});", "");
      vars.push(`${id}.variable`);
      familyVars.push(`var(${cssVar})`);
    }
    faces.push(`  ${JSON.stringify(font.name)}: ${JSON.stringify(familyVars.join(", "))},`);
  }

  lines.push(`export const fontClassName = [${vars.join(", ")}].join(" ");`, "");
  lines.push("/** Имя шрифта из theme/tokens.ts → список семейств по поднаборам. */");
  lines.push("export const fontFaces: Record<string, string> = {");
  lines.push(...faces);
  lines.push("};", "");
  return lines.join("\n");
}

export function writeFontsModule(root: string, manifest: FontManifest): void {
  writeFileSync(path.join(root, ...MODULE), renderFontsModule(manifest));
}
