# miku-md-indexgen

`miku-md-indexgen` generates an index of Markdown files under a specified directory, including files in subdirectories.

`miku-md-indexgen` is one of the tools in Mikuku's software series.

The generated index helps AI agents understand which files exist in the target directory and what each file roughly contains.

By using this index, AI agents can grasp the overall file set in advance and reduce the need to read every file in full. This can help reduce token consumption and the use of limited request budgets across AI products.

## Features

- Generates a root `index.json` for Markdown files under a target directory
- Uses a flat `files` array that is easy for AI agents and programs to consume
- Optionally generates `index.md` as a companion human-readable index
- Extracts a short `summary` from each Markdown file
- Includes `name`, `path`, `directory`, `size`, and optional `summary` for each file

## Build

```bash
npm install
npm run build
```

`npm run build` performs a full rebuild by clearing `dist/`, compiling TypeScript, running tests, and generating `workspace/index.json` and `workspace/index.md` from this repository.

## Usage

```bash
node dist/main.js <targetDir>
```

Example:

```bash
node dist/main.js ./docs
```

If `./docs` contains Markdown files in nested directories, the command generates `./docs/index.json`. When `--markdown` is specified, it also generates `./docs/index.md`.

This usage is also intended for indexing reference documents used by AI agents and Agent Skills. For example, running the tool against `./references` generates `./references/index.json`, allowing an AI agent to understand the available reference files before reading them one by one.

## Options

- `--output`, `-o`: Output file name. Default: `index.json`
- `--markdown`: Also generate `index.md` in the output directory. Default: disabled
- `--no-recursive`: Do not recurse into nested subdirectories
- `--no-overwrite`: Do not overwrite existing output files

## Output

The generated JSON uses a flat `files` array as the canonical structure.

Each file entry includes:

- `name`
- `path`
- `directory`
- `size`
- `summary` (optional)

`summary` is derived from the first `#`-prefixed heading, or from the leading body text up to 256 characters when no heading appears first.

---

`miku-md-indexgen` は、指定ディレクトリ以下にある Markdown ファイルのインデックスを生成するツールです。サブディレクトリ内のファイルも対象に含みます。

`miku-md-indexgen` は、Mikuku's ソフトウェアシリーズのひとつとして提供されるツールです。

生成されたインデックスにより、生成AI は対象フォルダ内にどのようなファイルが存在するか、また各ファイルのおおまかな内容を把握しやすくなります。

このインデックスを介して対象ファイル群の概要を事前に把握できるため、生成AI が全文を順番に読み込む必要を減らせます。これにより、各種 AI 製品におけるトークン消費や、回数制限のあるリクエスト利用の抑制が期待されます。

## 特徴

- 指定ディレクトリ以下の Markdown ファイルを対象に、ルートの `index.json` を生成する
- 生成AI やプログラムが扱いやすい、フラットな `files` 配列を正本にする
- 必要に応じて、人間向けの補助出力として `index.md` も生成できる
- 各 Markdown ファイルから短い `summary` を抽出する
- 各ファイルについて `name`, `path`, `directory`, `size`, `summary` を保持できる

## ビルド

```bash
npm install
npm run build
```

`npm run build` は `dist/` を削除してから TypeScript をビルドし、テストを実行したうえで、このリポジトリを入力にした `workspace/index.json` と `workspace/index.md` を生成します。

## 使い方

```bash
node dist/main.js <targetDir>
```

例:

```bash
node dist/main.js ./docs
```

`./docs` 配下にネストしたサブディレクトリを含む Markdown ファイルがある場合、`./docs/index.json` を生成します。`--markdown` を付けた場合は `./docs/index.md` も生成します。

この使い方は、生成AI や Agent Skills が参照する `references/` 配下の資料群をインデックス化する用途も想定しています。たとえば `./references` を対象に実行すると `./references/index.json` を生成でき、生成AI は各ファイルを個別に読む前に、利用可能な参照資料の全体像を把握しやすくなります。

## オプション

- `--output`, `-o`: 出力ファイル名。デフォルトは `index.json`
- `--markdown`: 出力先ディレクトリに `index.md` も生成する。デフォルトは無効
- `--no-recursive`: ネストしたサブディレクトリを再帰走査しない
- `--no-overwrite`: 既存の出力ファイルを上書きしない

## 出力

生成される JSON は、`files` 配列を正本にしたフラット構造です。

各ファイル要素は次を持ちます。

- `name`
- `path`
- `directory`
- `size`
- `summary`（任意）

`summary` は、最初の `#` 始まり見出し、または見出しより前の本文を最大 256 文字まで使って抽出します。
