import { describe, expect, it } from "vitest";
import { REQUEST_IP_KEEP_MINUTES, requestCutoffs } from "./prune";

describe("requestCutoffs", () => {
  it("IP живёт REQUEST_IP_KEEP_MINUTES, заявка keepDays", () => {
    const now = new Date("2026-09-30T12:00:00Z");
    const { ipBefore, deleteBefore } = requestCutoffs(now, 180);
    expect((now.getTime() - ipBefore.getTime()) / 60_000).toBe(REQUEST_IP_KEEP_MINUTES);
    expect((now.getTime() - deleteBefore.getTime()) / 86_400_000).toBe(180);
  });
});
