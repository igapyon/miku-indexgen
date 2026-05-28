# miku-indexgen

`miku-indexgen` is a CLI tool that scans a directory and generates `index.json`.
When Markdown output is enabled, it also generates `index.md`.

It is intended for AI agents and programs that need a compact overview of available files before reading them in full.

## Install

Run with `npx`:

```bash
npx miku-indexgen --input-directory <dir>
```

Or install globally:

```bash
npm install -g miku-indexgen
miku-indexgen --input-directory <dir>
```

## Quick Start

Generate an index from one directory:

```bash
npx miku-indexgen --input-directory docs
```

This generates:

- `docs/index.json`

Generate both JSON and Markdown:

```bash
npx miku-indexgen --input-directory docs --markdown
```

This generates:

- `docs/index.json`
- `docs/index.md`

Write outputs to a separate directory:

```bash
npx miku-indexgen --input-directory docs --output-directory out --markdown
```

This generates:

- `out/index.json`
- `out/index.md`

When `--output-directory` is omitted, outputs are written under `inputDirectory`.

## CLI Options

| Option | Description |
| --- | --- |
| `--input-directory <dir>` | Directory to scan. |
| `--refresh-index <index.json>` | Regenerate an existing `index.json` from stored `generation` metadata. |
| `--output-directory <dir>` | Directory to write `index.json` and optional `index.md`. When omitted, outputs are written under the input directory. |
| `--title <text>` | Add a root-level title to generated JSON. |
| `--markdown` | Also generate `index.md`. |
| `--no-generator` | Omit root-level `generator` metadata from generated JSON. |
| `--json-summary-path <paths>` | Comma-separated JSON Pointer list used to extract JSON summaries, for example `/title,/name`. |
| `--no-recursive` | Disable recursive scanning under the input directory. |
| `--no-overwrite` | Skip writing when an output file already exists. |
| `--include-ext <exts>` | Comma-separated list of file extensions to include, for example `md,json`. |
| `--input-encoding <encoding>` | Input text encoding. Supported values are `utf8` and `shift_jis`. |
| `--output-encoding <encoding>` | Output text encoding. Supported values are `utf8` and `shift_jis`. |
| `--verbose` | Emit progress diagnostics and timing details. |

## Output

Generated JSON uses a flat `files` array as the canonical structure.
The root structure uses one-space indentation for compact readability, while each `files` entry is written on one line to make `rg` / `grep` search results useful as file-level records.
Line breaks inside string values are escaped by JSON encoding, so they do not split a file entry across multiple lines.

Root-level fields:

- `title` optional
- `generator` optional, omitted when `--no-generator` is specified
- `generation` stores refresh metadata
- `basePath`
- `files`

Each file entry includes:

- `name`
- `path`
- `ext`
- `dir`
- `size`
- `title` optional, extracted from Markdown front matter
- `description` optional, extracted from Markdown front matter
- `topics` optional, extracted from Markdown front matter
- `category` optional, extracted from Markdown front matter
- `status` optional, extracted from Markdown front matter
- `audience` optional, extracted from Markdown front matter
- `created` optional, extracted from Markdown front matter
- `updated` optional, extracted from Markdown front matter
- `sources` optional, extracted from Markdown front matter
- `summary` optional

For Markdown files, `summary` is extracted from the first heading or from the leading body text. If the file starts with Markdown front matter, the front matter is excluded from `summary` extraction.

Markdown front matter metadata is optional. Front matter is parsed as YAML, and only documented metadata fields are copied into `index.json`. Unknown fields and unsupported value shapes are ignored.

```markdown
---
title: Writing Guide
description: Short description of the document.
topics:
  - writing
  - article
  - tone
---
```

For JSON files, `summary` is omitted by default. When `--json-summary-path` is specified, each path is treated as a JSON Pointer and the first matching string value is used.

## Examples

Add a title:

```bash
npx miku-indexgen --input-directory docs --title "Docs Index"
```

Prefer JSON package names over descriptions:

```bash
npx miku-indexgen --input-directory docs --json-summary-path /name,/description
```

Prefer nested metadata first:

