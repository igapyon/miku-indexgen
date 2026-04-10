import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { createIndexes, parseArgs } from "../src/main.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "miku-md-indexgen-test-"));
  tempDirs.push(dir);
  return dir;
}

describe("parseArgs", () => {
  it("parses the target dir and options", () => {
    expect(parseArgs(["./docs", "--output", "SUMMARY.md", "--no-recursive", "--no-overwrite"])).toEqual({
      targetDir: "./docs",
      outputFileName: "SUMMARY.md",
      recursive: false,
      overwrite: false,
    });
  });
});

describe("createIndexes", () => {
  it("creates index files for each direct subdirectory", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");
    const chapter2 = join(docsDir, "chapter2");

    mkdirSync(join(chapter1, "nested"), { recursive: true });
    mkdirSync(chapter2, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(chapter1, "nested", "b.md"), "# B\n", "utf8");
    writeFileSync(join(chapter2, "c.md"), "# C\n", "utf8");

    const processed = createIndexes({
      targetDir: docsDir,
      outputFileName: "index.md",
      recursive: true,
      overwrite: true,
    });

    expect(processed).toBe(2);
    expect(readFileSync(join(chapter1, "index.md"), "utf8")).toContain("[a.md](a.md)");
    expect(readFileSync(join(chapter1, "index.md"), "utf8")).toContain("[nested/b.md](nested/b.md)");
    expect(readFileSync(join(chapter2, "index.md"), "utf8")).toContain("[c.md](c.md)");
  });

  it("does not overwrite an existing index when overwrite is disabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(chapter1, "index.md"), "keep me\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.md",
      recursive: true,
      overwrite: false,
    });

    expect(readFileSync(join(chapter1, "index.md"), "utf8")).toBe("keep me\n");
  });
});
