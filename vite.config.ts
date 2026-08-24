import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Scaffold phase has no logic modules yet; remove once real tests land (Phase 2+).
    passWithNoTests: true,
  },
});
