import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { IndexBatchError, createIndexes } from "../src/main.js";
import { createTempWorkspace, readJsonFile } from "./test-utils.js";

describe("createIndexes output handling", () => {
  it("reports add, none, and update statuses when outputs are rewritten", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "chapter1");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    let logs: string[] = [];

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");
    writeFileSync(join(chapter1, "a.md"), "# A\n", "utf8");

    try {
      createIndexes({
        inputDirectory: docsDir,
        title: undefined,
        markdownOutput: true,
        recursive: true,
        overwrite: true,
        verbose: false,
        includeExtensions: ["md", "json"],
        inputEncoding: "utf8",
        outputEncoding: "utf8",
      });
      logs = logSpy.mock.calls.map((call) => call.join(" "));
      expect(logs).toEqual([`add   : ${join(docsDir, "index.json")}`, `add   : ${join(docsDir, "index.md")}`]);

      logSpy.mockClear();
      createIndexes({
        inputDirectory: docsDir,
        title: undefined,
        markdownOutput: true,
        recursive: true,
        overwrite: true,
        verbose: false,
        includeExtensions: ["md", "json"],
        inputEncoding: "utf8",
        outputEncoding: "utf8",
      });
      logs = logSpy.mock.calls.map((call) => call.join(" "));
      expect(logs).toEqual([`none  : ${join(docsDir, "index.json")}`, `none  : ${join(docsDir, "index.md")}`]);

      writeFileSync(join(chapter1, "a.md"), "# A updated\n", "utf8");
      logSpy.mockClear();
      createIndexes({
        inputDirectory: docsDir,
        title: undefined,
        markdownOutput: true,
        recursive: true,
        overwrite: true,
        verbose: false,
        includeExtensions: ["md", "json"],
        inputEncoding: "utf8",
        outputEncoding: "utf8",
      });
      logs = logSpy.mock.calls.map((call) => call.join(" "));
      expect(logs).toEqual([`update: ${join(docsDir, "index.json")}`, `update: ${join(docsDir, "index.md")}`]);
    } finally {
      logSpy.mockRestore();
    }
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
      inputDirectory: docsDir,
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

  it("does not create JSON when Markdown output exists and overwrite is disabled", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");
    writeFileSync(join(docsDir, "index.md"), "keep markdown\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      title: undefined,
      markdownOutput: true,
      recursive: true,
      overwrite: false,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    expect(readFileSync(join(docsDir, "index.md"), "utf8")).toBe("keep markdown\n");
    expect(() => readFileSync(join(docsDir, "index.json"), "utf8")).toThrow();
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
      inputDirectory: docsDir,
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

  it("excludes generated JSON and Markdown outputs from the generated file list", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");
    writeFileSync(join(docsDir, "index.json"), "{}\n", "utf8");
    writeFileSync(join(docsDir, "index.md"), "# Previous Index\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      title: undefined,
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      files: Array<{ path: string }>;
    }>(join(docsDir, "index.json"));

    expect(index.files.map((file) => file.path)).toEqual(["root.md"]);
  });

  it("escapes markdown table cells in index.md", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const chapter1 = join(docsDir, "dir|name");

    mkdirSync(chapter1, { recursive: true });
    writeFileSync(join(chapter1, "a|b.md"), "plain | text\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
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

  it("refreshes an existing index from generation metadata", () => {
    const workspace = createTempWorkspace();
    const docsDir = join(workspace, "docs");
    const outDir = join(workspace, "out");

    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, "root.md"), "# Root\n", "utf8");

    createIndexes({
      inputDirectory: docsDir,
      outputDirectory: outDir,
      title: "Docs Index",
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md"],
      excludeGlobs: ["**/skip.md"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    writeFileSync(join(docsDir, "second.md"), "# Second\n", "utf8");
    writeFileSync(join(docsDir, "skip.md"), "# Skip\n", "utf8");

    createIndexes({
      inputDirectory: "",
      refreshIndex: join(outDir, "index.json"),
      title: undefined,
      markdownOutput: false,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    const index = readJsonFile<{
      title?: string;
      generation?: { inputPath: string; markdownOutput: boolean; includeExtensions: string[]; excludeGlobs?: string[] };
      files: Array<{ path: string; summary?: string }>;
    }>(join(outDir, "index.json"));

    expect(index.title).toBe("Docs Index");
    expect(index.generation).toMatchObject({
      inputPath: "../docs",
      markdownOutput: true,
      includeExtensions: ["md"],
      excludeGlobs: ["**/skip.md"],
    });
    expect(index.files.map((file) => file.path)).toEqual(["root.md", "second.md"]);
    expect(readFileSync(join(outDir, "index.md"), "utf8")).toContain("| [second.md](second.md) | md |  | 9 | Second |");
  });

  it("processes each direct visible child directory in batch mode", () => {
    const workspace = createTempWorkspace();
    const parentDir = join(workspace, "parent");
    const outDir = join(workspace, "out");
    const child1 = join(parentDir, "b1");
    const child2 = join(parentDir, "b2");

    mkdirSync(child1, { recursive: true });
    mkdirSync(child2, { recursive: true });
    mkdirSync(join(parentDir, ".hidden-child"), { recursive: true });
    writeFileSync(join(parentDir, "note.md"), "# Parent\n", "utf8");
    writeFileSync(join(child1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(child2, "b.md"), "# B\n", "utf8");

    const processed = createIndexes({
      inputDirectory: "",
      inputParentDirectory: parentDir,
      outputDirectory: outDir,
      title: undefined,
      markdownOutput: true,
      recursive: true,
      overwrite: true,
      verbose: false,
      includeExtensions: ["md", "json"],
      inputEncoding: "utf8",
      outputEncoding: "utf8",
    });

    expect(processed).toBe(2);
    expect(existsSync(join(outDir, "b1", "index.json"))).toBe(true);
    expect(existsSync(join(outDir, "b1", "index.md"))).toBe(true);
    expect(existsSync(join(outDir, "b2", "index.json"))).toBe(true);
    expect(existsSync(join(outDir, ".hidden-child", "index.json"))).toBe(false);
    expect(existsSync(join(outDir, "note.md"))).toBe(false);
  });

  it("aggregates child directory failures and continues remaining children", () => {
    const workspace = createTempWorkspace();
    const parentDir = join(workspace, "parent");
    const outDir = join(workspace, "out");
    const child1 = join(parentDir, "b1");
    const child2 = join(parentDir, "b2");
    const child3 = join(parentDir, "b3");

    mkdirSync(child1, { recursive: true });
    mkdirSync(child2, { recursive: true });
    mkdirSync(child3, { recursive: true });
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(child1, "a.md"), "# A\n", "utf8");
    writeFileSync(join(child2, "b.md"), "# B\n", "utf8");
    writeFileSync(join(child3, "c.md"), "# C\n", "utf8");
    writeFileSync(join(outDir, "b2"), "not a directory\n", "utf8");

    let batchError: IndexBatchError | undefined;
    try {
      createIndexes({
        inputDirectory: "",
        inputParentDirectory: parentDir,
        outputDirectory: outDir,
        title: undefined,
        markdownOutput: true,
        recursive: true,
        overwrite: true,
        verbose: false,
        includeExtensions: ["md", "json"],
        inputEncoding: "utf8",
        outputEncoding: "utf8",
      });
    } catch (error) {
      if (error instanceof IndexBatchError) {
        batchError = error;
      } else {
        throw error;
      }
    }

    expect(batchError?.childDirectoriesProcessed).toBe(3);
    expect(batchError?.childDirectoriesFailed).toBe(1);
    expect(batchError?.childFailureMessages.join("\n")).toContain("Output directory must be a directory");
    expect(existsSync(join(outDir, "b1", "index.json"))).toBe(true);
    expect(existsSync(join(outDir, "b3", "index.json"))).toBe(true);
  });
});
