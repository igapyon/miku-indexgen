import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { collectIndexableFiles, createIndexes } from "../src/main.js";
import { createTempWorkspace } from "./test-utils.js";

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
      generator: string;
      basePath: string;
      files: Array<{ name: string; path: string; ext: string; dir: string; size: number; summary?: string }>;
    };

    expect(processed).toBe(2);
    expect(index.title).toBeUndefined();
    expect(index.generator).toBe("miku-indexgen");
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

  it("omits generator metadata when disabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: undefined,
      markdownOutput: false,
      includeGeneratorMetadata: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      generator?: string;
    };

    expect(index.generator).toBeUndefined();
  });

  it("uses the first matching JSON summary path when configured", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "data.json"), "{\n  \"metadata\": {\n    \"title\": \"Data Title\"\n  },\n  \"description\": \"Fallback\"\n}\n", "utf8");

    createIndexes({
      targetDir: docsDir,
      outputFileName: "index.json",
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
      jsonSummaryPaths: ["/title", "/metadata/title", "/description"],
    });

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      files: Array<{ path: string; summary?: string }>;
    };

    expect(index.files[0]).toMatchObject({ path: "data.json", summary: "Data Title" });
  });
});
