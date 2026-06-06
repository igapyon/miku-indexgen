import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import iconv from "iconv-lite";

import { parseEncodingOption, writeTextFile } from "../src/main.js";
import { createTempWorkspace } from "./test-utils.js";

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

describe("writeTextFile", () => {
  it("writes text with the specified encoding", () => {
    const workspace = createTempWorkspace();
    const filePath = join(workspace, "sample.txt");

    writeTextFile(filePath, "日本語", "shift_jis");

    expect(readFileSync(filePath).equals(iconv.encode("日本語", "shift_jis"))).toBe(true);
  });
});
