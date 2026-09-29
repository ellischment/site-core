import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Сквозные сценарии живут в e2e и запускаются Playwright, не здесь.
    include: ["lib/**/*.test.ts", "components/**/*.test.ts", "modules/**/*.test.ts", "tests/**/*.test.ts", "theme/**/*.test.ts", "scripts/**/*.test.ts"],
    env: {
      ENCRYPTION_KEY: "test-encryption-key-not-real-32-chars",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
