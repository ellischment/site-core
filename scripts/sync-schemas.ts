// Схемы модулей: modules/<id>/schema.prisma → prisma/schema/module-<id>.prisma.
// Prisma читает схему только из одной папки, а модуль держит свой кусок рядом
// с кодом. Копии коммитятся: Docker и CI собирают без этого шага, а тест
// tests/module-schemas.test.ts падает, если копия разошлась с источником.
// Таблицы выключенных модулей остаются в базе: включение модуля не требует миграции.

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export const HEADER = "// Копия modules/{id}/schema.prisma. Править источник, затем npm run db:schemas.\n\n";

export function expectedSchemas(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const modulesDir = path.join(root, "modules");
  for (const id of readdirSync(modulesDir)) {
    const src = path.join(modulesDir, id, "schema.prisma");
    if (existsSync(src)) out.set(`module-${id}.prisma`, HEADER.replace("{id}", id) + readFileSync(src, "utf8"));
  }
  return out;
}

function main() {
  const root = process.cwd();
  const dir = path.join(root, "prisma", "schema");
  const expected = expectedSchemas(root);
  for (const name of readdirSync(dir)) {
    if (name.startsWith("module-") && !expected.has(name)) rmSync(path.join(dir, name));
  }
  for (const [name, content] of expected) writeFileSync(path.join(dir, name), content);
  console.log(`Схемы модулей: ${[...expected.keys()].join(", ") || "нет"}`);
}

if (process.argv[1]?.endsWith("sync-schemas.ts")) main();
