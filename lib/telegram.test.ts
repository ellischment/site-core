import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTelegram } from "./telegram";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendTelegram", () => {
  it("без токена не ходит в сеть и честно отвечает", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendTelegram("привет");
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("шлёт в релей, если он задан, и не бросает при ошибке сети", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:not-real");
    vi.stubEnv("TELEGRAM_CHAT_ID", "42");
    vi.stubEnv("TELEGRAM_API_BASE", "https://relay.example.invalid/");
    const fetchMock = vi.fn().mockRejectedValue(new Error("сеть"));
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendTelegram("привет");
    expect(r.ok).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe("https://relay.example.invalid/bot123:not-real/sendMessage");
  });
});
