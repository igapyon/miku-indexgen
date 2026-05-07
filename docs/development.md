# Development Notes

This file collects developer-oriented information that does not need to stay in the main README.

## Build

```bash
npm install
npm run build
```

`npm run build` performs a full rebuild:

- remove `dist/`
- compile TypeScript
- make `dist/main.js` executable
- run `npm test`
- generate `workplace/index.json` and `workplace/index.md` from this repository

## CLI Bundle

```bash
npm run bundle
npm run smoke:bundle
```

`npm run bundle` creates generated release artifacts under `bundle/`:

- `bundle/miku-indexgen.mjs`
- `bundle/miku-indexgen-sources.tgz`

`npm run smoke:bundle` verifies the single-file runtime with `--version` and `--help`.

## Test

```bash
npm test
```

## Local Run

```bash
node dist/main.js --input-directory <dir>
```

Example:

```bash
node dist/main.js --input-directory . --output-directory workplace --markdown
```

## Notes

- The CLI contract fixes output file names to `index.json` and `index.md`
- `outputDirectory` is optional
- When `outputDirectory` is omitted, outputs are written under `inputDirectory`
- See `docs/architecture.md` for source layout and internal structure
