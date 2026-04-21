import { describe, expect, it, vi } from "vitest";

import { HelpRequestedError, parseArgs, parseIncludeExtensions, printHelp } from "../src/main.js";

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

    expect(output).toContain("miku-indexgen <targetDir>");
  });
});
