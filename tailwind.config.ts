import type { Config } from "tailwindcss";
import { ledgerLivePreset } from "@ledgerhq/lumen-design-core";

const config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  presets: [ledgerLivePreset],
} satisfies Config;

export default config;
