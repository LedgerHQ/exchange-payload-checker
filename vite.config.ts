import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // GitHub Pages serves the site under /<repository name>/.
  base: "/exchange-payload-checker/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1024,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    restoreMocks: true,
  },
});
