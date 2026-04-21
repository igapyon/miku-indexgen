export type CliOptions = {
  targetDir: string;
  outputFileName: string;
  title?: string;
  markdownOutput: boolean;
  includeGeneratorMetadata?: boolean;
  jsonSummaryPaths?: string[];
  recursive: boolean;
  overwrite: boolean;
  verbose: boolean;
  includeExtensions: string[];
  inputEncoding: string;
  outputEncoding: string;
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
  generator?: string;
  basePath: string;
  files: IndexFile[];
};
