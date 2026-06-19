export type CliOptions = {
  inputDirectory: string;
  inputParentDirectory?: string;
  outputDirectory?: string;
  refreshIndex?: string;
  title?: string;
  markdownOutput: boolean;
  includeGeneratorMetadata?: boolean;
  jsonSummaryPaths?: string[];
  recursive: boolean;
  overwrite: boolean;
  verbose: boolean;
  includeExtensions: string[];
  excludeGlobs?: string[];
  inputEncoding: string;
  outputEncoding: string;
};

export type IndexSource = {
  type: string;
  role?: string;
  label?: string;
  url?: string;
  path?: string;
  version?: string;
  checked?: string;
};

export type IndexFile = {
  name: string;
  path: string;
  ext: string;
  dir: string;
  size: number;
  title?: string;
  description?: string;
  topics?: string[];
  category?: string;
  status?: string;
  audience?: string[];
  created?: string;
  updated?: string;
  sources?: IndexSource[];
  summary?: string;
};

export type GenerationMetadata = {
  schemaVersion: 1;
  inputPath: string;
  markdownOutput: boolean;
  recursive: boolean;
  includeExtensions: string[];
  excludeGlobs?: string[];
  inputEncoding: string;
  outputEncoding: string;
  jsonSummaryPaths?: string[];
  title?: string;
  includeGeneratorMetadata: boolean;
};

export type RootIndex = {
  title?: string;
  generator?: string;
  generation?: GenerationMetadata;
  basePath: string;
  files: IndexFile[];
};
