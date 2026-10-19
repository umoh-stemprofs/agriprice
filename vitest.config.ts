import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // bcrypt cost 10 in pure JS needs a moment on a loaded, slow machine
    // (docs/00-global.md §0); 20 s keeps the suite honest without flaking.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Refreshes lib/market/salts.json for today's date first, so no test
    // depends on the day it is run (step 0).
    globalSetup: ["./vitest.global-setup.ts"],
  },
});
