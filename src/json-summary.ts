import { sanitizeTextForIndex } from "./markdown.js";

const DEFAULT_MAX_SUMMARY_LENGTH = 256;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function parseJsonSummaryPaths(value: string): string[] {
  const paths = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (paths.length === 0) {
    throw new Error("Please specify at least one JSON Pointer for --json-summary-path.");
  }

  for (const path of paths) {
    if (!path.startsWith("/")) {
      throw new Error(`JSON summary path must be a JSON Pointer starting with "/": ${path}`);
    }
  }

  return [...new Set(paths)];
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

export function getJsonPointerValue(value: JsonValue, pointer: string): JsonValue | undefined {
  let current: JsonValue | undefined = value;
  const segments = pointer
    .slice(1)
    .split("/")
    .map(decodeJsonPointerSegment);

  for (const segment of segments) {
    if (current === undefined || current === null || typeof current !== "object") {
      return undefined;
    }

    if (Array.isArray(current)) {
      if (!/^(0|[1-9]\d*)$/.test(segment)) {
        return undefined;
      }
      current = current[Number(segment)];
      continue;
    }

    current = current[segment];
  }

  return current;
}

export function extractJsonSummary(jsonText: string, paths: string[], maxLength = DEFAULT_MAX_SUMMARY_LENGTH): string | undefined {
  let parsed: JsonValue;

  try {
    parsed = JSON.parse(jsonText) as JsonValue;
  } catch {
    return undefined;
  }

  for (const path of paths) {
    const value = getJsonPointerValue(parsed, path);
    if (typeof value !== "string") {
      continue;
    }

    const summary = sanitizeTextForIndex(value.slice(0, maxLength));
    if (summary.length > 0) {
      return summary;
    }
  }

  return undefined;
}
