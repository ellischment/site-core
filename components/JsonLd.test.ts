import { describe, expect, it } from "vitest";
import { safeJsonLd } from "./JsonLd";

describe("safeJsonLd", () => {
  it("текст поля не может закрыть тег script", () => {
    const out = safeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<img");
  });

  it("значение после разбора то же самое", () => {
    const data = { name: "A & B <c>", note: `строка${String.fromCharCode(0x2028)}дальше` };
    expect(JSON.parse(safeJsonLd(data))).toEqual(data);
  });
});
