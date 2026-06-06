import type { CliOptions, IndexFile } from "./types.js";

export type VerboseLogger = {
  enabled: boolean;
  log: (message: string) => void;
};

export type CreateIndexTimings = {
  subdirsMs: number;
  collectMs: number;
  statMs: number;
  readFileMs: number;
  summaryMs: number;
  jsonStringifyMs: number;
  jsonWriteMs: number;
  markdownMs: number;
};

type OutputPaths = {
  jsonPath: string;
  markdownPath?: string;
};

export function createEmptyTimings(): CreateIndexTimings {
  return {
    subdirsMs: 0,
    collectMs: 0,
    statMs: 0,
    readFileMs: 0,
    summaryMs: 0,
    jsonStringifyMs: 0,
    jsonWriteMs: 0,
    markdownMs: 0,
  };
}

export function createVerboseLogger(enabled: boolean): VerboseLogger {
  return {
    enabled,
    log(message: string) {
      if (enabled) {
        console.log(`verbose: ${message}`);
      }
    },
  };
}

export function logVerboseStart(
  options: CliOptions,
  targetPath: string,
  outputPaths: OutputPaths,
  logger: VerboseLogger,
): void {
  logger.log(`target=${targetPath}`);
  logger.log(`output=${outputPaths.jsonPath}`);
  if (options.title) {
    logger.log(`title=${options.title}`);
  }
  logger.log(`include-ext=${options.includeExtensions.join(",")}`);
  logger.log(`generator=${options.includeGeneratorMetadata !== false ? "enabled" : "disabled"}`);
  if (options.jsonSummaryPaths && options.jsonSummaryPaths.length > 0) {
    logger.log(`json-summary-path=${options.jsonSummaryPaths.join(",")}`);
  }
  logger.log(`input-encoding=${options.inputEncoding}`);
  logger.log(`output-encoding=${options.outputEncoding}`);
}

export function logVerboseTimings(
  files: IndexFile[],
  options: CliOptions,
  timings: CreateIndexTimings,
  totalDurationMs: number,
  logger: VerboseLogger,
): void {
  if (!logger.enabled) {
    return;
  }

  logger.log(`files=${files.length}`);
  logger.log(`timing.subdirs=${formatDuration(timings.subdirsMs)}`);
  logger.log(`timing.collect=${formatDuration(timings.collectMs)}`);
  logger.log(`timing.stat=${formatDuration(timings.statMs)}`);
  logger.log(`timing.readFile=${formatDuration(timings.readFileMs)}`);
  logger.log(`timing.summary=${formatDuration(timings.summaryMs)}`);
  logger.log(`timing.json.stringify=${formatDuration(timings.jsonStringifyMs)}`);
  logger.log(`timing.json.write=${formatDuration(timings.jsonWriteMs)}`);
  if (options.markdownOutput) {
    logger.log(`timing.markdown=${formatDuration(timings.markdownMs)}`);
  }
  logger.log(`timing.total=${formatDuration(totalDurationMs)}`);
}

function formatDuration(durationMs: number): string {
  return `${durationMs.toFixed(2)}ms`;
}
