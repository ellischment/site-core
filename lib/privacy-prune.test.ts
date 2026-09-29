import { describe, expect, it } from "vitest";
import { LOGIN_ATTEMPT_KEEP_DAYS, loginAttemptsCutoff } from "./privacy-prune";

describe("loginAttemptsCutoff", () => {
  it("граница ровно LOGIN_ATTEMPT_KEEP_DAYS дней назад", () => {
    const now = new Date("2026-09-30T12:00:00Z");
    const days = (now.getTime() - loginAttemptsCutoff(now).getTime()) / 86_400_000;
    expect(days).toBe(LOGIN_ATTEMPT_KEEP_DAYS);
  });
});
