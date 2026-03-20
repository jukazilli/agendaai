import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@agendaai/ui/foundations.css",
        replacement: path.resolve(__dirname, "../../packages/ui/src/foundations.css")
      },
      {
        find: "@agendaai/ui",
        replacement: path.resolve(__dirname, "../../packages/ui/src/index.ts")
      }
    ]
  }
});
