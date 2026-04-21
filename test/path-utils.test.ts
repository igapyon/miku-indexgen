import { describe, expect, it } from "vitest";

import { getFileExtension, getFileName, toPosixPath } from "../src/path-utils.js";

describe("getFileExtension", () => {
  it("returns the lower-cased extension for regular file names", () => {
    expect(getFileExtension("/tmp/Example.MD")).toBe("md");
    expect(getFileExtension("dir/archive.tar.gz")).toBe("gz");
  });

  it("returns an empty string for files without a usable extension", () => {
    expect(getFileExtension("README")).toBe("");
    expect(getFileExtension(".gitignore")).toBe("");
    expect(getFileExtension("note.")).toBe("");
  });
});

describe("getFileName", () => {
  it("returns the basename portion of a path", () => {
    expect(getFileName("/tmp/docs/a.md")).toBe("a.md");
  });
});

describe("toPosixPath", () => {
  it("normalizes Windows separators", () => {
    expect(toPosixPath(String.raw`dir\child\file.md`)).toBe("dir/child/file.md");
  });
});
