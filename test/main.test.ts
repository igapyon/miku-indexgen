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

import {
  createIndexes,
  escapeMarkdownTableCell,
  extractSummary,
  parseArgs,
  sanitizeTextForIndex,
} from "../src/main.js";

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
    expect(parseArgs(["./docs", "--output", "SUMMARY.json", "--markdown", "--no-recursive", "--no-overwrite"])).toEqual({
      targetDir: "./docs",
      outputFileName: "SUMMARY.json",
      markdownOutput: true,
      recursive: false,
      overwrite: false,
    });
  });
});

describe("extractSummary", () => {
  it("uses the first heading when the first non-empty line starts with #", () => {
    expect(extractSummary("\n## Title\nBody")).toBe("Title");
  });

  it("uses body text until the first heading when the file starts without a heading", () => {
    expect(extractSummary("Workbook: sample.xlsx\nSecond line\n# Heading\nBody")).toBe(
      "Workbook: sample.xlsx Second line",
    );
  });

  it("limits body-derived summary to 256 characters", () => {
    expect(extractSummary(`${"a".repeat(300)}\n`)).toBe("a".repeat(256));
  });
});

describe("sanitizeTextForIndex", () => {
  it("replaces problematic characters with spaces and normalizes whitespace", () => {
    expect(sanitizeTextForIndex("A\tB\nC\u200BD\u0007E")).toBe("A B C D E");
  });
});

describe("escapeMarkdownTableCell", () => {
  it("escapes pipe characters and backslashes for Markdown tables", () => {
    expect(escapeMarkdownTableCell(String.raw`A|B\C`)).toBe(String.raw`A\|B\\C`);
  });

  it("escapes HTML-sensitive characters for Markdown output", () => {
    expect(escapeMarkdownTableCell("<a&b>")).toBe("&lt;a&amp;b&gt;");
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
    writeFileSync(join(chapter2, "c.md"), "Workbook: sample.xlsx\nSecond line\n# C\n", "utf8");

    const processed = createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      markdownOutput: false,
      recursive: true,
      overwrite: true,
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      basePath: string;
      files: Array<{ name: string; path: string; directory: string; size: number; summary?: string }>;
    };

    expect(processed).toBe(2);
    expect(index.basePath).toBe(".");
    expect(index.files).toEqual([
      {
        name: "a.md",
        path: "chapter1/a.md",
        directory: "chapter1",
        size: 4,
        summary: "A",
      },
      {
        name: "b.md",
        path: "chapter1/nested/b.md",
        directory: "chapter1/nested",
        size: 4,
        summary: "B",
      },
      {
        name: "c.md",
        path: "chapter2/c.md",
        directory: "chapter2",
        size: 38,
        summary: "Workbook: sample.xlsx Second line",
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
      markdownOutput: false,
      recursive: true,
      overwrite: false,
    });

    expect(readFileSync(join(docsDir, "index.json"), "utf8")).toBe("keep me\n");
  });

  it("creates index.md when markdown output is enabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      markdownOutput: true,
      recursive: true,
      overwrite: true,
    });

    expect(readFileSync(join(docsDir, "index.md"), "utf8")).toContain("| [chapter1/a.md](chapter1/a.md) | chapter1 | 4 | A |");
  });

  it("escapes markdown table cells in index.md", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "dir|name");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a|b.md"), "plain | text\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      markdownOutput: true,
      recursive: true,
      overwrite: true,
    });

    expect(readFileSync(join(docsDir, "index.md"), "utf8")).toContain(
      String.raw`| [dir\|name/a\|b.md](dir|name/a|b.md) | dir\|name | 13 | plain \| text |`,
    );
  });
});
