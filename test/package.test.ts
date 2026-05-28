import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readJsonFile } from "./test-utils.js";

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
    const packageJson = readJsonFile<PackageJson>("package.json");

    expect(packageJson.bin).toEqual({
      "miku-indexgen": "./dist/main.js",
    });
  });

  it("keeps the package publish surface focused on runtime files", () => {
    const packageJson = readJsonFile<PackageJson>("package.json");

    expect(packageJson.files).toEqual(["dist/", "README.md", "LICENSE"]);
  });

  it("declares publish metadata for npm consumers", () => {
    const packageJson = readJsonFile<PackageJson>("package.json");

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
    const packageJson = readJsonFile<PackageJson>("package.json");

    expect(packageJson.exports).toEqual({
      ".": "./dist/main.js",
    });
    expect(packageJson.types).toBe("./dist/main.d.ts");
  });

  it("includes a pack dry-run script for publish checks", () => {
    const packageJson = readJsonFile<PackageJson>("package.json");

    expect(packageJson.scripts?.["pack:check"]).toBe(
      "npm_config_cache=workplace/.npm-cache npm pack --dry-run",
    );
  });

  it("includes local bundle build and smoke scripts for release assets", () => {
    const packageJson = readJsonFile<PackageJson>("package.json");

    expect(packageJson.scripts?.bundle).toBe("npm run build && node scripts/build-cli-bundle.mjs");
    expect(packageJson.scripts?.["smoke:bundle"]).toBe("node scripts/smoke-cli-bundle.mjs");
  });

  it("keeps the CLI version constant aligned with package.json", () => {
    const packageJson = readJsonFile<PackageJson & { version: string }>("package.json");
    const versionSource = readFileSync(join("src", "version.ts"), "utf8");

    expect(versionSource).toContain(`VERSION = "${packageJson.version}"`);
  });

  it("keeps a node shebang on the TypeScript CLI source for the built bin", () => {
    const mainSource = readFileSync(join("src", "main.ts"), "utf8");

    expect(mainSource.startsWith("#!/usr/bin/env node\n")).toBe(true);
  });

  it("keeps the canonical release workflow focused on GitHub Release assets", () => {
    const workflow = readFileSync(join(".github", "workflows", "release-cli-bundle.yml"), "utf8");

    expect(existsSync(join(".github", "workflows", "publish-npm.yml"))).toBe(false);
    expect(workflow).toContain("release-cli-bundle:");
    expect(workflow).toContain("Build CLI bundle");
    expect(workflow).toContain("Smoke test CLI bundle");
    expect(workflow).toContain("Upload release assets");
    expect(workflow).toContain("softprops/action-gh-release@v2");
    expect(workflow).not.toContain("publish-npm-package:");
    expect(workflow).not.toContain("id-token: write");
    expect(workflow).not.toContain('registry-url: "https://registry.npmjs.org"');
    expect(workflow).not.toContain("npm publish");
  });
});
