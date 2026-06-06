import { parse } from "yaml";
import { sanitizeTextForIndex, truncateTextForIndex } from "./text-sanitize.js";
import type { IndexSource } from "./types.js";

export type MarkdownFrontMatter = {
  title?: string;
  description?: string;
  topics?: string[];
  category?: string;
  status?: string;
  audience?: string[];
  created?: string;
  updated?: string;
  sources?: IndexSource[];
};

export type MarkdownFrontMatterResult = {
  body: string;
  metadata: MarkdownFrontMatter;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DESCRIPTION_MAX_LENGTH = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeMetadataString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const sanitized = sanitizeTextForIndex(value);
    return sanitized.length > 0 ? sanitized : undefined;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return undefined;
}

function sanitizeDescription(value: unknown): string | undefined {
  const sanitized = sanitizeMetadataString(value);
  return sanitized ? truncateTextForIndex(sanitized, DESCRIPTION_MAX_LENGTH) : undefined;
}

function sanitizeDateOnly(value: unknown): string | undefined {
  const sanitized = sanitizeMetadataString(value);
  return sanitized && DATE_ONLY_PATTERN.test(sanitized) ? sanitized : undefined;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => sanitizeMetadataString(item))
    .filter((item): item is string => item !== undefined);

  return items.length > 0 && items.length === value.length ? items : undefined;
}

function sanitizeSource(value: unknown): IndexSource | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const type = sanitizeMetadataString(value.type);
  if (!type) {
    return undefined;
  }

  const role = sanitizeMetadataString(value.role);
  const label = sanitizeMetadataString(value.label);
  const url = sanitizeMetadataString(value.url);
  const path = sanitizeMetadataString(value.path);
  const version = sanitizeMetadataString(value.version);
  const checked = sanitizeDateOnly(value.checked);

  return {
    type,
    ...(role ? { role } : {}),
    ...(label ? { label } : {}),
    ...(url ? { url } : {}),
    ...(path ? { path } : {}),
    ...(version ? { version } : {}),
    ...(checked ? { checked } : {}),
  };
}

function sanitizeSources(value: unknown): IndexSource[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sources = value
    .map((item) => sanitizeSource(item))
    .filter((source): source is IndexSource => source !== undefined);

  return sources.length > 0 && sources.length === value.length ? sources : undefined;
}

function parseFrontMatterMetadata(frontMatter: string): MarkdownFrontMatter {
  let parsed: unknown;
  try {
    parsed = parse(frontMatter);
  } catch {
    return {};
  }

  if (!isRecord(parsed)) {
    return {};
  }

  const title = sanitizeMetadataString(parsed.title);
  const description = sanitizeDescription(parsed.description);
  const topics = sanitizeStringArray(parsed.topics);
  const category = sanitizeMetadataString(parsed.category);
  const status = sanitizeMetadataString(parsed.status);
  const audience = sanitizeStringArray(parsed.audience);
  const created = sanitizeDateOnly(parsed.created);
  const updated = sanitizeDateOnly(parsed.updated);
  const sources = sanitizeSources(parsed.sources);

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(topics ? { topics } : {}),
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
    ...(audience ? { audience } : {}),
    ...(created ? { created } : {}),
    ...(updated ? { updated } : {}),
    ...(sources ? { sources } : {}),
  };
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