```bash
npx miku-indexgen --input-directory references --json-summary-path /frontmatter/title,/metadata/title,/title
```

Read and write Shift_JIS:

```bash
npx miku-indexgen --input-directory docs --input-encoding shift_jis --output-encoding shift_jis --markdown
```

Refresh an existing generated index:

```bash
npx miku-indexgen --refresh-index workplace/index.json
```

## More Information

- Development notes: [docs/development.md](docs/development.md)
- Architecture memo: [docs/architecture.md](docs/architecture.md)
- Software style memo: [docs/software-style.md](docs/software-style.md)
- miku-soft reference: [docs/miku-soft-reference.md](docs/miku-soft-reference.md)

## Repository Operation Notes

- If you are using Codex for miku-soft-related maintenance in this repository, consider explicitly activating `igapyon-miku-soft-developer`.
- `workplace/` is a local scratch area for generated indexes, package cache, cloned references, and verification artifacts.
- Only `workplace/.gitkeep` is tracked under `workplace/`.
- Generated build and release outputs under `dist/`, `bundle/`, and `release-assets/` are ignored by Git.
- Shared miku-soft design references are linked from `docs/miku-soft-reference.md`; they are not copied into this repository.

## GitHub Release Assets

This repository includes one release workflow that attaches CLI bundle assets to a GitHub Release when a `v*` release tag is pushed.

Expected release asset names for tag `v1.4.2`:

- `miku-indexgen-1.4.2.mjs`
- `miku-indexgen-sources-1.4.2.tgz`

The release workflow checks that the tag version matches `package.json` version, or uses a dot suffix such as `v1.4.2.2`.

The `.mjs` file is the single-file CLI runtime artifact. The `.tgz` file is the source archive for rebuild and audit.

---

# miku-indexgen

`miku-indexgen` は、ディレクトリを走査して `index.json` を生成する CLI ツールです。
Markdown 出力を有効にした場合は、`index.md` も生成します。

全文を読む前に、利用可能なファイルの全体像を把握したい生成AI やプログラム向けのツールです。

## インストール

`npx` で実行:

```bash
npx miku-indexgen --input-directory <dir>
```

またはグローバルインストール:

```bash
npm install -g miku-indexgen
miku-indexgen --input-directory <dir>
```

## クイックスタート

1つのディレクトリをインデックス化:

```bash
npx miku-indexgen --input-directory docs
```

生成物:

- `docs/index.json`

JSON と Markdown の両方を生成:

```bash
npx miku-indexgen --input-directory docs --markdown
```

生成物:

- `docs/index.json`
- `docs/index.md`

出力先を別ディレクトリに分離:

```bash
npx miku-indexgen --input-directory docs --output-directory out --markdown
```

生成物:

- `out/index.json`
- `out/index.md`

`--output-directory` を省略した場合は、入力ディレクトリ配下に出力します。

## CLI オプション

| Option | Description |
| --- | --- |
| `--input-directory <dir>` | 走査対象のディレクトリ。 |
| `--refresh-index <index.json>` | 保存された `generation` メタデータから既存の `index.json` を再生成。 |
| `--output-directory <dir>` | `index.json` と任意の `index.md` の出力先ディレクトリ。省略時は入力ディレクトリに出力。 |
| `--title <text>` | 生成する JSON のルートに `title` を追加。 |
| `--markdown` | `index.md` も生成。 |
| `--no-generator` | 生成する JSON のルートから `generator` メタデータを省略。 |
| `--json-summary-path <paths>` | JSON summary を抽出するための JSON Pointer をカンマ区切りで指定。例: `/title,/name` |
| `--no-recursive` | 入力ディレクトリ配下の再帰走査を無効化。 |
| `--no-overwrite` | 出力ファイルが既に存在する場合は書き込みをスキップ。 |
| `--include-ext <exts>` | 対象拡張子のカンマ区切り一覧。例: `md,json` |
| `--input-encoding <encoding>` | 入力テキストの文字コード。対応値: `utf8`, `shift_jis` |
| `--output-encoding <encoding>` | 出力テキストの文字コード。対応値: `utf8`, `shift_jis` |
| `--verbose` | 進行状況や処理時間の詳細を出力。 |

