import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { createIndexes } from "../src/main.js";
import { createTempWorkspace } from "./test-utils.js";

describe("createIndexes verbose output", () => {
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
        inputDirectory: docsDir,
        title: "Verbose Docs",
        markdownOutput: false,
        recursive: true,
        overwrite: true,
        verbose: true,
        includeExtensions: ["md", "json"],
        jsonSummaryPaths: ["/title", "/name"],
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
    expect(logs).toContain("verbose: generator=enabled");
    expect(logs).toContain("verbose: json-summary-path=/title,/name");
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
});
