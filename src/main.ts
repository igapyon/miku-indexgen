#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { HelpRequestedError, VersionRequestedError, parseArgs } from "./cli.js";
import { printHelp } from "./help.js";
import { createIndexes } from "./indexer.js";
import { VERSION } from "./version.js";

export type { CliOptions, GenerationMetadata, IndexFile, IndexSource, RootIndex } from "./types.js";
export { HelpRequestedError, VersionRequestedError, parseArgs, parseIncludeExtensions } from "./cli.js";
export { normalizeEncodingName, parseEncodingOption, readTextFile, writeTextFile } from "./encoding.js";
export { extractFrontMatter } from "./frontmatter.js";
export type { MarkdownFrontMatter, MarkdownFrontMatterResult } from "./frontmatter.js";
export { buildGenerationMetadata, buildRefreshOptions, readGenerationMetadata } from "./generation.js";
export { matchesAnyExcludeGlob, matchesExcludeGlob, normalizeExcludeGlobPattern, normalizeExcludeGlobPatterns } from "./glob.js";
export { formatIndexJson } from "./index-json.js";
export { collectIndexableFiles, buildIndexContent, createIndexes, refreshIndex } from "./indexer.js";
export { extractJsonSummary, getJsonPointerValue, parseJsonSummaryPaths } from "./json-summary.js";
export { printHelp } from "./help.js";
export { createEmptyTimings, createVerboseLogger, logVerboseStart, logVerboseTimings } from "./logging.js";
export {
  buildMarkdownIndexContent,
  escapeMarkdownTableCell,
  extractSummary,
  extractSummaryFromBody,
} from "./markdown.js";
export { getFileExtension, getFileName, toPosixPath } from "./path-utils.js";
export { sanitizeTextForIndex } from "./text-sanitize.js";

export function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const count = createIndexes(options);
    console.log(`completed: ${count} subdirectories processed`);
  } catch (error) {
    if (error instanceof HelpRequestedError) {
      printHelp();
      process.exit(0);
    }

    if (error instanceof VersionRequestedError) {
      console.log(`miku-indexgen ${VERSION}`);
      process.exit(0);
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    printHelp();
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
