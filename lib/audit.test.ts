import { describe, expect, it } from "vitest";
import { hidePrivate } from "./audit";

describe("hidePrivate", () => {
  it("скрывает пароли, телефоны, имена гостей и шифртексты, в том числе вложенные", () => {
    const result = hidePrivate({
      title: "Услуга",
      password: "x",
      items: [{ name: "Мария", phoneEnc: "a.b.c", fileName: "photo.jpg" }],
    });
    expect(result).toEqual({
      title: "Услуга",
      password: "скрыто",
      items: [{ name: "скрыто", phoneEnc: "скрыто", fileName: "photo.jpg" }],
    });
  });
});
