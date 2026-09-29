import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS, RETRY_DELAYS_MIN, retryDelayMs } from "./retry";

describe("retryDelayMs", () => {
  it("задержки идут по таблице RETRY_DELAYS_MIN", () => {
    RETRY_DELAYS_MIN.forEach((minutes, i) => expect(retryDelayMs(i + 1)).toBe(minutes * 60_000));
  });

  it("после MAX_ATTEMPTS попыток больше не пробуем", () => {
    expect(retryDelayMs(MAX_ATTEMPTS)).toBeNull();
  });
});
