import type { IndexFile } from "./types.js";

export type MarkdownFrontMatter = {
  title?: string;
  topics?: string[];
};

export type MarkdownFrontMatterResult = {
  body: string;
  metadata: MarkdownFrontMatter;
};

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

function unquoteFrontMatterValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === `"` && last === `"`) || (first === `'` && last === `'`)) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

function parseInlineTopics(value: string): string[] | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return undefined;
  }

  const topics = trimmed
    .slice(1, -1)
    .split(",")
    .map((topic) => sanitizeTextForIndex(unquoteFrontMatterValue(topic)))
    .filter((topic) => topic.length > 0);

  return topics.length > 0 ? topics : undefined;
}

function parseFrontMatterMetadata(frontMatter: string): MarkdownFrontMatter {
  const lines = frontMatter.split(/\r?\n/);
  const metadata: MarkdownFrontMatter = {};

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const titleMatch = /^title:\s*(.*)$/.exec(line);
    if (titleMatch) {
      const title = sanitizeTextForIndex(unquoteFrontMatterValue(titleMatch[1] ?? ""));
      if (title.length > 0) {
        metadata.title = title;
      }
      continue;
    }

    const topicsMatch = /^topics:\s*(.*)$/.exec(line);
    if (!topicsMatch) {
      continue;
    }

    const inlineTopics = parseInlineTopics(topicsMatch[1] ?? "");
    if (inlineTopics) {
      metadata.topics = inlineTopics;
      continue;
    }

    const topics: string[] = [];
    for (let topicIndex = index + 1; topicIndex < lines.length; topicIndex += 1) {
      const topicLine = lines[topicIndex];
      if (topicLine.trim().length === 0) {
        continue;
      }

      const topicMatch = /^\s*-\s+(.+)$/.exec(topicLine);
      if (!topicMatch) {
        break;
      }

      const topic = sanitizeTextForIndex(unquoteFrontMatterValue(topicMatch[1] ?? ""));
      if (topic.length > 0) {
        topics.push(topic);
      }
      index = topicIndex;
    }

    if (topics.length > 0) {
      metadata.topics = topics;
    }
  }

  return metadata;
}

export function extractFrontMatter(markdown: string): MarkdownFrontMatterResult {
  const normalizedMarkdown = markdown.startsWith("\uFEFF") ? markdown.slice(1) : markdown;
  const firstLineEnd = normalizedMarkdown.search(/\r?\n/);
  const firstLine = firstLineEnd === -1 ? normalizedMarkdown : normalizedMarkdown.slice(0, firstLineEnd);

  if (firstLine.trim() !== "---") {
    return { body: markdown, metadata: {} };
  }

  const contentStart =
    firstLineEnd === -1 ? normalizedMarkdown.length : firstLineEnd + (normalizedMarkdown[firstLineEnd] === "\r" ? 2 : 1);
  const rest = normalizedMarkdown.slice(contentStart);
  const closingMatch = /^---\s*$/m.exec(rest);

  if (!closingMatch || closingMatch.index === undefined) {
    return { body: markdown, metadata: {} };
  }

  const frontMatter = rest.slice(0, closingMatch.index);
  const bodyStart = closingMatch.index + closingMatch[0].length;
  const body = rest.slice(bodyStart).replace(/^\r?\n/, "");

  return {
    body,
    metadata: parseFrontMatterMetadata(frontMatter),
  };
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
