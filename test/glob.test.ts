import { describe, expect, it } from "vitest";

import { matchesAnyExcludeGlob, matchesExcludeGlob, normalizeExcludeGlobPatterns } from "../src/main.js";

describe("exclude glob matching", () => {
  it("matches * and ? within one path segment", () => {
    expect(matchesExcludeGlob("notes/image-prompt.md", "notes/image-*.md")).toBe(true);
    expect(matchesExcludeGlob("notes/image-prompt.md", "notes/image-??????.md")).toBe(true);
    expect(matchesExcludeGlob("notes/nested/image-prompt.md", "notes/*.md")).toBe(false);
  });

  it("matches ** across zero or more path segments", () => {
    expect(matchesExcludeGlob("note-image-recovery.md", "**/note-image-recovery.md")).toBe(true);
    expect(matchesExcludeGlob("2026/05/note-image-recovery.md", "**/note-image-recovery.md")).toBe(true);
    expect(matchesExcludeGlob("2026/05/images/foo.md", "**/images/*")).toBe(true);
    expect(matchesExcludeGlob("2026/05/images/sections/foo.md", "**/images/*")).toBe(false);
  });

  it("matches any configured exclude glob", () => {
    expect(
      matchesAnyExcludeGlob("2026/05/images-ai-native/src/sections/001/section-text.md", [
        "**/images-*/*",
        "**/section-text.md",
      ]),
    ).toBe(true);
    expect(matchesAnyExcludeGlob("2026/05/article.md", ["**/images/*", "**/section-text.md"])).toBe(false);
  });

  it("normalizes separators, whitespace, duplicates, and empty patterns", () => {
    expect(normalizeExcludeGlobPatterns([" **\\images\\* ", "", "**/images/*"])).toEqual(["**/images/*"]);
  });
});
