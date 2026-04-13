import { Dirent, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

export type CliOptions = {
  targetDir: string;
  outputFileName: string;
  title?: string;
  markdownOutput: boolean;
  recursive: boolean;
  overwrite: boolean;
  verbose: boolean;
  includeExtensions: string[];
};

export type IndexFile = {
  name: string;
  path: string;
  ext: string;
  dir: string;
  size: number;
  summary?: string;
};

export type RootIndex = {
  title?: string;
  basePath: string;
  files: IndexFile[];
};

const DEFAULT_INCLUDE_EXTENSIONS = ["md", "json"];

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

export function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let outputFileName = "index.json";
  let title: string | undefined;
  let markdownOutput = false;
  let recursive = true;
  let overwrite = true;
  let verbose = false;
  let includeExtensions = [...DEFAULT_INCLUDE_EXTENSIONS];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--output" || arg === "-o") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Please specify a file name for --output.");
      }
      outputFileName = value;
      i += 1;
      continue;
    }

    if (arg === "--title") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Please specify a title for --title.");
      }
      title = value;
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

    if (arg === "--no-overwrite") {
      overwrite = false;
      continue;
    }

    if (arg === "--include-ext") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Please specify a comma-separated extension list for --include-ext.");
      }
      includeExtensions = parseIncludeExtensions(value);
      i += 1;
      continue;
    }

    if (arg === "--verbose") {
      verbose = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
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
    recursive,
    overwrite,
    verbose,
    includeExtensions,
  };
}

export function printHelp(): void {
  console.log(`Usage:
  npm run build
  node dist/main.js <targetDir> [--output index.json] [--title "Docs Index"] [--markdown] [--no-recursive] [--no-overwrite] [--include-ext md,json] [--verbose]

Description:
  Generate a root JSON index that aggregates matching files found under
  the target directory. Markdown output is optional.
`);
}

