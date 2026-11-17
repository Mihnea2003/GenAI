import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Fast unit tests (no Firebase needed): `npm test`. Emulator tests: `npm run test:emulator`. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
