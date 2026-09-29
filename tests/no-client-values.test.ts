// Правило основы: в коде компонентов нет значений конкретного клиента. Цвета
// только var(--*) из theme/tokens.ts, названия, контакты и домены только из
// client.config.ts. Тест читает файлы и ищет нарушения; значения клиента он
// берёт из самого конфига, а не копирует.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { config } from "@/lib/config";

const ROOT = path.resolve(__dirname, "..");
const DIRS = ["app", "components", "modules"];
const EXT = /\.(tsx?|css)$/;

function walk(dir: string): string[] {
  let out: string[] = [];
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (EXT.test(name) && !name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

export function findColorLiterals(file: string, source: string): string[] {
  const hits: string[] = [];
  const lines = source.split("\n");
  lines.forEach((line, i) => {
    const where = `${path.relative(ROOT, file)}:${i + 1}`;
    if (/\b(rgba?|hsla?)\(/.test(line)) hits.push(`${where}: ${line.trim()}`);
    const hex = file.endsWith(".css")
      ? /#[0-9a-fA-F]{3,8}\b/.test(line)
      : /["'`]#[0-9a-fA-F]{3,8}["'`]/.test(line);
    if (hex) hits.push(`${where}: ${line.trim()}`);
  });
  return hits;
}

/** Значения клиента, которые не должны встречаться строкой в коде. */
function clientValues(): string[] {
  const values = [
    config.name,
    config.legalEntity.fullName,
    config.contacts.phone,
    config.contacts.email,
    config.contacts.telegram,
    config.domains.primary,
    config.domains.admin ?? "",
    ...config.domains.extra,
    ...config.contacts.locations.map((l) => l.address ?? ""),
  ];
  return values.filter((v) => v.trim().length >= 4);
}

const files = DIRS.flatMap((d) => walk(path.join(ROOT, d)));

describe("в коде нет значений клиента", () => {
  it("файлы нашлись (иначе тест проверяет пустоту)", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("нет сырых цветов: только var(--*) из темы", () => {
    const hits = files.flatMap((f) => findColorLiterals(f, readFileSync(f, "utf8")));
    expect(hits, hits.join("\n")).toEqual([]);
  });

  it("нет названия, контактов и доменов клиента строкой", () => {
    const values = clientValues();
    const hits: string[] = [];
    for (const f of files) {
      const source = readFileSync(f, "utf8");
      for (const v of values) if (source.includes(v)) hits.push(`${path.relative(ROOT, f)}: «${v}»`);
    }
    expect(hits, hits.join("\n")).toEqual([]);
  });
});
