import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import iconv from "iconv-lite";

import { createIndexes, readTextFile } from "../src/main.js";
import { createTempWorkspace } from "./test-utils.js";

describe("createIndexes encoding support", () => {
  it("reads markdown files as Shift_JIS when requested", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), iconv.encode("# 日本語\n本文\n", "shift_jis"));

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "shift_jis",
      outputEncoding: "utf8",
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      files: Array<{ summary?: string }>;
    };

    expect(index.files[0]?.summary).toBe("日本語");
  });

  it("writes index files as Shift_JIS when requested", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# 日本語\n本文\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: "資料一覧",
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "shift_jis",
    });

    expect(readTextFile(join(docsDir, "index.json"), "shift_jis")).toContain("\"title\": \"資料一覧\"");
    expect(readTextFile(join(docsDir, "index.md"), "shift_jis")).toContain("| [chapter1/a.md](chapter1/a.md) | md | chapter1 |");
  });
});
