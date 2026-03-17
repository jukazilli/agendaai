import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const sourceDir = path.join(repoRoot, "assets", "brand");
const targetDir = path.join(appRoot, "public", "brand");
const brandFiles = [
  "agendaai-wordmark.svg",
  "agendaai-wordmark-reverse.svg",
  "agendaai-wordmark-mono.svg",
  "agendaai-symbol.svg"
];

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });

for (const fileName of brandFiles) {
  await copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName));
}

await copyFile(
  path.join(sourceDir, "agendaai-symbol.svg"),
  path.join(appRoot, "public", "favicon.svg")
);

