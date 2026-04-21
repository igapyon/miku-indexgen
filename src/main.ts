#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { HelpRequestedError, parseArgs, printHelp } from "./cli.js";
import { createIndexes } from "./indexer.js";

export type { CliOptions, IndexFile, RootIndex } from "./types.js";
export { HelpRequestedError, parseArgs, parseIncludeExtensions, printHelp } from "./cli.js";
export { normalizeEncodingName, parseEncodingOption, readTextFile, writeTextFile } from "./encoding.js";
export { collectIndexableFiles, buildIndexContent, createIndexes } from "./indexer.js";
export { createEmptyTimings, createVerboseLogger, logVerboseStart, logVerboseTimings } from "./logging.js";
export {
  buildMarkdownIndexContent,
  escapeMarkdownTableCell,
  extractSummary,
  sanitizeTextForIndex,
} from "./markdown.js";
export { getFileExtension, getFileName, toPosixPath } from "./path-utils.js";

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

    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    printHelp();
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
