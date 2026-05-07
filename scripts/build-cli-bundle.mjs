import { chmodSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const productName = "miku-indexgen";
const bundleDir = join(rootDir, "bundle");
const runtimePath = join(bundleDir, `${productName}.mjs`);
const sourcesPath = join(bundleDir, `${productName}-sources.tgz`);
const esbuildBin = join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "esbuild.cmd" : "esbuild");
const banner = [
  "#!/usr/bin/env node",
  'import { createRequire as __mikuCreateRequire } from "node:module";',
  "const require = __mikuCreateRequire(import.meta.url);",
].join("\n");

mkdirSync(bundleDir, { recursive: true });

execFileSync(
  esbuildBin,
  [
    "scripts/cli-bundle-entry.mjs",
    "--bundle",
    "--platform=node",
    "--format=esm",
    "--target=node18.19",
    `--outfile=${runtimePath}`,
    `--banner:js=${banner}`,
  ],
  { cwd: rootDir, stdio: "inherit" },
);

chmodSync(runtimePath, 0o755);

execFileSync(
  "tar",
  [
    "-czf",
    sourcesPath,
    "src",
    "test",
    "scripts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "README.md",
    "LICENSE",
  ],
  { cwd: rootDir, stdio: "inherit" },
);
