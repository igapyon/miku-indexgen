import { Dirent, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { readTextFile, writeTextFile } from "./encoding.js";
import { extractFrontMatter } from "./frontmatter.js";
import { buildGenerationMetadata, buildRefreshOptions } from "./generation.js";
import { formatIndexJson } from "./index-json.js";
import { createEmptyTimings, createVerboseLogger, logVerboseStart, logVerboseTimings } from "./logging.js";
import { buildMarkdownIndexContent, extractSummaryFromBody } from "./markdown.js";
import { extractJsonSummary } from "./json-summary.js";
import { compareUtf16CodeUnitStrings, getFileExtension, getFileName, toPosixPath } from "./path-utils.js";
import type { CreateIndexTimings, VerboseLogger } from "./logging.js";
import type { CliOptions, GenerationMetadata, IndexFile, RootIndex } from "./types.js";

const GENERATOR_NAME = "miku-indexgen";
const JSON_OUTPUT_FILE_NAME = "index.json";
const MARKDOWN_OUTPUT_FILE_NAME = "index.md";

type OutputPaths = {
  jsonPath: string;
  markdownPath?: string;
};

type OutputWriteStatus = "add" | "update" | "none";

function formatOutputStatus(status: OutputWriteStatus): string {
  return status.padEnd(6, " ");
}

function listVisibleEntries(dirPath: string): Dirent[] {
  return readdirSync(dirPath, { withFileTypes: true })
    .filter((entry: Dirent) => !entry.name.startsWith("."))
    .sort((a: Dirent, b: Dirent) => compareUtf16CodeUnitStrings(a.name, b.name));
}

export function collectIndexableFiles(
  dirPath: string,
  recursive: boolean,
  includeExtensions: string[],
): string[] {
  const allowedExtensions = new Set(includeExtensions);
  return collectIndexableFilesWithSet(dirPath, recursive, allowedExtensions, listVisibleEntries(dirPath));
}

function getOutputPaths(outputDirectoryPath: string, options: CliOptions): OutputPaths {
  const jsonPath = join(outputDirectoryPath, JSON_OUTPUT_FILE_NAME);
  return {
    jsonPath,
    ...(options.markdownOutput ? { markdownPath: join(dirname(jsonPath), MARKDOWN_OUTPUT_FILE_NAME) } : {}),
  };
}

function isGeneratedOutputPath(filePath: string, outputPaths: OutputPaths): boolean {
  const resolvedFilePath = resolve(filePath);
  return [outputPaths.jsonPath, outputPaths.markdownPath]
    .filter((outputPath): outputPath is string => outputPath !== undefined)
    .some((outputPath) => resolve(outputPath) === resolvedFilePath);
}

function countImmediateSubdirectories(targetPath: string): number {
  return listVisibleEntries(targetPath)
    .filter((entry: Dirent) => entry.isDirectory())
    .length;
}

function shouldSkipExistingOutput(outputPath: string): boolean {
  return statSync(outputPath, { throwIfNoEntry: false })?.isFile() === true;
}

function writeTextFileWithStatus(filePath: string, content: string, encoding: string): OutputWriteStatus {
  const existingFile = statSync(filePath, { throwIfNoEntry: false });
  if (existingFile?.isFile() !== true) {
    writeTextFile(filePath, content, encoding);
    return "add";
  }

  const existingContent = readTextFile(filePath, encoding);
  if (existingContent === content) {
    return "none";
  }

  writeTextFile(filePath, content, encoding);
  return "update";
}

function findExistingOutputPath(outputPaths: OutputPaths, overwriteEnabled: boolean): string | undefined {
  if (overwriteEnabled) {
    return undefined;
  }

  return [outputPaths.jsonPath, outputPaths.markdownPath]
    .filter((outputPath): outputPath is string => outputPath !== undefined)
    .find((outputPath) => shouldSkipExistingOutput(outputPath));
}

function buildIndexFile(
  filePath: string,
  targetPath: string,
  inputEncoding: string,
  jsonSummaryPaths: string[] | undefined,
  timings: CreateIndexTimings,
): IndexFile {
  const statStart = performance.now();
  const size = statSync(filePath).size;
  timings.statMs += performance.now() - statStart;

  const ext = getFileExtension(filePath);
  const extractedFields =
    ext === "md"
      ? readMarkdownIndexFields(filePath, inputEncoding, timings)
      : { summary: readJsonSummaryIfConfigured(filePath, ext, jsonSummaryPaths, inputEncoding, timings) };

  return {
    name: getFileName(filePath),
    path: toPosixPath(relative(targetPath, filePath)),
    ext,
    dir: toPosixPath(relative(targetPath, dirname(filePath))),
    size,
    ...extractedFields,
  };
}

function readJsonSummaryIfConfigured(
  filePath: string,
  ext: string,
  jsonSummaryPaths: string[] | undefined,
  inputEncoding: string,
  timings: CreateIndexTimings,
): string | undefined {
  if (ext === "json" && jsonSummaryPaths && jsonSummaryPaths.length > 0) {
    return readJsonSummary(filePath, inputEncoding, jsonSummaryPaths, timings);
  }

  return undefined;
}

function readMarkdownIndexFields(
  filePath: string,
  inputEncoding: string,
  timings: CreateIndexTimings,
): Pick<
  IndexFile,
  "summary" | "title" | "description" | "topics" | "category" | "status" | "audience" | "created" | "updated" | "sources"
> {
  const readFileStart = performance.now();
  const content = readTextFile(filePath, inputEncoding);
  timings.readFileMs += performance.now() - readFileStart;

  const summaryStart = performance.now();
  const { body, metadata } = extractFrontMatter(content);
  const summary = extractSummaryFromBody(body);
  timings.summaryMs += performance.now() - summaryStart;

  return {
    ...metadata,
    summary,
  };
}

function readJsonSummary(
  filePath: string,
  inputEncoding: string,
  jsonSummaryPaths: string[],
  timings: CreateIndexTimings,
): string | undefined {
  const readFileStart = performance.now();
  const content = readTextFile(filePath, inputEncoding);
  timings.readFileMs += performance.now() - readFileStart;

  const summaryStart = performance.now();
  const summary = extractJsonSummary(content, jsonSummaryPaths);
  timings.summaryMs += performance.now() - summaryStart;
  return summary;
}

export function buildIndexContent(
  title: string | undefined,
  targetPath: string,
  files: IndexFile[],
  outputPath: string,
  includeGeneratorMetadata = true,
  generation?: GenerationMetadata,
): string {
  const index: RootIndex = {
    ...(title ? { title } : {}),
    ...(includeGeneratorMetadata ? { generator: GENERATOR_NAME } : {}),
    ...(generation ? { generation } : {}),
    basePath: toPosixPath(relative(dirname(outputPath), targetPath)) || ".",
    files,
  };

  return formatIndexJson(index);
}

function collectIndexableFilesWithSet(
  dirPath: string,
  recursive: boolean,
  includeExtensions: ReadonlySet<string>,
  entries = listVisibleEntries(dirPath),
): string[] {
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...collectIndexableFilesWithSet(fullPath, recursive, includeExtensions));
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = getFileExtension(entry.name);
    if (extension && includeExtensions.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectIndexFiles(
  targetPath: string,
  options: CliOptions,
  outputPaths: OutputPaths,
  timings: CreateIndexTimings,
  logger: VerboseLogger,
): IndexFile[] {
  logger.log("scanning-dir=.");

  const collectStart = performance.now();
  const indexableFiles = collectIndexableFiles(targetPath, options.recursive, options.includeExtensions)
    .filter((filePath) => !isGeneratedOutputPath(filePath, outputPaths));
  timings.collectMs += performance.now() - collectStart;

  const files = indexableFiles.map((filePath) => {
    const file = buildIndexFile(filePath, targetPath, options.inputEncoding, options.jsonSummaryPaths, timings);
    logger.log(`found-file=${file.path}`);
    return file;
  });

  files.sort((a, b) => compareUtf16CodeUnitStrings(a.path, b.path));
  return files;
}

function writeIndexOutputs(
  targetPath: string,
  files: IndexFile[],
  options: CliOptions,
  outputPaths: OutputPaths,
  timings: CreateIndexTimings,
): void {
  mkdirSync(dirname(outputPaths.jsonPath), { recursive: true });

  const jsonStringifyStart = performance.now();
  const jsonContent = buildIndexContent(
    options.title,
    targetPath,
    files,
    outputPaths.jsonPath,
    options.includeGeneratorMetadata !== false,
    buildGenerationMetadata(options, targetPath, outputPaths.jsonPath),
  );
  timings.jsonStringifyMs = performance.now() - jsonStringifyStart;

  const jsonWriteStart = performance.now();
  const jsonStatus = writeTextFileWithStatus(outputPaths.jsonPath, jsonContent, options.outputEncoding);
  timings.jsonWriteMs = performance.now() - jsonWriteStart;
  console.log(`${formatOutputStatus(jsonStatus)}: ${outputPaths.jsonPath}`);

  if (!outputPaths.markdownPath) {
    return;
  }

  const markdownStart = performance.now();
  const markdownContent = buildMarkdownIndexContent(files);
  const markdownStatus = writeTextFileWithStatus(outputPaths.markdownPath, markdownContent, options.outputEncoding);
  timings.markdownMs = performance.now() - markdownStart;
  console.log(`${formatOutputStatus(markdownStatus)}: ${outputPaths.markdownPath}`);
}

export function createIndexes(options: CliOptions): number {
  if (options.refreshIndex) {
    return refreshIndex(options);
  }

  const totalStart = performance.now();
  const targetPath = resolve(options.inputDirectory);
  const outputDirectoryPath = resolve(options.outputDirectory ?? options.inputDirectory);
  const targetStat = statSync(targetPath, { throwIfNoEntry: false });

  if (!targetStat?.isDirectory()) {
    throw new Error(`Input directory does not exist: ${targetPath}`);
  }

  const timings = createEmptyTimings();
  const outputPaths = getOutputPaths(outputDirectoryPath, options);
  const logger = createVerboseLogger(options.verbose);
  logVerboseStart(options, targetPath, outputPaths, logger);

  const subdirsStart = performance.now();
  const subdirs = countImmediateSubdirectories(targetPath);
  timings.subdirsMs = performance.now() - subdirsStart;

  const existingOutputPath = findExistingOutputPath(outputPaths, options.overwrite);
  if (existingOutputPath) {
    console.log(`skip: ${existingOutputPath}`);
    return subdirs;
  }

  logger.log(`subdirectories=${subdirs}`);
  const files = collectIndexFiles(targetPath, options, outputPaths, timings, logger);
  writeIndexOutputs(targetPath, files, options, outputPaths, timings);
  logVerboseTimings(files, options, timings, performance.now() - totalStart, logger);

  return subdirs;
}

export function refreshIndex(options: CliOptions): number {
  if (!options.refreshIndex) {
    throw new Error("Please specify an index.json path for --refresh-index.");
  }

  const indexPath = resolve(options.refreshIndex);
  return createIndexes(buildRefreshOptions(options, indexPath));
}
