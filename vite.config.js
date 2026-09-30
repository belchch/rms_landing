import { resolve } from "node:path";
import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sites()],
  publicDir: "hosting-static",
  build: {
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        site: resolve("index.html"),
        mockup: resolve("mockup/index.html"),
        worker: resolve("worker.js"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "worker"
            ? "server/index.js"
            : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
