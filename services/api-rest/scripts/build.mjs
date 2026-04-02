import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentFile);
const serviceDir = path.resolve(scriptsDir, "..");
const repoRoot = path.resolve(serviceDir, "..", "..");
const distDir = path.join(serviceDir, "dist");

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.join(serviceDir, "src", "index.ts")],
  outfile: path.join(distDir, "index.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  alias: {
    "@agendaai/contracts": path.join(repoRoot, "packages", "contracts", "src", "index.ts"),
    "@agendaai/domain": path.join(repoRoot, "packages", "domain", "src", "index.ts")
  }
});
