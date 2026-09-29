import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { expectedSchemas } from "@/scripts/sync-schemas";

const ROOT = path.resolve(__dirname, "..");

describe("схемы модулей", () => {
  it("копии в prisma/schema совпадают с modules/<id>/schema.prisma (npm run db:schemas)", () => {
    const dir = path.join(ROOT, "prisma", "schema");
    const expected = expectedSchemas(ROOT);
    const actual = readdirSync(dir).filter((n) => n.startsWith("module-"));
    expect(actual.sort()).toEqual([...expected.keys()].sort());
    for (const [name, content] of expected) {
      expect(readFileSync(path.join(dir, name), "utf8"), name).toBe(content);
    }
  });
});
