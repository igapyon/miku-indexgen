# miku-md-indexgen

AI-first CLI that scans the direct subdirectories of a target directory and generates a root `index.json` as a flat list of `*.md` files.

`index.json` is intended primarily as machine-readable input for AI agents and programs rather than as a human-oriented table of contents. When needed, `index.md` can also be generated as an optional companion output.

## Build

```bash
npm install
npm run build
```

`npm run build` performs a full rebuild by clearing `dist/`, compiling TypeScript, running tests, and generating `workspace/index.json` and `workspace/index.md` from this repository.

## Usage

```bash
node dist/main.js ./docs
```

### Options

- `--output`, `-o`: Output file name. Default: `index.json`
- `--markdown`: Also generate `index.md` in the output directory. Default: disabled
- `--no-recursive`: Do not recurse into nested subdirectories
- `--no-overwrite`: Do not overwrite existing output files

## Example

If `./docs` contains `chapter1` and `chapter2`, the command generates `./docs/index.json`.

The generated JSON uses a flat `files` array as the canonical structure. Each entry includes `name`, `path`, `directory`, `size`, and optional `summary`.
`summary` is derived from the first `#`-prefixed heading, or from the leading body text up to 256 characters when no heading appears first.

---

指定したフォルダ直下の各サブフォルダを走査し、配下の `*.md` をフラットな一覧の `index.json` としてルートに生成する、生成AIファーストの CLI です。

`index.json` は人間向けの目次ではなく、生成AI やプログラムがそのまま読み取りやすい機械可読な入力を主目的にしています。必要な場合のみ、補助出力として `index.md` も生成できます。

## Build

```bash
npm install
npm run build
```

`npm run build` は `dist/` を消してから TypeScript をビルドし、テストを実行したうえで、このリポジトリを入力にした `workspace/index.json` と `workspace/index.md` を生成します。

## Usage

```bash
node dist/main.js ./docs
```

### Options

- `--output`, `-o`: 出力ファイル名。デフォルトは `index.json`
- `--markdown`: 出力先ディレクトリに `index.md` も生成する。デフォルトは無効
- `--no-recursive`: ネストしたサブフォルダを再帰走査しない
- `--no-overwrite`: 既存の出力ファイルを上書きしない

## Example

`./docs` の直下に `chapter1`, `chapter2` がある場合、`./docs/index.json` を生成します。

生成される JSON は、`files` 配列を正本にしたフラット構造です。各要素は `name`, `path`, `directory`, `size` と、必要に応じて `summary` を持ちます。
`summary` は最初の `#` 始まり見出し、または見出しより前の本文を最大 256 文字まで使って抽出します。
