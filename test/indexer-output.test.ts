import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createIndexes } from "../src/main.js";
import { createTempWorkspace } from "./test-utils.js";

describe("createIndexes output handling", () => {
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

    const index = JSON.parse(readFileSync(join(docsDir, "index.json"), "utf8")) as {
      files: Array<{ path: string }>;
    };

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
});
