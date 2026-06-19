import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildIndexContent, collectIndexableFiles, createIndexes } from "../src/main.js";
import { createTempWorkspace, readJsonFile } from "./test-utils.js";

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
      inputDirectory: docsDir,
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      excludeGlobs: undefined,
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      title?: string;
      generator: string;
      generation?: {
        schemaVersion: number;
        inputPath: string;
        markdownOutput: boolean;
        recursive: boolean;
        includeExtensions: string[];
        inputEncoding: string;
        outputEncoding: string;
        includeGeneratorMetadata: boolean;
      };
      basePath: string;
      files: Array<{ name: string; path: string; ext: string; dir: string; size: number; summary?: string }>;
    }>(join(docsDir, "index.json"));

    expect(processed).toBe(2);
    expect(index.title).toBeUndefined();
    expect(index.generator).toBe("miku-indexgen");
    expect(index.generation).toEqual({
      schemaVersion: 1,
      inputPath: ".",
      markdownOutput: false,
      recursive: true,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
      includeGeneratorMetadata: true,
    });
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

  it("formats each file entry on one line for search-friendly JSON", () => {
    const content = buildIndexContent(
      "Docs Index",
      "/work/docs",
      [
        {
          name: "a.md",
          path: "chapter1/a.md",
          ext: "md",
          dir: "chapter1",
          size: 4,
          summary: "A",
        },
        {
          name: "data.json",
          path: "chapter2/data.json",
          ext: "json",
          dir: "chapter2",
          size: 22,
        },
      ],
      "/work/docs/index.json",
    );

    expect(content).toBe(
      [
        "{",
        ' "title": "Docs Index",',
        ' "generator": "miku-indexgen",',
        ' "basePath": ".",',
        ' "files": [',
        '  {"name":"a.md","path":"chapter1/a.md","ext":"md","dir":"chapter1","size":4,"summary":"A"},',
        '  {"name":"data.json","path":"chapter2/data.json","ext":"json","dir":"chapter2","size":22}',
        " ]",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("escapes line breaks inside file entries without splitting the record line", () => {
    const content = buildIndexContent(
      undefined,
      "/work/docs",
      [
        {
          name: "a.md",
          path: "a.md",
          ext: "md",
          dir: "",
          size: 12,
          summary: "First line\nSecond line",
        },
      ],
      "/work/docs/index.json",
    );

    expect(content).toContain('  {"name":"a.md","path":"a.md","ext":"md","dir":"","size":12,"summary":"First line\\nSecond line"}');
    expect(content.split("\n")).toHaveLength(8);
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

  it("orders file entries by POSIX relative path using UTF-16 code units", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(join(docsDir, "B"), { recursive: true });
    mkdirSync(join(docsDir, "a"), { recursive: true });
    mkdirSync(join(docsDir, "あ"), { recursive: true });
    writeFileSync(join(docsDir, "B", "file.md"), "# B\n", "utf8");
    writeFileSync(join(docsDir, "a", "file.md"), "# A\n", "utf8");
    writeFileSync(join(docsDir, "あ", "file.md"), "# Japanese\n", "utf8");
    writeFileSync(join(docsDir, "Z.md"), "# Upper\n", "utf8");
    writeFileSync(join(docsDir, "a.md"), "# Lower\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      files: Array<{ path: string }>;
    }>(join(docsDir, "index.json"));

    expect(index.files.map((file) => file.path)).toEqual([
      "B/file.md",
      "Z.md",
      "a.md",
      "a/file.md",
      "あ/file.md",
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
      inputDirectory: docsDir,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      files: Array<{ name: string; path: string; ext: string; dir: string; summary?: string; size: number }>;
    }>(join(docsDir, "index.json"));

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

  it("excludes files by recursive input-relative glob after extension filtering", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(join(docsDir, "2026", "05", "images-ai-native", "src", "sections", "001"), { recursive: true });
    mkdirSync(join(docsDir, "2026", "05", "article"), { recursive: true });
    writeFileSync(join(docsDir, "2026", "05", "article", "main.md"), "# Main\n", "utf8");
    writeFileSync(join(docsDir, "2026", "05", "article", "note-image-recovery.md"), "# Recovery\n", "utf8");
    writeFileSync(
      join(docsDir, "2026", "05", "images-ai-native", "src", "sections", "001", "image-prompt.md"),
      "# Prompt\n",
      "utf8",
    );
    writeFileSync(
      join(docsDir, "2026", "05", "images-ai-native", "src", "sections", "001", "section-text.md"),
      "# Section\n",
      "utf8",
    );
    writeFileSync(join(docsDir, "2026", "05", "article", "data.json"), "{\"title\":\"Data\"}\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      excludeGlobs: [
        "**/images-*/**",
        "**/note-image-recovery.md",
        "**/image-prompt.md",
        "**/section-text.md",
      ],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      generation?: { includeExtensions: string[]; excludeGlobs?: string[] };
      files: Array<{ path: string }>;
    }>(join(docsDir, "index.json"));

    expect(index.generation).toMatchObject({
      includeExtensions: ["md"],
      excludeGlobs: [
        "**/images-*/**",
        "**/note-image-recovery.md",
        "**/image-prompt.md",
        "**/section-text.md",
      ],
    });
    expect(index.files.map((file) => file.path)).toEqual(["2026/05/article/main.md"]);
  });

  it("writes title only when --title is specified", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      title: "Docs Index",
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      title?: string;
    }>(join(docsDir, "index.json"));

    expect(index.title).toBe("Docs Index");
  });

  it("omits generator metadata when disabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
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

    const index = readJsonFile<{
      generator?: string;
    }>(join(docsDir, "index.json"));

    expect(index.generator).toBeUndefined();
  });

  it("uses the first matching JSON summary path when configured", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "data.json"), "{\n  \"metadata\": {\n    \"title\": \"Data Title\"\n  },\n  \"description\": \"Fallback\"\n}\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
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

    const index = readJsonFile<{
      files: Array<{ path: string; summary?: string }>;
    }>(join(docsDir, "index.json"));

    expect(index.files[0]).toMatchObject({ path: "data.json", summary: "Data Title" });
  });

  it("includes documented Markdown front matter metadata in file entries", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(
      join(docsDir, "writing-guide.md"),
      [
        "---",
        "title: Writing Guide",
        "description: >",
        "  Practical writing conventions for indexed Markdown files.",
        "topics:",
        "  - writing",
        "  - article",
        "  - tone",
        "category: guide",
        "status: stable",
        "audience: [agent, maintainer]",
        "created: 2026-05-22",
        "updated: 2026-05-23",
        "sources:",
        "  - type: human-input",
        "    label: user-provided requirements",
        "    role: primary",
        "    checked: 2026-05-22",
        "---",
        "",
        "# Body Title",
        "",
      ].join("\n"),
      "utf8",
    );

    createIndexes({
      inputDirectory: docsDir,
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      files: Array<{
        path: string;
        title?: string;
        description?: string;
        topics?: string[];
        category?: string;
        status?: string;
        audience?: string[];
        created?: string;
        updated?: string;
        sources?: Array<{ type: string; label?: string; role?: string; checked?: string }>;
        summary?: string;
      }>;
    }>(join(docsDir, "index.json"));

    expect(index.files[0]).toMatchObject({
      path: "writing-guide.md",
      title: "Writing Guide",
      description: "Practical writing conventions for indexed Markdown files.",
      topics: ["writing", "article", "tone"],
      category: "guide",
      status: "stable",
      audience: ["agent", "maintainer"],
      created: "2026-05-22",
      updated: "2026-05-23",
      sources: [
        {
          type: "human-input",
          label: "user-provided requirements",
          role: "primary",
          checked: "2026-05-22",
        },
      ],
      summary: "Body Title",
    });
  });

  it("writes outputs under outputDirectory when specified", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const outDir = join(workspace, "out");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      outputDirectory: outDir,
      title: undefined,
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      basePath: string;
      files: Array<{ name: string; path: string; ext: string; dir: string; size: number; summary?: string }>;
    }>(join(outDir, "index.json"));

    expect(index.basePath).toBe("../docs");
    expect(index.files).toEqual([
      {
        name: "root.md",
        path: "root.md",
        ext: "md",
        dir: "",
        size: 7,
        summary: "Root",
      },
    ]);
    expect(readFileSync(join(outDir, "index.md"), "utf8")).toContain("| [root.md](root.md) |");
  });
});
