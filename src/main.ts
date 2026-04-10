import { Dirent, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type CliOptions = {
  targetDir: string;
  outputFileName: string;
  recursive: boolean;
  overwrite: boolean;
};

export function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let outputFileName = "index.md";
  let recursive = true;
  let overwrite = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--output" || arg === "-o") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--output にはファイル名を指定してください。");
      }
      outputFileName = value;
      i += 1;
      continue;
    }

    if (arg === "--no-recursive") {
      recursive = false;
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
    throw new Error("対象フォルダを指定してください。");
  }

  return {
    targetDir,
    outputFileName,
    recursive,
    overwrite,
  };
}

export function printHelp(): void {
  console.log(`Usage:
  npm run build
  node dist/main.js <targetDir> [--output index.md] [--no-recursive] [--no-overwrite]

Description:
  指定フォルダ直下の各サブフォルダについて、含まれる Markdown ファイルへのリンクをまとめた
  インデックス Markdown を生成します。
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
  subdirPath: string,
  markdownFiles: string[],
  outputPath: string,
): string {
  const subdirName = relative(dirname(subdirPath), subdirPath) || subdirPath;
  const lines: string[] = [`# ${subdirName}`, ""];

  if (markdownFiles.length === 0) {
    lines.push("このフォルダには Markdown ファイルがありません。", "");
    return lines.join("\n");
  }

  lines.push("| File |");
  lines.push("| --- |");

  for (const filePath of markdownFiles) {
    const label = relative(subdirPath, filePath);
    const link = relative(dirname(outputPath), filePath).split("\\").join("/");
    lines.push(`| [${label}](${link}) |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createIndexes(options: CliOptions): number {
  const targetPath = resolve(options.targetDir);
  const targetStat = statSync(targetPath, { throwIfNoEntry: false });

  if (!targetStat?.isDirectory()) {
    throw new Error(`対象フォルダが存在しません: ${targetPath}`);
  }

  const subdirs = readdirSync(targetPath, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry: Dirent) => join(targetPath, entry.name))
    .sort((a, b) => a.localeCompare(b, "ja"));

  for (const subdirPath of subdirs) {
    const outputPath = join(subdirPath, options.outputFileName);
    const markdownFiles = collectMarkdownFiles(subdirPath, options.recursive).filter(
      (filePath) => resolve(filePath) !== resolve(outputPath),
    );

    if (!options.overwrite) {
      const existing = statSync(outputPath, { throwIfNoEntry: false });
      if (existing?.isFile()) {
        console.log(`skip: ${outputPath}`);
        continue;
      }
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, buildIndexContent(subdirPath, markdownFiles, outputPath), "utf8");
    console.log(`generated: ${outputPath}`);
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
