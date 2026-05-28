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

## Publishing

GitHub Release assets and npm publishing are handled by one release workflow.

Release asset workflow:

- file: `.github/workflows/release-cli-bundle.yml`
- trigger: `v*` tag push
- accepts exact package version tags and dot-suffix rebuild tags, such as `v1.4.1.2`
- attaches the single-file CLI bundle and source archive to the GitHub Release
- contains a separate npm publish job in the same workflow run
- publishes to npm only when the tag version exactly matches `package.json` version
- skips npm publish for dot-suffix rebuild tags because npm package versions cannot be republished
- uses npm Trusted Publishing / OpenID Connect instead of a long-lived npm token
- runs `npm ci`, `npm run build`, `npm run pack:check`, then `npm publish --access public` before publishing

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

Refresh an existing generated index:

```bash
node dist/main.js --refresh-index workplace/index.json
```

## Help Text

`--help` is maintained as a short runtime contract for humans, scripts, and AI
agents. Keep it focused on safe execution: defaults, input scope, generated
artifacts, metadata boundaries, options, examples, and detailed spec references.

## Notes

- The CLI contract fixes output file names to `index.json` and `index.md`
- `outputDirectory` is optional
- When `outputDirectory` is omitted, outputs are written under `inputDirectory`
- Generated `index.json` contains `generation` metadata for `--refresh-index`
- When outputs are rewritten, the CLI reports aligned `add   :`, `update:`, or `none  :` labels for each file; `none  :` means the content was unchanged and the file was left as-is
- See `docs/architecture.md` for source layout and internal structure
