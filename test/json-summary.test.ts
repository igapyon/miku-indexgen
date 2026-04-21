import { describe, expect, it } from "vitest";

import { extractJsonSummary, getJsonPointerValue, parseJsonSummaryPaths } from "../src/main.js";

describe("parseJsonSummaryPaths", () => {
  it("parses and deduplicates a comma-separated JSON Pointer list", () => {
    expect(parseJsonSummaryPaths("/title, /metadata/name, /title")).toEqual(["/title", "/metadata/name"]);
  });

  it("requires JSON Pointer syntax", () => {
    expect(() => parseJsonSummaryPaths("title")).toThrow('starting with "/"');
  });
});

describe("getJsonPointerValue", () => {
  it("reads nested object and array values", () => {
    expect(getJsonPointerValue({ items: [{ title: "A" }] }, "/items/0/title")).toBe("A");
  });

  it("decodes escaped pointer segments", () => {
    expect(getJsonPointerValue({ "a/b": { "c~d": "A" } }, "/a~1b/c~0d")).toBe("A");
  });
});

describe("extractJsonSummary", () => {
  it("uses the first string value found by the configured paths", () => {
    expect(extractJsonSummary("{\"metadata\":{\"title\":\"Data\"},\"description\":\"Fallback\"}", [
      "/title",
      "/metadata/title",
      "/description",
    ])).toBe("Data");
  });

  it("ignores invalid JSON and non-string values", () => {
    expect(extractJsonSummary("{\"title\":123,\"description\":\"Fallback\"}", ["/title", "/description"])).toBe(
      "Fallback",
    );
    expect(extractJsonSummary("{", ["/title"])).toBeUndefined();
  });
});
