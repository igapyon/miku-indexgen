export function printHelp(): void {
  console.log(`Usage:
  miku-indexgen --input-directory <dir> [--output-directory <dir>] [--title "Docs Index"] [--markdown] [--no-generator] [--json-summary-path /title,/name] [--no-recursive] [--no-overwrite] [--include-ext md,json] [--exclude-glob "**/images/*"] [--input-encoding utf8] [--output-encoding utf8] [--verbose]
  miku-indexgen --input-parent-directory <dir> [--output-directory <dir>] [--title "Docs Index"] [--markdown] [--no-generator] [--json-summary-path /title,/name] [--no-recursive] [--no-overwrite] [--include-ext md,json] [--exclude-glob "**/images/*"] [--input-encoding utf8] [--output-encoding utf8] [--verbose]
  miku-indexgen --refresh-index <index.json> [--no-overwrite] [--verbose]

Description:
  Scan a directory and generate index.json. With --markdown, also generate
  index.md. Generated files are artifacts; do not edit them by hand. Rerun
  miku-indexgen or use --refresh-index to update them.

Default behavior:
  - recursively scans the input directory
  - indexes md,json files by default
  - applies --exclude-glob after extension filtering
  - skips files and directories starting with "."
  - writes outputs under the input directory unless --output-directory is set
  - excludes the current run's index.json/index.md from files[]
  - stores generation metadata in index.json for later refresh

Child-directory batch mode:
  --input-parent-directory processes each direct visible child directory as an
  independent input base. Direct child files are ignored. With a shared
  --output-directory, outputs are written under child-specific directories.
  Child failures are aggregated; remaining children are still processed and
  the command exits non-zero when any child fails.

Exclude glob:
  --exclude-glob is evaluated against paths relative to the input directory
  after --include-ext. Separators are normalized to "/". Matching is
  case-sensitive. Supported glob syntax is only *, ?, and **. Character
  classes, brace expansion, extglob, regular expressions, and OS-dependent
  separators are not supported.

Generated output:
  index.json contains title, generator, generation, basePath, and files[].
  files[] entries include name, path, ext, dir, size, optional Markdown
  metadata, and optional summary.
  files[] is sorted by normalized relative path using UTF-16 code unit order.
  When outputs are written, the CLI reports aligned add   :, update:, or none  :
  labels for each file.

Markdown:
  - summary is extracted from the first heading or leading body text
  - front matter is parsed as YAML
  - supported fields: title, description, topics, category, status, audience,
    created, updated, sources
  - title, description, and topics are primary scan-time file selection signals
  - category, status, and audience help route which files to read next
  - sources, created, and updated help judge provenance and freshness
  - description is capped at 256 UTF-16 code units and may end with "..."
  - unknown fields and unsupported shapes are ignored

JSON:
  - summary is omitted by default
  - use --json-summary-path /title,/name to extract the first matching string

Options:
  --input-directory <dir>        Directory to scan.
  --input-parent-directory <dir> Process direct child directories independently.
  --refresh-index <index.json>   Regenerate an existing index from generation metadata.
  --output-directory <dir>       Directory for index.json and optional index.md.
  --title <text>                 Root title in index.json.
  --markdown                     Also generate index.md.
  --no-generator                 Omit root generator metadata.
  --json-summary-path <paths>    Comma-separated JSON Pointer paths.
  --no-recursive                 Scan only immediate files.
  --no-overwrite                 Skip if output already exists.
  --include-ext <exts>           Comma-separated extensions. Default: md,json.
  --exclude-glob <pattern>       Exclude input-relative POSIX paths matching * ? **.
                                 Repeatable. Stored in generation metadata.
  --input-encoding <encoding>    utf8 or shift_jis. Default: utf8.
  --output-encoding <encoding>   utf8 or shift_jis. Default: utf8.
  --verbose                      Print progress and timing details.
  --version                      Print version.
  --help                         Print this help.

Examples:
  miku-indexgen --input-directory docs
  miku-indexgen --input-directory docs --markdown
  miku-indexgen --input-directory docs --output-directory workplace --markdown
  miku-indexgen --input-parent-directory docs-parent --output-directory out --markdown
  miku-indexgen --input-directory docs --json-summary-path /title,/name
  miku-indexgen --input-directory docs --include-ext md --exclude-glob "**/images/*" --exclude-glob "**/section-text.md"
  miku-indexgen --refresh-index workplace/index.json

References:
  docs/input-files-spec.md
  docs/index-json-spec.md
  docs/miku-indexgen-frontmatter-spec.md`);
}
