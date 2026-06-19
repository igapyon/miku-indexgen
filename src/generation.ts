import { dirname, relative, resolve } from "node:path";
import { readTextFile } from "./encoding.js";
import { normalizeExcludeGlobPatterns } from "./glob.js";
import { toPosixPath } from "./path-utils.js";
import type { CliOptions, GenerationMetadata } from "./types.js";

export function buildGenerationMetadata(options: CliOptions, targetPath: string, outputPath: string): GenerationMetadata {
  const jsonSummaryPaths = options.jsonSummaryPaths && options.jsonSummaryPaths.length > 0 ? options.jsonSummaryPaths : undefined;
  const excludeGlobs = options.excludeGlobs && options.excludeGlobs.length > 0
    ? normalizeExcludeGlobPatterns(options.excludeGlobs)
    : undefined;
  return {
    schemaVersion: 1,
    inputPath: toPosixPath(relative(dirname(outputPath), targetPath)) || ".",
    markdownOutput: options.markdownOutput,
    recursive: options.recursive,
    includeExtensions: options.includeExtensions,
    ...(excludeGlobs ? { excludeGlobs } : {}),
    inputEncoding: options.inputEncoding,
    outputEncoding: options.outputEncoding,
    ...(jsonSummaryPaths ? { jsonSummaryPaths } : {}),
    ...(options.title ? { title: options.title } : {}),
    includeGeneratorMetadata: options.includeGeneratorMetadata !== false,
  };
}

export function readGenerationMetadata(indexPath: string): GenerationMetadata {
  const content = readTextFile(indexPath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse refresh index JSON: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || !("generation" in parsed)) {
    throw new Error("Refresh index does not include generation metadata. Regenerate it with --input-directory first.");
  }

  const generation = (parsed as { generation?: unknown }).generation;
  if (!isGenerationMetadata(generation)) {
    throw new Error("Refresh index includes invalid generation metadata. Regenerate it with --input-directory first.");
  }

  return generation;
}

export function buildRefreshOptions(options: CliOptions, indexPath: string): CliOptions {
  const generation = readGenerationMetadata(indexPath);
  const outputDirectory = dirname(indexPath);
  const inputDirectory = resolve(outputDirectory, generation.inputPath);

  return {
    inputDirectory,
    outputDirectory,
    title: generation.title,
    markdownOutput: generation.markdownOutput,
    includeGeneratorMetadata: generation.includeGeneratorMetadata,
    jsonSummaryPaths: generation.jsonSummaryPaths,
    recursive: generation.recursive,
    overwrite: options.overwrite,
    verbose: options.verbose,
    includeExtensions: generation.includeExtensions,
    excludeGlobs: generation.excludeGlobs,
    inputEncoding: generation.inputEncoding,
    outputEncoding: generation.outputEncoding,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isGenerationMetadata(value: unknown): value is GenerationMetadata {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const generation = value as Partial<GenerationMetadata>;
  return (
    generation.schemaVersion === 1 &&
    typeof generation.inputPath === "string" &&
    typeof generation.markdownOutput === "boolean" &&
    typeof generation.recursive === "boolean" &&
    isStringArray(generation.includeExtensions) &&
    typeof generation.inputEncoding === "string" &&
    typeof generation.outputEncoding === "string" &&
    (generation.excludeGlobs === undefined || isStringArray(generation.excludeGlobs)) &&
    (generation.jsonSummaryPaths === undefined || isStringArray(generation.jsonSummaryPaths)) &&
    (generation.title === undefined || typeof generation.title === "string") &&
    typeof generation.includeGeneratorMetadata === "boolean"
  );
}
