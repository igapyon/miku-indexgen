import type { CliOptions } from "./types.js";
import { parseEncodingOption } from "./encoding.js";
import { parseJsonSummaryPaths } from "./json-summary.js";

const DEFAULT_INCLUDE_EXTENSIONS = ["md", "json"];
const DEFAULT_TEXT_ENCODING = "utf8";

export class HelpRequestedError extends Error {
  constructor() {
    super("Help requested.");
    this.name = "HelpRequestedError";
  }
}

export function parseIncludeExtensions(value: string): string[] {
  const extensions = value
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/^\./, ""))
    .filter((item) => item.length > 0);

  if (extensions.length === 0) {
    throw new Error("Please specify at least one extension for --include-ext.");
  }

  return [...new Set(extensions)];
}

function readRequiredOptionValue(argv: string[], index: number, optionName: string, description: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`Please specify ${description} for ${optionName}.`);
  }
  return value;
}

export function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let outputFileName = "index.json";
  let title: string | undefined;
  let markdownOutput = false;
  let includeGeneratorMetadata = true;
  let jsonSummaryPaths: string[] | undefined;
  let recursive = true;
  let overwrite = true;
  let verbose = false;
  let includeExtensions = [...DEFAULT_INCLUDE_EXTENSIONS];
  let inputEncoding = DEFAULT_TEXT_ENCODING;
  let outputEncoding = DEFAULT_TEXT_ENCODING;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--output" || arg === "-o") {
      outputFileName = readRequiredOptionValue(argv, i, "--output", "a file name");
      i += 1;
      continue;
    }

    if (arg === "--title") {
      title = readRequiredOptionValue(argv, i, "--title", "a title");
      i += 1;
      continue;
    }

    if (arg === "--no-recursive") {
      recursive = false;
      continue;
    }

    if (arg === "--markdown") {
      markdownOutput = true;
      continue;
    }

    if (arg === "--no-generator") {
      includeGeneratorMetadata = false;
      continue;
    }

    if (arg === "--json-summary-path") {
      jsonSummaryPaths = parseJsonSummaryPaths(
        readRequiredOptionValue(argv, i, "--json-summary-path", "a comma-separated JSON Pointer list"),
      );
      i += 1;
      continue;
    }

    if (arg === "--no-overwrite") {
      overwrite = false;
      continue;
    }

    if (arg === "--include-ext") {
      includeExtensions = parseIncludeExtensions(
        readRequiredOptionValue(argv, i, "--include-ext", "a comma-separated extension list"),
      );
      i += 1;
      continue;
    }

    if (arg === "--input-encoding") {
      inputEncoding = parseEncodingOption(readRequiredOptionValue(argv, i, "--input-encoding", "an encoding"));
      i += 1;
      continue;
    }

    if (arg === "--output-encoding") {
      outputEncoding = parseEncodingOption(readRequiredOptionValue(argv, i, "--output-encoding", "an encoding"));
      i += 1;
      continue;
    }

    if (arg === "--verbose") {
      verbose = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      throw new HelpRequestedError();
    }

    positional.push(arg);
  }

  const targetDir = positional[0];
  if (!targetDir) {
    throw new Error("Please specify a target directory.");
  }

  return {
    targetDir,
    outputFileName,
    title,
    markdownOutput,
    includeGeneratorMetadata,
    jsonSummaryPaths,
    recursive,
    overwrite,
    verbose,
    includeExtensions,
    inputEncoding,
    outputEncoding,
  };
}

export function printHelp(): void {
  console.log(`Usage:
  npm run build
  miku-indexgen <targetDir> [--output index.json] [--title "Docs Index"] [--markdown] [--no-generator] [--json-summary-path /title,/name] [--no-recursive] [--no-overwrite] [--include-ext md,json] [--input-encoding utf8] [--output-encoding utf8] [--verbose]

Description:
  Generate a root JSON index that aggregates matching files found under
  the target directory. Markdown output is optional.
  Supported encodings: utf8, shift_jis
`);
}
