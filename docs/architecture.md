# Architecture Memo

This file describes the software-specific structure and behavior.

## Current Shape

- Entry point: `src/main.ts`
- Build output: `dist/main.js`
- Module format: Node ESM
- Primary output: root `index.json`
- `index.json` uses a flat `files` array as the canonical structure
- Each file entry includes at least `name`, `path`, `directory`, and `size`
- `index.md` can also be generated as an optional companion output

## Build Flow

- `npm run build` is a full build
- Remove `dist/`, then run `tsc`
- Run `npm test`
- Generate `workspace/index.json` and `workspace/index.md` from this repository

## Main Files

- `src/main.ts`
- `test/main.test.ts`
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `README.md`

## Reproduction Steps

```bash
npm install
npm run build
node dist/main.js <targetDir>
```
