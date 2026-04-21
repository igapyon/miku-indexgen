import { describe, expect, it } from "vitest";

import { escapeMarkdownTableCell, extractSummary, sanitizeTextForIndex } from "../src/main.js";

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
