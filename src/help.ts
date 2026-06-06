export function printHelp(): void {
  console.log(`Usage:
  miku-indexgen --input-directory <dir> [--output-directory <dir>] [--title "Docs Index"] [--markdown] [--no-generator] [--json-summary-path /title,/name] [--no-recursive] [--no-overwrite] [--include-ext md,json] [--input-encoding utf8] [--output-encoding utf8] [--verbose]
  miku-indexgen --refresh-index <index.json> [--no-overwrite] [--verbose]

Description:
  Scan a directory and generate index.json. With --markdown, also generate
  index.md. Generated files are artifacts; do not edit them by hand. Rerun
  miku-indexgen or use --refresh-index to update them.

Default behavior:
  - recursively scans the input directory
  - indexes md,json files by default
  - skips files and directories starting with "."
  - writes outputs under the input directory unless --output-directory is set
  - excludes the current run's index.json/index.md from files[]
  - stores generation metadata in index.json for later refresh

Generated output:
  index.json contains title, generator, generation, basePath, and files[].
  files[] entries include name, path, ext, dir, size, optional Markdown
  metadata, and optional summary.
  When outputs are written, the CLI reports aligned add   :, update:, or none  :
  labels for each file.

Markdown:
  - summary is extracted from the first heading or leading body text
  - front matter is parsed as YAML
  - only documented metadata fields are copied into index.json
  - unknown fields and unsupported shapes are ignored

JSON:
  - summary is omitted by default
  - use --json-summary-path /title,/name to extract the first matching string

Options:
  --input-directory <dir>       Directory to scan.
  --refresh-index <index.json>  Regenerate an existing index from generation metadata.
  --output-directory <dir>      Directory for index.json and optional index.md.
  --title <text>                Root title in index.json.
  --markdown                    Also generate index.md.
  --no-generator                Omit root generator metadata.
  --json-summary-path <paths>   Comma-separated JSON Pointer paths.
  --no-recursive                Scan only immediate files.
  --no-overwrite                Skip if output already exists.
  --include-ext <exts>          Comma-separated extensions. Default: md,json.
  --input-encoding <encoding>   utf8 or shift_jis. Default: utf8.
  --output-encoding <encoding>  utf8 or shift_jis. Default: utf8.
  --verbose                     Print progress and timing details.
  --version                     Print version.
  --help                        Print this help.

Examples:
  miku-indexgen --input-directory docs
  miku-indexgen --input-directory docs --markdown
  miku-indexgen --input-directory docs --output-directory workplace --markdown
  miku-indexgen --input-directory docs --json-summary-path /title,/name
  miku-indexgen --refresh-index workplace/index.json

References:
  docs/input-files-spec.md
  docs/index-json-spec.md
  docs/miku-indexgen-frontmatter-spec.md
`);
}
