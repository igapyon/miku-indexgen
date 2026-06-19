export function normalizeExcludeGlobPattern(pattern: string): string {
  return pattern.split("\\").join("/").replace(/^\/+/, "").replace(/\/+$/, "");
}

export function normalizeExcludeGlobPatterns(patterns: string[]): string[] {
  const normalized = patterns
    .map((pattern) => normalizeExcludeGlobPattern(pattern.trim()))
    .filter((pattern) => pattern.length > 0);

  return [...new Set(normalized)];
}

export function matchesAnyExcludeGlob(relativePath: string, patterns: readonly string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }

  const normalizedPath = relativePath.split("\\").join("/").replace(/^\/+/, "");
  return patterns.some((pattern) => matchesExcludeGlob(normalizedPath, pattern));
}

export function matchesExcludeGlob(relativePath: string, pattern: string): boolean {
  const pathSegments = relativePath.split("/").filter((segment) => segment.length > 0);
  const patternSegments = normalizeExcludeGlobPattern(pattern).split("/").filter((segment) => segment.length > 0);
  return matchSegments(pathSegments, patternSegments, 0, 0);
}

function matchSegments(
  pathSegments: readonly string[],
  patternSegments: readonly string[],
  pathIndex: number,
  patternIndex: number,
): boolean {
  if (patternIndex === patternSegments.length) {
    return pathIndex === pathSegments.length;
  }

  const patternSegment = patternSegments[patternIndex];
  if (patternSegment === "**") {
    if (matchSegments(pathSegments, patternSegments, pathIndex, patternIndex + 1)) {
      return true;
    }

    return pathIndex < pathSegments.length && matchSegments(pathSegments, patternSegments, pathIndex + 1, patternIndex);
  }

  return (
    pathIndex < pathSegments.length &&
    matchesPathSegment(pathSegments[pathIndex], patternSegment) &&
    matchSegments(pathSegments, patternSegments, pathIndex + 1, patternIndex + 1)
  );
}

function matchesPathSegment(pathSegment: string, patternSegment: string): boolean {
  return matchSegmentChars(pathSegment, patternSegment, 0, 0);
}

function matchSegmentChars(value: string, pattern: string, valueIndex: number, patternIndex: number): boolean {
  if (patternIndex === pattern.length) {
    return valueIndex === value.length;
  }

  const patternChar = pattern[patternIndex];
  if (patternChar === "*") {
    if (matchSegmentChars(value, pattern, valueIndex, patternIndex + 1)) {
      return true;
    }

    return valueIndex < value.length && matchSegmentChars(value, pattern, valueIndex + 1, patternIndex);
  }

  if (patternChar === "?") {
    return valueIndex < value.length && matchSegmentChars(value, pattern, valueIndex + 1, patternIndex + 1);
  }

  return (
    valueIndex < value.length &&
    value[valueIndex] === patternChar &&
    matchSegmentChars(value, pattern, valueIndex + 1, patternIndex + 1)
  );
}