## 出力

生成される JSON は、フラットな `files` 配列を正本とする構造です。
ルート構造はコンパクトに読みやすくするため1スペースでインデントし、各 `files` 要素は `rg` / `grep` の検索結果で1ファイル単位のレコードとして扱いやすいように1行で出力します。
文字列値に含まれる改行は JSON エンコードでエスケープされるため、1つのファイル要素が複数行に分割されることはありません。

ルート要素:

- `title` 任意
- `generator` 任意。`--no-generator` 指定時は省略
- `generation` refresh 用メタデータ
- `basePath`
- `files`

各ファイル要素:

- `name`
- `path`
- `ext`
- `dir`
- `size`
- `title` 任意。Markdown front matter から抽出
- `description` 任意。Markdown front matter から抽出
- `topics` 任意。Markdown front matter から抽出
- `category` 任意。Markdown front matter から抽出
- `status` 任意。Markdown front matter から抽出
- `audience` 任意。Markdown front matter から抽出
- `created` 任意。Markdown front matter から抽出
- `updated` 任意。Markdown front matter から抽出
- `sources` 任意。Markdown front matter から抽出
- `summary` 任意

Markdown ファイルの `summary` は、最初の見出しか先頭本文から抽出します。ファイル先頭に Markdown front matter がある場合、front matter は `summary` 抽出対象から除外されます。

Markdown front matter metadata は任意です。front matter は YAML として parse され、documented metadata fields だけが `index.json` にコピーされます。unknown fields と unsupported value shapes は無視されます。

```markdown
---
title: Writing Guide
description: Short description of the document.
topics:
  - writing
  - article
  - tone
---
```

JSON ファイルの `summary` はデフォルトでは省略されます。`--json-summary-path` を指定した場合は、JSON Pointer を左から順に評価し、最初に見つかった文字列値を使います。

## 例

タイトルを付ける:

```bash
npx miku-indexgen --input-directory docs --title "Docs Index"
```

`package.json` のような JSON で名前を優先:

```bash
npx miku-indexgen --input-directory docs --json-summary-path /name,/description
```

ネストしたメタデータを優先:

```bash
npx miku-indexgen --input-directory references --json-summary-path /frontmatter/title,/metadata/title,/title
```

Shift_JIS で読み書き:

```bash
npx miku-indexgen --input-directory docs --input-encoding shift_jis --output-encoding shift_jis --markdown
```

既存の生成済み index を refresh:

```bash
npx miku-indexgen --refresh-index workplace/index.json
```

## 追加情報

- 開発メモ: [docs/development.md](docs/development.md)
- アーキテクチャメモ: [docs/architecture.md](docs/architecture.md)
- ソフトウェアスタイルメモ: [docs/software-style.md](docs/software-style.md)
- miku-soft 参照: [docs/miku-soft-reference.md](docs/miku-soft-reference.md)

## リポジトリ運用メモ

- Codex でこのリポジトリの miku-soft 関連メンテナンスを行う場合は、必要に応じて `igapyon-miku-soft-developer` を明示的に有効化することを検討してください。
- `workplace/` は、生成した index、package cache、参照用 clone、検証用 artifact のためのローカル作業領域です。
- `workplace/` 配下では `workplace/.gitkeep` だけを Git 管理します。
- `dist/`, `bundle/`, `release-assets/` 配下の生成物は Git 管理しません。
- 共有 miku-soft 設計参照は `docs/miku-soft-reference.md` からリンクし、このリポジトリにはコピーしません。

## GitHub Release Assets

このリポジトリには、`v*` release tag が push されたときに CLI bundle asset を GitHub Release に添付する単一の release workflow があります。

tag `v1.4.2` の想定 release asset 名:

- `miku-indexgen-1.4.2.mjs`
- `miku-indexgen-sources-1.4.2.tgz`

release workflow は、tag version が `package.json` の version と一致すること、または `v1.4.2.2` のような dot suffix 付きであることを確認します。

`.mjs` は 1 ファイル化した CLI runtime artifact です。`.tgz` は rebuild と audit のための source archive です。
