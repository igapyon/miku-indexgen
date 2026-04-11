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
    expect(parseArgs(["./docs", "--output", "SUMMARY.json", "--no-recursive", "--no-overwrite"])).toEqual({
      targetDir: "./docs",
      outputFileName: "SUMMARY.json",
      recursive: false,
      overwrite: false,
    });
  });
});

describe("createIndexes", () => {
  it("creates one root index file for direct subdirectories", () => {
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
      outputFileName: "index.json",
      recursive: true,
      overwrite: true,
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      basePath: string;
      files: Array<{ name: string; path: string; directory: string }>;
    };

    expect(processed).toBe(2);
    expect(index.basePath).toBe(".");
    expect(index.files).toEqual([
      {
        name: "a.md",
        path: "chapter1/a.md",
        directory: "chapter1",
      },
      {
        name: "b.md",
        path: "chapter1/nested/b.md",
        directory: "chapter1/nested",
      },
      {
        name: "c.md",
        path: "chapter2/c.md",
        directory: "chapter2",
      },
    ]);
  });

  it("does not overwrite an existing root index when overwrite is disabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(docsDir, "index.json"), "keep me\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      recursive: true,
      overwrite: false,
    });

    expect(readFileSync(join(docsDir, "index.json"), "utf8")).toBe("keep me\n");
  });
});
