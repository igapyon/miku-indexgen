import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type PackageJson = {
  bugs?: { url?: string };
  bin?: Record<string, string>;
  description?: string;
  exports?: Record<string, string>;
  files?: string[];
  homepage?: string;
  keywords?: string[];
  license?: string;
  repository?: { type?: string; url?: string };
  scripts?: Record<string, string>;
  types?: string;
};

describe("package metadata", () => {
  it("exposes the built CLI entry point as the package bin", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;

    expect(packageJson.bin).toEqual({
      "miku-indexgen": "./dist/main.js",
    });
  });

  it("keeps the package publish surface focused on runtime files", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;

    expect(packageJson.files).toEqual(["dist/", "README.md", "LICENSE"]);
  });

  it("declares publish metadata for npm consumers", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;

    expect(packageJson.description).toContain("CLI");
    expect(packageJson.license).toBe("Apache-2.0");
    expect(packageJson.repository).toEqual({
      type: "git",
      url: "git+https://github.com/igapyon/miku-indexgen.git",
    });
    expect(packageJson.homepage).toBe("https://github.com/igapyon/miku-indexgen#readme");
    expect(packageJson.bugs).toEqual({
      url: "https://github.com/igapyon/miku-indexgen/issues",
    });
    expect(packageJson.keywords).toEqual(["cli", "index", "markdown", "json", "ai"]);
  });

  it("exports the built entry point and generated type declarations", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;

    expect(packageJson.exports).toEqual({
      ".": "./dist/main.js",
    });
    expect(packageJson.types).toBe("./dist/main.d.ts");
  });

  it("includes a pack dry-run script for publish checks", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;

    expect(packageJson.scripts?.["pack:check"]).toBe(
      "npm_config_cache=workplace/.npm-cache npm pack --dry-run",
    );
  });

  it("keeps a node shebang on the TypeScript CLI source for the built bin", () => {
    const mainSource = readFileSync(join("src", "main.ts"), "utf8");

    expect(mainSource.startsWith("#!/usr/bin/env node\n")).toBe(true);
  });
});
