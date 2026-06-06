import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimePath = join(rootDir, "bundle", "miku-indexgen.mjs");

const versionOutput = execFileSync(process.execPath, [runtimePath, "--version"], {
  cwd: rootDir,
  encoding: "utf8",
});

if (!versionOutput.trim().startsWith("miku-indexgen ")) {
  throw new Error(`Unexpected --version output: ${versionOutput}`);
}

const helpOutput = execFileSync(process.execPath, [runtimePath, "--help"], {
  cwd: rootDir,
  encoding: "utf8",
});

if (!helpOutput.includes("miku-indexgen --input-directory <dir>")) {
  throw new Error("Unexpected --help output.");
}
