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
import { vi } from "vitest";
import iconv from "iconv-lite";

import {
  collectIndexableFiles,
  createIndexes,
  escapeMarkdownTableCell,
  extractSummary,
  parseArgs,
  parseEncodingOption,
  parseIncludeExtensions,
  readTextFile,
  sanitizeTextForIndex,
  writeTextFile,
} from "../src/main.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "miku-indexgen-test-"));
  tempDirs.push(dir);
  return dir;
}

describe("parseArgs", () => {
  it("parses the target dir and options", () => {
    expect(parseArgs(["./docs", "--output", "SUMMARY.json", "--title", "Docs Index", "--markdown", "--no-recursive", "--no-overwrite", "--include-ext", "md,json", "--input-encoding", "ShiftJIS", "--output-encoding", "shift-jis", "--verbose"])).toEqual({
      targetDir: "./docs",
      outputFileName: "SUMMARY.json",
      title: "Docs Index",
      markdownOutput: true,
      recursive: false,
      overwrite: false,
      verbose: true,
      includeExtensions: ["md", "json"],
      inputEncoding: "shift_jis",
      outputEncoding: "shift_jis",
    });
  });
});

describe("parseEncodingOption", () => {
  it("normalizes supported encoding aliases", () => {
    expect(parseEncodingOption("utf-8")).toBe("utf8");
    expect(parseEncodingOption("ShiftJIS")).toBe("shift_jis");
    expect(parseEncodingOption("cp932")).toBe("shift_jis");
  });

  it("rejects unsupported encodings", () => {
    expect(() => parseEncodingOption("euc-jp")).toThrow("Unsupported encoding: euc-jp");
  });
});

describe("parseIncludeExtensions", () => {
  it("normalizes a comma-separated extension list", () => {
    expect(parseIncludeExtensions(".MD, json ,md")).toEqual(["md", "json"]);
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
  it("creates one root index file including files in the target directory", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");
    const chapter2 = join(docsDir, "chapter2");

    mkdirSync(docsDir, { recursive: true });
    mkdirSync(join(chapter1, "nested"), { recursive: true });
    mkdirSync(chapter2, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(chapter1, "nested", "b.md"), "# B\n", "utf8");
    writeFileSync(join(chapter2, "c.md"), "Workbook: sample.xlsx\nSecond line\n# C\n", "utf8");
    writeFileSync(join(chapter2, "data.json"), "{\n  \"title\": \"Data\"\n}\n", "utf8");

    const processed = createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      title?: string;
      basePath: string;
      files: Array<{ name: string; path: string; ext: string; dir: string; size: number; summary?: string }>;
    };

    expect(processed).toBe(2);
    expect(index.title).toBeUndefined();
    expect(index.basePath).toBe(".");
    expect(index.files).toEqual([
      {
        name: "a.md",
        path: "chapter1/a.md",
        ext: "md",
        dir: "chapter1",
        size: 4,
        summary: "A",
      },
      {
        name: "b.md",
        path: "chapter1/nested/b.md",
        dir: "chapter1/nested",
        ext: "md",
        size: 4,
        summary: "B",
      },
      {
        name: "c.md",
        path: "chapter2/c.md",
        dir: "chapter2",
        ext: "md",
        size: 38,
        summary: "Workbook: sample.xlsx Second line",
      },
      {
        name: "data.json",
        path: "chapter2/data.json",
        dir: "chapter2",
        ext: "json",
        size: 22,
      },
      {
        name: "root.md",
        path: "root.md",
        ext: "md",
        dir: "",
        size: 7,
        summary: "Root",
      },
    ]);
  });

  it("collects markdown and json files", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(join(chapter1, "nested"), { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(chapter1, "b.json"), "{\n}\n", "utf8");
    writeFileSync(join(chapter1, "nested", "c.txt"), "skip\n", "utf8");

    expect(collectIndexableFiles(chapter1, true, ["md", "json"]).map((path) => path.replace(`${docsDir}/`, ""))).toEqual([
      "chapter1/a.md",
      "chapter1/b.json",
    ]);
  });

  it("filters files by includeExtensions", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(chapter1, "b.json"), "{\n}\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      files: Array<{ name: string; path: string; ext: string; dir: string; summary?: string; size: number }>;
    };

    expect(index.files).toEqual([
      {
        name: "b.json",
        path: "chapter1/b.json",
        dir: "chapter1",
        ext: "json",
        size: 4,
      },
    ]);
  });

  it("writes title only when --title is specified", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: "Docs Index",
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      title?: string;
    };

    expect(index.title).toBe("Docs Index");
  });

  it("does not overwrite an existing root index when overwrite is disabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(docsDir, "index.json"), "keep me\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: false,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    expect(readFileSync(join(docsDir, "index.json"), "utf8")).toBe("keep me\n");
  });

  it("creates index.md when markdown output is enabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(docsDir, { recursive: true });
    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: undefined,
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    expect(readFileSync(join(docsDir, "index.md"), "utf8")).toContain(
      "| [root.md](root.md) | md |  | 7 | Root |",
    );
    expect(readFileSync(join(docsDir, "index.md"), "utf8")).toContain(
      "| [chapter1/a.md](chapter1/a.md) | md | chapter1 | 4 | A |",
    );
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
      title: undefined,
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    expect(readFileSync(join(docsDir, "index.md"), "utf8")).toContain(
      String.raw`| [dir\|name/a\|b.md](dir|name/a|b.md) | md | dir\|name | 13 | plain \| text |`,
    );
  });

  it("prints progress and timing details in verbose mode", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    let logs: string[] = [];

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");

    try {
      createIndexes({
        targetDir: docsDir,
        outputFileName: "index.json",
        title: "Verbose Docs",
        markdownOutput: false,
        recursive: true,
        overwrite: true,
        verbose: true,
        includeExtensions: ["md", "json"],
        inputEncoding: "utf8",
        outputEncoding: "utf8",
      });
      logs = logSpy.mock.calls.map((call) => call.join(" "));
    } finally {
      logSpy.mockRestore();
    }

    expect(logs).toContain(`verbose: target=${docsDir}`);
    expect(logs).toContain("verbose: title=Verbose Docs");
    expect(logs).toContain("verbose: include-ext=md,json");
    expect(logs).toContain("verbose: input-encoding=utf8");
    expect(logs).toContain("verbose: output-encoding=utf8");
    expect(logs).toContain("verbose: subdirectories=1");
    expect(logs).toContain("verbose: scanning-dir=.");
    expect(logs).toContain("verbose: found-file=chapter1/a.md");
    expect(logs.some((line) => line.startsWith("verbose: timing.stat="))).toBe(true);
    expect(logs.some((line) => line.startsWith("verbose: timing.readFile="))).toBe(true);
    expect(logs.some((line) => line.startsWith("verbose: timing.summary="))).toBe(true);
    expect(logs.some((line) => line.startsWith("verbose: timing.json.stringify="))).toBe(true);
    expect(logs.some((line) => line.startsWith("verbose: timing.json.write="))).toBe(true);
    expect(logs.some((line) => line.startsWith("verbose: timing.total="))).toBe(true);
  });

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

describe("writeTextFile", () => {
  it("writes text with the specified encoding", () => {
    const workspace = createTempWorkspace();
    const filePath = join(workspace, "sample.txt");

    writeTextFile(filePath, "日本語", "shift_jis");

    expect(readFileSync(filePath).equals(iconv.encode("日本語", "shift_jis"))).toBe(true);
  });
});
