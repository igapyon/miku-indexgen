import { describe, expect, it } from "vitest";

import { escapeMarkdownTableCell, extractFrontMatter, extractSummary, sanitizeTextForIndex } from "../src/main.js";

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

  it("ignores front matter when extracting summary", () => {
    expect(extractSummary("---\ntitle: Front Matter Title\ntopics:\n  - writing\n---\n\n# Body Title\n")).toBe("Body Title");
  });
});

describe("extractFrontMatter", () => {
  it("extracts title and topics from Markdown front matter", () => {
    expect(extractFrontMatter("---\ntitle: Writing Guide\ntopics:\n  - writing\n  - article\n---\n\n# Body\n")).toEqual({
      body: "# Body\n",
      metadata: {
        title: "Writing Guide",
        topics: ["writing", "article"],
      },
    });
  });

  it("extracts quoted title and inline topics", () => {
    expect(extractFrontMatter("---\ntitle: \"Writing Guide\"\ntopics: [writing, \"article\"]\n---\n# Body\n").metadata).toEqual({
      title: "Writing Guide",
      topics: ["writing", "article"],
    });
  });

  it("treats unclosed front matter as body text", () => {
    const markdown = "---\ntitle: Writing Guide\n# Body\n";
    expect(extractFrontMatter(markdown)).toEqual({
      body: markdown,
      metadata: {},
    });
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
