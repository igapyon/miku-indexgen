# Architecture Memo

This file describes the software-specific structure and behavior.

## Current Shape

- Entry point: `src/main.ts`
- Build output: `dist/main.js`
- Module format: Node ESM
- Primary output: root `index.json`
- CLI input directory is specified with `--input-directory`
- CLI output directory can be specified with `--output-directory`
- Existing generated indexes can be regenerated with `--refresh-index`
- `index.json` uses a flat `files` array as the canonical structure
- Root metadata includes optional `title`, optional `generator`, `generation`, and `basePath`
- `generator` is included by default and can be omitted with `--no-generator`
- `generation` stores refresh metadata and remains separate from root `generator`
- Each file entry includes at least `name`, `path`, `ext`, `dir`, `size`, optional Markdown metadata, and optional `summary`
- Markdown `summary` is extracted from headings or leading body text after removing optional front matter
- Markdown front matter metadata is optional, parsed as YAML, and copied only for documented metadata fields
- JSON `summary` is disabled by default and can be extracted from configured JSON Pointer paths
- `index.md` can also be generated as an optional companion output

## Build Flow

- `npm run build` is a full build
- Remove `dist/`, then run `tsc`
- Run `npm test`
- Generate `workplace/index.json` and `workplace/index.md` from this repository

## Main Files

- `src/main.ts`: CLI entry point and public re-exports
- `src/cli.ts`: command-line argument parsing
- `src/help.ts`: CLI help text
- `src/frontmatter.ts`: Markdown front matter parsing and metadata sanitizing
- `src/indexer.ts`: directory scanning and index generation
- `src/index-json.ts`: search-friendly `index.json` formatting
- `src/generation.ts`: `generation` metadata creation, validation, and refresh option reconstruction
- `src/json-summary.ts`: JSON Pointer based summary extraction for JSON files
- `src/logging.ts`: verbose logging and timing helpers
- `src/markdown.ts`: Markdown summary and `index.md` formatting
- `src/text-sanitize.ts`: shared text sanitizing for generated index fields
- `src/encoding.ts`: text encoding helpers
- `src/path-utils.ts`: path and extension normalization helpers
- `src/types.ts`: shared TypeScript types
- `test/*.test.ts`
- `test/test-utils.ts`
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `README.md`

## Reproduction Steps

```bash
npm install
npm run build
npx miku-indexgen --input-directory <dir>
```

Generated indexes that contain root `generation` metadata can also be refreshed:

```bash
npx miku-indexgen --refresh-index <index.json>
```
