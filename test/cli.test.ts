import { describe, expect, it, vi } from "vitest";

import { HelpRequestedError, VersionRequestedError, parseArgs, parseIncludeExtensions, printHelp } from "../src/main.js";

describe("parseArgs", () => {
  it("parses the input directory and options", () => {
    expect(parseArgs(["--input-directory", "./docs", "--output-directory", "./out", "--title", "Docs Index", "--markdown", "--no-generator", "--json-summary-path", "/title,/metadata/name", "--no-recursive", "--no-overwrite", "--include-ext", "md,json", "--exclude-glob", "**\\images\\*", "--exclude-glob", "**/section-text.md", "--input-encoding", "ShiftJIS", "--output-encoding", "shift-jis", "--verbose"])).toEqual({
      inputDirectory: "./docs",
      outputDirectory: "./out",
      refreshIndex: undefined,
      title: "Docs Index",
      markdownOutput: true,
      includeGeneratorMetadata: false,
      jsonSummaryPaths: ["/title", "/metadata/name"],
      recursive: false,
      overwrite: false,
      verbose: true,
      includeExtensions: ["md", "json"],
      excludeGlobs: ["**/images/*", "**/section-text.md"],
      inputEncoding: "shift_jis",
      outputEncoding: "shift_jis",
    });
  });

  it("enables generator metadata by default", () => {
    expect(parseArgs(["--input-directory", "./docs"]).includeGeneratorMetadata).toBe(true);
  });

  it("parses refresh-index without requiring an input directory", () => {
    expect(parseArgs(["--refresh-index", "workplace/index.json", "--verbose"])).toMatchObject({
      inputDirectory: "",
      refreshIndex: "workplace/index.json",
      verbose: true,
    });
  });
});

describe("parseIncludeExtensions", () => {
  it("normalizes a comma-separated extension list", () => {
    expect(parseIncludeExtensions(".MD, json ,md")).toEqual(["md", "json"]);
  });
});

describe("help handling", () => {
  it("signals help requests without exiting from the parser", () => {
    expect(() => parseArgs(["--help"])).toThrow(HelpRequestedError);
  });
});

describe("version handling", () => {
  it("signals version requests without requiring an input directory", () => {
    expect(() => parseArgs(["--version"])).toThrow(VersionRequestedError);
  });
});

describe("printHelp", () => {
  it("prints the package bin command", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    let output = "";

    try {
      printHelp();
      output = logSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    } finally {
      logSpy.mockRestore();
    }

    expect(output).toContain("miku-indexgen --input-directory <dir>");
    expect(output).toContain("miku-indexgen --refresh-index <index.json>");
    expect(output).toContain("--no-generator");
    expect(output).toContain("--json-summary-path");
    expect(output).toContain("--exclude-glob");
    expect(output).toContain("applies --exclude-glob after extension filtering");
    expect(output).toContain("Separators are normalized to \"/\".");
    expect(output).toContain("Character");
    expect(output).toContain("files[] is sorted by normalized relative path using UTF-16 code unit order.");
    expect(output).toContain(
      "supported fields: title, description, topics, category, status, audience,"
    );
    expect(output).toContain("title, description, and topics are primary scan-time file selection signals");
  });
});
