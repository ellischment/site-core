import { describe, expect, it } from "vitest";
import { ARTICLE_COVER, CARD_COVER, coverNotice } from "./cover-notice";

describe("coverNotice", () => {
  it("подходящий кадр без подсказки", () => {
    expect(coverNotice(CARD_COVER, "photo.jpg", 1600, 1200)).toBeNull();
  });

  it("узкий кадр: подсказка про мыло с порогом из описания места", () => {
    expect(coverNotice(CARD_COVER, "a.jpg", 800, 600)).toContain(`от ${CARD_COVER.minWidth}px`);
  });

  it("вертикальный и слишком широкий кадр", () => {
    expect(coverNotice(CARD_COVER, "v.jpg", 1600, 2400)).toContain("срежет верх и низ");
    expect(coverNotice(ARTICLE_COVER, "w.jpg", 4000, 1000)).toContain("срежет бока");
  });

  it("без размеров молчит", () => {
    expect(coverNotice(CARD_COVER, "x.jpg", null, null)).toBeNull();
  });
});
