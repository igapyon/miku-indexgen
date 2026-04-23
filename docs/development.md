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
- generate `workspace/index.json` and `workspace/index.md` from this repository

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
node dist/main.js --input-directory . --output-directory workspace --markdown
```

## Notes

- The CLI contract fixes output file names to `index.json` and `index.md`
- `outputDirectory` is optional
- When `outputDirectory` is omitted, outputs are written under `inputDirectory`
- See `docs/architecture.md` for source layout and internal structure
