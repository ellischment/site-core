// npm run fonts:add -- <шрифт> [--weights 400,500] [--italic] [--subsets cyrillic,latin]
//
// Берёт шрифт из пакета @fontsource через npm (не из Google Fonts: сайт не
// делает внешних запросов), кладёт woff2 в theme/fonts/<шрифт>/, записывает в
// theme/fonts.json и пересобирает theme/fonts.ts. Дальше имя шрифта ставится в
// theme/tokens.ts (fonts.<роль>.family).
//
// Пример: npm run fonts:add -- manrope --weights 400,500,600,700
//         npm run fonts:add -- cormorant-garamond --weights 500 --italic

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readManifest, writeFontsModule, writeManifest, type FontEntry } from "./fonts-lib";

const ROOT = process.cwd();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** unicode-range каждого поднабора из CSS пакета: «cyrillic» → «U+0301,U+0400-045F,...». */
export function parseRanges(css: string, name: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Имя шрифта может содержать дефис (cormorant-garamond), поэтому префикс
  // берём известный, а поднабор это всё между ним и весом.
  const escaped = name.replace(/[-]/g, "\\-");
  const re = new RegExp(`/\\*\\s*${escaped}-([a-z-]+)-\\d+-(?:normal|italic)\\s*\\*/[^}]*?unicode-range:\\s*([^;]+);`, "g");
  for (const m of css.matchAll(re)) out[m[1]] = m[2].trim();
  return out;
}

function main() {
  const name = process.argv[2];
  if (!name || name.startsWith("--")) {
    console.error("Укажите шрифт: npm run fonts:add -- manrope --weights 400,600");
    process.exit(1);
  }
  const weights = (arg("weights") ?? "400").split(",").map((w) => w.trim());
  const italic = process.argv.includes("--italic");
  const normal = !italic || process.argv.includes("--normal");
  const subsets = (arg("subsets") ?? "cyrillic,latin").split(",").map((s) => s.trim());
  const styles = [...(normal ? ["normal"] : []), ...(italic ? ["italic"] : [])];

  const tmp = mkdtempSync(path.join(tmpdir(), "fontsource-"));
  try {
    execFileSync("npm", ["pack", `@fontsource/${name}`, "--pack-destination", tmp], {
      stdio: ["ignore", "ignore", "inherit"],
      shell: process.platform === "win32",
    });
    const tgz = readdirSync(tmp).find((f) => f.endsWith(".tgz"));
    if (!tgz) throw new Error("npm pack не скачал пакет");
    execFileSync("tar", ["xzf", path.join(tmp, tgz), "-C", tmp]);
    const pkg = path.join(tmp, "package");

    const target = path.join(ROOT, "theme", "fonts", name);
    mkdirSync(target, { recursive: true });

    const manifest = readManifest(ROOT);
    const entry: FontEntry = manifest.fonts.find((f) => f.name === name) ?? {
      name,
      family: JSON.parse(readFileSync(path.join(pkg, "package.json"), "utf8")).description?.match(/"([^"]+)"/)?.[1] ?? name,
      ranges: {},
      faces: [],
    };

    for (const style of styles) {
      for (const weight of weights) {
        const cssFile = path.join(pkg, style === "italic" ? `${weight}-italic.css` : `${weight}.css`);
        if (!existsSync(cssFile)) throw new Error(`В @fontsource/${name} нет начертания ${weight} ${style}`);
        const ranges = parseRanges(readFileSync(cssFile, "utf8"), name);
        for (const subset of subsets) {
          const file = `${name}-${subset}-${weight}-${style}.woff2`;
          const from = path.join(pkg, "files", file);
          if (!existsSync(from)) throw new Error(`Нет файла ${file}: у шрифта нет поднабора ${subset}?`);
          copyFileSync(from, path.join(target, file));
          if (ranges[subset]) entry.ranges[subset] = ranges[subset];
        }
        if (!entry.faces.some((f) => f.weight === weight && f.style === style)) entry.faces.push({ weight, style });
      }
    }
    entry.subsets = subsets;
    entry.faces.sort((a, b) => a.style.localeCompare(b.style) || Number(a.weight) - Number(b.weight));

    manifest.fonts = [...manifest.fonts.filter((f) => f.name !== name), entry].sort((a, b) => a.name.localeCompare(b.name));
    writeManifest(ROOT, manifest);
    writeFontsModule(ROOT, manifest);
    console.log(`Шрифт ${name} добавлен: ${entry.faces.map((f) => `${f.weight} ${f.style}`).join(", ")}.`);
    console.log(`Теперь впишите "${name}" в theme/tokens.ts, fonts.<роль>.family.`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith("fonts-add.ts")) main();
