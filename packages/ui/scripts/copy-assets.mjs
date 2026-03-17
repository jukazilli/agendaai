import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const distDir = path.join(packageRoot, "dist");

await mkdir(distDir, { recursive: true });
await copyFile(
  path.join(packageRoot, "src", "foundations.css"),
  path.join(distDir, "foundations.css")
);

