import { Dirent, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type CliOptions = {
  targetDir: string;
  outputFileName: string;
  markdownOutput: boolean;
  recursive: boolean;
  overwrite: boolean;
};

export type IndexFile = {
  name: string;
  path: string;
  directory: string;
  size: number;
};

export type RootIndex = {
  basePath: string;
  files: IndexFile[];
};

export function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let outputFileName = "index.json";
  let markdownOutput = false;
  let recursive = true;
  let overwrite = true;

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
    markdownOutput,
    recursive,
    overwrite,
  };
}

export function printHelp(): void {
  console.log(`Usage:
  npm run build
  node dist/main.js <targetDir> [--output index.json] [--markdown] [--no-recursive] [--no-overwrite]

Description:
  Generate a root JSON index that aggregates Markdown files found under
  the direct subdirectories of the target directory. Markdown output is optional.
`);
}

export function collectMarkdownFiles(dirPath: string, recursive: boolean): string[] {
  const entries = readdirSync(dirPath, { withFileTypes: true })
    .filter((entry: Dirent) => !entry.name.startsWith("."))
    .sort((a: Dirent, b: Dirent) => a.name.localeCompare(b.name, "ja"));

  const markdownFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        markdownFiles.push(...collectMarkdownFiles(fullPath, recursive));
      }
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      markdownFiles.push(fullPath);
    }
  }

  return markdownFiles;
}

export function buildIndexContent(
  targetPath: string,
  files: IndexFile[],
  outputPath: string,
): string {
  const index: RootIndex = {
    basePath: relative(dirname(outputPath), targetPath).split("\\").join("/") || ".",
    files,
  };

  return `${JSON.stringify(index, null, 2)}\n`;
}

export function buildMarkdownIndexContent(targetPath: string, files: IndexFile[]): string {
  const lines: string[] = ["# Index", ""];

  if (files.length === 0) {
    lines.push("No Markdown files found.", "");
    return lines.join("\n");
  }

  lines.push("| File | Directory | Size |");
  lines.push("| --- | --- | ---: |");

  for (const file of files) {
    const link = relative(targetPath, join(targetPath, file.path)).split("\\").join("/");
    lines.push(`| [${file.path}](${link}) | ${file.directory} | ${file.size} |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createIndexes(options: CliOptions): number {
  const targetPath = resolve(options.targetDir);
  const targetStat = statSync(targetPath, { throwIfNoEntry: false });

  if (!targetStat?.isDirectory()) {
    throw new Error(`Target directory does not exist: ${targetPath}`);
  }

  const subdirs = readdirSync(targetPath, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry: Dirent) => join(targetPath, entry.name))
    .sort((a, b) => a.localeCompare(b, "ja"));

  const outputPath = join(targetPath, options.outputFileName);
  if (!options.overwrite) {
    const existing = statSync(outputPath, { throwIfNoEntry: false });
    if (existing?.isFile()) {
      console.log(`skip: ${outputPath}`);
      return subdirs.length;
    }
  }

  const files: IndexFile[] = subdirs
    .flatMap((subdirPath) =>
      collectMarkdownFiles(subdirPath, options.recursive)
        .filter((filePath) => resolve(filePath) !== resolve(outputPath))
        .map((filePath) => ({
          name: relative(dirname(filePath), filePath).split("\\").join("/"),
          path: relative(targetPath, filePath).split("\\").join("/"),
          directory: relative(targetPath, dirname(filePath)).split("\\").join("/"),
          size: statSync(filePath).size,
        })),
    )
    .sort((a, b) => a.path.localeCompare(b.path, "ja"));

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buildIndexContent(targetPath, files, outputPath), "utf8");
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

    writeFileSync(markdownOutputPath, buildMarkdownIndexContent(targetPath, files), "utf8");
    console.log(`generated: ${markdownOutputPath}`);
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
