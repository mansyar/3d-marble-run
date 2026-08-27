import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    VitePWA({
      // Silent updates: new deploys activate on the player's next load.
      registerType: "autoUpdate",
      injectRegister: "auto",
      // The manifest is authored statically in public/manifest.webmanifest.
      manifest: false,
      workbox: {
        // Precache every shipped asset, including PWA shell files.
        globPatterns: ["**/*.{js,css,html,png,webmanifest}"],
        // The async app chunk carries Rapier's embedded WASM (~3.5 MB) and is
        // the whole point of offline play; 4 MiB clears the 3,500 kB budget
        // ceiling with headroom.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: "node",
    // Scaffold phase has no logic modules yet; remove once real tests land (Phase 2+).
    passWithNoTests: true,
  },
});