export function collectIndexableFiles(
  dirPath: string,
  recursive: boolean,
  includeExtensions: string[],
): string[] {
  const entries = readdirSync(dirPath, { withFileTypes: true })
    .filter((entry: Dirent) => !entry.name.startsWith("."))
    .sort((a: Dirent, b: Dirent) => a.name.localeCompare(b.name, "ja"));

  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...collectIndexableFiles(fullPath, recursive, includeExtensions));
      }
      continue;
    }

    if (entry.isFile()) {
      const extension = entry.name.toLowerCase().split(".").at(-1);
      if (extension && includeExtensions.includes(extension)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export function buildIndexContent(
  title: string | undefined,
  targetPath: string,
  files: IndexFile[],
  outputPath: string,
): string {
  const index: RootIndex = {
    ...(title ? { title } : {}),
    basePath: relative(dirname(outputPath), targetPath).split("\\").join("/") || ".",
    files,
  };

  return `${JSON.stringify(index, null, 2)}\n`;
}

export function sanitizeTextForIndex(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeMarkdownTableCell(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .trim();
}

export function extractSummary(markdown: string, maxLength = 256): string | undefined {
  const lines = markdown.split(/\r?\n/);
  let firstNonEmptyLine: string | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    firstNonEmptyLine = line;
    break;
  }

  if (!firstNonEmptyLine) {
    return undefined;
  }

  if (firstNonEmptyLine.startsWith("#")) {
    const heading = firstNonEmptyLine.replace(/^#+\s*/, "").trim();
    if (heading.length === 0) {
      return undefined;
    }
    return sanitizeTextForIndex(heading);
  }

  let body = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    if (line.startsWith("#")) {
      break;
    }

    body = body.length === 0 ? line : `${body} ${line}`;
    if (body.length >= maxLength) {
      return sanitizeTextForIndex(body.slice(0, maxLength));
    }
  }

  if (body.length === 0) {
    return undefined;
  }

  return sanitizeTextForIndex(body.length > maxLength ? body.slice(0, maxLength) : body);
}

export function buildMarkdownIndexContent(targetPath: string, files: IndexFile[]): string {
  const lines: string[] = ["# Index", ""];

  if (files.length === 0) {
    lines.push("No matching files found.", "");
    return lines.join("\n");
  }

  lines.push("| File | Ext | Dir | Size | Summary |");
  lines.push("| --- | --- | --- | ---: | --- |");

  for (const file of files) {
    const link = relative(targetPath, join(targetPath, file.path)).split("\\").join("/");
    const fileLabel = escapeMarkdownTableCell(file.path);
    const ext = escapeMarkdownTableCell(file.ext);
    const dir = escapeMarkdownTableCell(file.dir);
    const summary = escapeMarkdownTableCell(file.summary ?? "");
    lines.push(`| [${fileLabel}](${link}) | ${ext} | ${dir} | ${file.size} | ${summary} |`);
  }

  lines.push("");
  return lines.join("\n");
}

function formatVerbosePath(basePath: string, targetPath: string): string {
  return relative(basePath, targetPath).split("\\").join("/") || ".";
}

function formatDuration(durationMs: number): string {
  return `${durationMs.toFixed(2)}ms`;
}

export function createIndexes(options: CliOptions): number {
  const totalStart = performance.now();
  const targetPath = resolve(options.targetDir);
  const targetStat = statSync(targetPath, { throwIfNoEntry: false });

  if (!targetStat?.isDirectory()) {
    throw new Error(`Target directory does not exist: ${targetPath}`);
  }

  const timings = {
    subdirsMs: 0,
    collectMs: 0,
    statMs: 0,
    readFileMs: 0,
    summaryMs: 0,
    jsonStringifyMs: 0,
    jsonWriteMs: 0,
    markdownMs: 0,
  };

  if (options.verbose) {
    console.log(`verbose: target=${targetPath}`);
    console.log(`verbose: output=${join(targetPath, options.outputFileName)}`);
    if (options.title) {
      console.log(`verbose: title=${options.title}`);
    }
    console.log(`verbose: include-ext=${options.includeExtensions.join(",")}`);
  }

  const subdirsStart = performance.now();
  const subdirs = readdirSync(targetPath, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry: Dirent) => join(targetPath, entry.name))
    .sort((a, b) => a.localeCompare(b, "ja"));
  timings.subdirsMs = performance.now() - subdirsStart;

  const outputPath = join(targetPath, options.outputFileName);
  if (!options.overwrite) {
    const existing = statSync(outputPath, { throwIfNoEntry: false });
    if (existing?.isFile()) {
      console.log(`skip: ${outputPath}`);
      return subdirs.length;
    }
  }

  const files: IndexFile[] = [];
  if (options.verbose) {
    console.log(`verbose: subdirectories=${subdirs.length}`);
    console.log(`verbose: scanning-dir=.`);
  }

  const collectStart = performance.now();
  const indexableFiles = collectIndexableFiles(targetPath, options.recursive, options.includeExtensions)
    .filter((filePath) => resolve(filePath) !== resolve(outputPath));
  timings.collectMs += performance.now() - collectStart;

  for (const filePath of indexableFiles) {
    const statStart = performance.now();
    const size = statSync(filePath).size;
    timings.statMs += performance.now() - statStart;

    const readFileStart = performance.now();
    const content = readFileSync(filePath, "utf8");
    timings.readFileMs += performance.now() - readFileStart;

    const ext = filePath.toLowerCase().split(".").at(-1) ?? "";
    const summaryStart = performance.now();
    const summary = ext === "md" ? extractSummary(content) : undefined;
    timings.summaryMs += performance.now() - summaryStart;

    const relativeFilePath = relative(targetPath, filePath).split("\\").join("/");
    const file = {
      name: relative(dirname(filePath), filePath).split("\\").join("/"),
      path: relativeFilePath,
      ext,
      dir: relative(targetPath, dirname(filePath)).split("\\").join("/"),
      size,
      summary,
    };
    files.push(file);

    if (options.verbose) {
      console.log(`verbose: found-file=${relativeFilePath}`);
    }
  }

  files.sort((a, b) => a.path.localeCompare(b.path, "ja"));

  mkdirSync(dirname(outputPath), { recursive: true });
  const jsonStringifyStart = performance.now();
  const jsonContent = buildIndexContent(options.title, targetPath, files, outputPath);
  timings.jsonStringifyMs = performance.now() - jsonStringifyStart;

  const jsonWriteStart = performance.now();
  writeFileSync(outputPath, jsonContent, "utf8");
  timings.jsonWriteMs = performance.now() - jsonWriteStart;
  console.log(`generated: ${outputPath}`);

  if (options.markdownOutput) {
    const markdownOutputPath = join(dirname(outputPath), "index.md");
    if (!options.overwrite) {
      const existingMarkdown = statSync(markdownOutputPath, { throwIfNoEntry: false });
      if (existingMarkdown?.isFile()) {
        console.log(`skip: ${markdownOutputPath}`);
        return subdirs.length;
      }
    }

    const markdownStart = performance.now();
    writeFileSync(markdownOutputPath, buildMarkdownIndexContent(targetPath, files), "utf8");
    timings.markdownMs = performance.now() - markdownStart;
    console.log(`generated: ${markdownOutputPath}`);
  }

  if (options.verbose) {
    const totalMs = performance.now() - totalStart;
    console.log(`verbose: files=${files.length}`);
    console.log(`verbose: timing.subdirs=${formatDuration(timings.subdirsMs)}`);
    console.log(`verbose: timing.collect=${formatDuration(timings.collectMs)}`);
    console.log(`verbose: timing.stat=${formatDuration(timings.statMs)}`);
    console.log(`verbose: timing.readFile=${formatDuration(timings.readFileMs)}`);
    console.log(`verbose: timing.summary=${formatDuration(timings.summaryMs)}`);
    console.log(`verbose: timing.json.stringify=${formatDuration(timings.jsonStringifyMs)}`);
    console.log(`verbose: timing.json.write=${formatDuration(timings.jsonWriteMs)}`);
    if (options.markdownOutput) {
      console.log(`verbose: timing.markdown=${formatDuration(timings.markdownMs)}`);
    }
    console.log(`verbose: timing.total=${formatDuration(totalMs)}`);
  }

  return subdirs.length;
}

export function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const count = createIndexes(options);
    console.log(`completed: ${count} subdirectories processed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    printHelp();
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
