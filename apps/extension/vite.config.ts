import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.config.js";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        popup: "popup.html",
        options: "options.html",
      },
    },
  },
  // CRXJS needs this for HMR in dev; harmless in build.
  server: { port: 5199, strictPort: false },
});
