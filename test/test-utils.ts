import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

export function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "miku-indexgen-test-"));
  tempDirs.push(dir);
  return dir;
}
