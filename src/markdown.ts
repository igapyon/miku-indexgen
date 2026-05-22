import { extractFrontMatter } from "./frontmatter.js";
import { sanitizeTextForIndex } from "./text-sanitize.js";
import type { IndexFile } from "./types.js";

export function escapeMarkdownTableCell(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .trim();
}

export function extractSummaryFromBody(markdownBody: string, maxLength = 256): string | undefined {
  const lines = markdownBody.split(/\r?\n/);
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

export function extractSummary(markdown: string, maxLength = 256): string | undefined {
  return extractSummaryFromBody(extractFrontMatter(markdown).body, maxLength);
}

export function buildMarkdownIndexContent(files: IndexFile[]): string {
  const lines: string[] = ["# Index", ""];

  if (files.length === 0) {
    lines.push("No matching files found.", "");
    return lines.join("\n");
  }

  lines.push("| File | Ext | Dir | Size | Summary |");
  lines.push("| --- | --- | --- | ---: | --- |");

  for (const file of files) {
    const fileLabel = escapeMarkdownTableCell(file.path);
    const ext = escapeMarkdownTableCell(file.ext);
    const dir = escapeMarkdownTableCell(file.dir);
    const summary = escapeMarkdownTableCell(file.summary ?? "");
    lines.push(`| [${fileLabel}](${file.path}) | ${ext} | ${dir} | ${file.size} | ${summary} |`);
  }

  lines.push("");
  return lines.join("\n");
}
