import { describe, expect, it } from "vitest";
import { withSqliteParams } from "./db";

describe("withSqliteParams", () => {
  it("добавляет одно соединение и запас по времени", () => {
    expect(withSqliteParams("file:/app/prisma/data/app.db")).toBe("file:/app/prisma/data/app.db?connection_limit=1&socket_timeout=20");
  });

  it("не трогает заданные значения и не-SQLite адреса", () => {
    expect(withSqliteParams("file:./a.db?connection_limit=3")).toBe("file:./a.db?connection_limit=3&socket_timeout=20");
    expect(withSqliteParams("postgres://x")).toBe("postgres://x");
  });
});
