# Architecture Memo

This file describes the software-specific structure and behavior.

## Current Shape

- Entry point: `src/main.ts`
- Build output: `dist/main.js`
- Module format: Node ESM
- Primary output: root `index.json`
- CLI input directory is specified with `--input-directory`
- CLI output directory can be specified with `--output-directory`
- `index.json` uses a flat `files` array as the canonical structure
- Root metadata includes optional `generator`, optional `title`, and `basePath`
- `generator` is included by default and can be omitted with `--no-generator`
- Each file entry includes at least `name`, `path`, `ext`, `dir`, `size`, and optional `summary`
- Markdown `summary` is extracted from headings or leading body text
- JSON `summary` is disabled by default and can be extracted from configured JSON Pointer paths
- `index.md` can also be generated as an optional companion output

## Build Flow

- `npm run build` is a full build
- Remove `dist/`, then run `tsc`
- Run `npm test`
- Generate `workspace/index.json` and `workspace/index.md` from this repository

## Main Files

- `src/main.ts`: CLI entry point and public re-exports
- `src/cli.ts`: command-line argument parsing and help text
- `src/indexer.ts`: directory scanning and index generation
- `src/json-summary.ts`: JSON Pointer based summary extraction for JSON files
- `src/logging.ts`: verbose logging and timing helpers
- `src/markdown.ts`: Markdown summary and `index.md` formatting
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
