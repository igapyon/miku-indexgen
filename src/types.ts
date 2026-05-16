export type CliOptions = {
  inputDirectory: string;
  outputDirectory?: string;
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
  title?: string;
  topics?: string[];
  summary?: string;
};

export type RootIndex = {
  title?: string;
  generator?: string;
  basePath: string;
  files: IndexFile[];
};
