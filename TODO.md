# TODO

## 実装済み: Markdown content 抽出

- `index.json` 生成時に、Markdown ファイル本文から追加情報を抽出したい
- `summary` 抽出を実装する

### 決定事項

- 行頭が `#` で始まる最初の行があれば、その右側を `summary` に使う
- 先頭が `#` で始まらない場合は、先頭から `#` 行が出る前までの本文を使う
- 本文は空行を飛ばして連結する
- 本文由来の `summary` は最大 256 文字に制限する
- 既定のエンコーディングは UTF-8 とする
- `summary` は JSON 出力前に最低限サニタイズする
- 改行は半角空白に変換する
- タブ文字やその他の不味そうな不可視文字・制御文字も半角空白に変換する
- 危ない文字は削除よりも半角空白への置換を優先する

## 実装済み: generator metadata

- `index.json` のルートに `generator` を置く
- `generator` は生成ツール識別用のメタデータで、各 `files` 要素には持たせない
- `generator` の値はまず文字列で扱い、`miku-indexgen` を入れる
- `--no-generator` を指定した場合は、`index.json` のルートに `generator` を出力しない
- バージョンなどの詳細が必要になったら、将来の互換拡張でオブジェクト化を検討する

## 実装済みメモ

- `workbook: ファイル名` のような非見出し先頭行も、そのまま `summary` 候補にできる
- `--json-summary-path` 指定時は、JSON Pointer で JSON ファイル内の文字列値を探し、最初に見つかった値を `summary` にできる

## 実装済み: CLI オプション

- `--verbose` モードを追加し、処理中の進行情報を表示できるようにする
- `--verbose` では、走査中ディレクトリ、検出した Markdown ファイル、出力先ファイルなどを順次表示する
- 通常モードでは出力を簡潔に保ち、進行情報は `--verbose` 指定時だけ表示する

## 実装済み: 性能改善

- `index.json` 生成が妙に低速だったため、どこで時間がかかっているかを確認する
- ディレクトリ走査、Markdown 読み込み、`summary` 抽出、JSON 文字列化、書き込みの各段階を切り分けて計測できるようにする
- 必要なら `--verbose` とは別に、性能調査向けの計測ログやプロファイル出力方法を検討する

## 実装済み: ソース分割

- `src/main.ts` は CLI エントリポイントと公開 API の再 export に絞る
- CLI 引数解析、エンコーディング、Markdown 処理、索引生成、共有型を別ファイルに分ける
- テストも CLI、エンコーディング、Markdown、索引生成の責務ごとに分ける

## 実装済み: Node CLI package shape

- `bin` エントリを追加して `npx miku-indexgen` で実行できるようにする
- ビルド時に `dist/main.js` を executable にする
- 公開対象ファイルを `files` で `dist/`, `README.md`, `LICENSE` に整理する
- README の利用例を `node dist/main.js` 中心から npm / npx 利用中心へ更新する
- npm 公開向けに `license`, `repository`, `homepage`, `bugs`, `keywords`, `exports`, `types` を追加する
- TypeScript declaration を `dist/*.d.ts` として出力する
- `npm pack --dry-run` 用の確認スクリプトを追加する

## 実装済み: GitHub Release asset workflow

- `v*` tag push 時に GitHub Release へ npm package tarball を添付する workflow を追加する
- `package.json` の version と release tag version の整合性を確認する
- `v1.1.0.2` のような dot suffix 付き tag も同じ package version 系列として扱う
- この workflow では `npm publish` は実行しない

## 実装済み: search-friendly JSON formatting

- `index.json` のルート構造は1スペース単位でインデントする
- `files` 配列の各要素は `rg` / `grep` の検索結果で1ファイル単位のレコードとして読めるように1行で出力する
- 文字列値内の改行は JSON エスケープに任せ、ファイル要素の行を分割しない

## 実装済み: Markdown front matter の YAML 対応

- `docs/miku-indexgen-frontmatter-spec.md` に沿って、Markdown front matter を YAML として parse する
- 現行の正規表現ベースの `title` / `topics` 抽出を、YAML parser ベースの許可フィールド抽出へ置き換える
- 依存追加は最小にしたいが、YAML 互換を自前実装するより `yaml` または `js-yaml` の採用を優先する
- `index.json` には documented metadata fields だけを出力する
- unknown field は無視する
- documented field でも unsupported shape は無視する
- YAML parse error 時は CLI 全体を落とさず、front matter metadata なしとして扱う方針を検討する

### 対応候補フィールド

- `title`: string
- `description`: string
- `topics`: string array
- `category`: string
- `status`: string
- `audience`: string array
- `created`: `YYYY-MM-DD`
- `updated`: `YYYY-MM-DD`
- `sources`: object array

### `sources` の最小対応

- `sources[]` は object のみ採用する
- `type` は required string とする
- 許可キーは `type`, `role`, `label`, `url`, `path`, `version`, `checked`
- unknown keys は object 内でも無視する
- `checked` は `YYYY-MM-DD` のみ採用する
- object nesting は `sources[]` の1段までに制限する

### 実装ステップ

1. `docs/index-json-spec.md` に新しい Markdown metadata fields を追記する
2. `src/types.ts` の `IndexFile` に `description`, `category`, `status`, `audience`, `created`, `updated`, `sources` を追加する
3. `sources` 用の `IndexSource` 型を追加する
4. YAML parser 依存を `package.json` に追加する
5. `src/markdown.ts` の `parseFrontMatterMetadata()` を YAML parser ベースに差し替える
6. `sanitizeTextForIndex()` を通す対象を明確にする
7. YAML parser が date を `Date` 化する場合は `YYYY-MM-DD` 文字列へ正規化する
8. `src/indexer.ts` の `readMarkdownIndexFields()` から新 metadata fields を `IndexFile` に流す
9. `test/markdown.test.ts` に folded string, inline array, invalid shape, unknown field, sources のテストを追加する
10. `test/indexer-core.test.ts` に `index.json` 出力テストを追加する
11. README の front matter 説明を `title` / `topics` 限定から新仕様へ更新する
12. `npm test` と `npm run build` で確認する

## 実装済み: self-describing `index.json` と refresh index

- `index.json` に再生成条件を保持する `generation` metadata を追加する
- 既存の `index.json` を入力として読み、同じ条件で `index.json` を更新できるようにする
- 生成AIが `index.json` の作成条件を推測せずに再生成できるようにする
- この機能は generated artifact を手編集する運用ではなく、生成条件を CLI が読み取って再実行するための仕組みとして扱う

### root metadata 方針

- `basePath` と `generation.inputPath` は別フィールドとして保持する
- `basePath` は生成された `index.json` 内の file entry を解釈するための情報
- `generation.inputPath` は再生成のために使う入力ディレクトリ情報
- 値が同じになりがちでも責務が違うため統合しない
- `--no-generator` は root `generator` metadata だけに作用する
- `generation` metadata は root `generator` とは別扱いにする
- `--no-generator` 指定時でも、refresh に必要な `generation` は残す

### `generation` に保存する候補

```json
"generation": {
  "schemaVersion": 1,
  "inputPath": "../docs",
  "markdownOutput": true,
  "recursive": true,
  "includeExtensions": ["md", "json"],
  "inputEncoding": "utf8",
  "outputEncoding": "utf8",
  "jsonSummaryPaths": ["/title", "/name"],
  "title": "Docs Index",
  "includeGeneratorMetadata": true
}
```

- `inputPath` は `index.json` のあるディレクトリから入力ディレクトリへの相対パスにする
- `markdownOutput: true` の場合は refresh 時に隣接する `index.md` も更新する
- `title` は root `title` を再現するための生成条件として保存する
- `includeGeneratorMetadata` は root `generator` の有無を再現するために保存する

### `generation` に保存しないもの

- `overwrite`
- `verbose`

理由:

- `overwrite` / `--no-overwrite` は実行時の安全ポリシーであり、生成物内容を決める条件ではない
- `verbose` はログ表示だけで生成物内容に影響しない

### CLI 案

```bash
miku-indexgen --refresh-index workplace/index.json
```

動作:

1. 指定された `index.json` を読む
2. root `generation` を読む
3. `generation.inputPath` を `index.json` の親ディレクトリ基準で解決する
4. 同じ `index.json` を再生成する
5. `generation.markdownOutput: true` の場合は同じ出力ディレクトリの `index.md` も再生成する

### 初期実装の範囲

- まずは `--refresh-index <index.json>` だけを実装する
- refresh 時の生成条件 override は初期実装では扱わない
- `--verbose` のような実行時ログ指定だけは併用可能にしてよい
- `generation` が存在しない古い `index.json` は refresh 不可として、通常の `--input-directory` による再生成を案内する

### 実装ステップ

1. `docs/index-json-spec.md` に `generation` metadata を追加する
2. `docs/input-files-spec.md` に refresh index の入力扱いを追記する
3. `src/types.ts` に `GenerationMetadata` 型を追加する
4. `buildIndexContent()` が `generation` metadata を出力できるようにする
5. `src/cli.ts` に `--refresh-index <index.json>` を追加する
6. `createIndexes()` と refresh 実行経路を分ける
7. refresh 時は `generation.inputPath` と index 出力先から `CliOptions` 相当を復元する
8. `test/indexer-core.test.ts` に `generation` 出力テストを追加する
9. refresh 用の CLI / integration テストを追加する
10. README と `--help` に refresh index を記載する
11. `npm test` と `npm run build` で確認する

## 実装済み: 生成AI時代向け `--help` 拡張

- Markdown front matter の YAML 対応後に、`miku-indexgen --help` を拡張する
- `--help` は詳細仕様の全文ではなく、生成AIと人間が安全に実行できる短い runtime contract として扱う
- 未実装または planned の metadata fields は `--help` に混ぜない
- 詳細仕様は `docs/*-spec.md` と Agent Skills 側へ委ね、`--help` には参照先だけを載せる

### `--help` に含める候補

- Usage
- Description
- Default behavior
  - recursive scan
  - default include extensions: `md,json`
  - dotfiles and dot-directories are skipped
  - output directory default
  - current run's `index.json` / `index.md` are excluded from `files[]`
- Generated files
  - `index.json` and `index.md` are generated artifacts
  - do not edit generated files by hand; rerun `miku-indexgen`
- Markdown behavior
  - `summary` extraction from first heading or leading body text
  - front matter is YAML
  - only documented metadata fields are copied into `index.json`
  - unknown fields and unsupported shapes are ignored
- JSON behavior
  - JSON `summary` is omitted by default
  - `--json-summary-path` extracts the first matching string value
- Options
- Examples
- References
  - `docs/input-files-spec.md`
  - `docs/index-json-spec.md`
  - `docs/miku-indexgen-frontmatter-spec.md`

### 実装ステップ

1. YAML front matter 対応が完了していることを確認する
2. `src/cli.ts` の `printHelp()` をセクション化する
3. `test/cli.test.ts` に主要語句の help 出力テストを追加する
4. README または `docs/development.md` に `--help` は短い runtime contract であることを記録する
5. `npm test` と `npm run build` で確認する

## 実装済み: Node 向け公開

- npm registry で公開できる CLI パッケージ形態をさらに整える
- npm 公開時の信頼性確保は、Java のような成果物 GPG 署名ではなく、npm の 2FA と Trusted Publishing / provenance 対応を優先する
- GitHub Actions などの CI から Trusted Publishing で publish できる構成を検討する

### 決定事項

- `release-cli-bundle.yml` を release / publish automation の正本とする
- GitHub Release asset job と npm publish job は同じ workflow run にまとめる
- release asset job は `v1.3.0.2` のような dot suffix tag でも実行できる
- npm publish job は tag version と `package.json` version が完全一致するときだけ publish する
- dot suffix tag では npm publish を skip する
- npm publish は Trusted Publishing / OpenID Connect を前提にし、長期 npm token を置かない
- publish 前に `npm ci`, `npm run build`, `npm run pack:check` を実行する

### 実装ステップ

1. `.github/workflows/release-cli-bundle.yml` に npm publish job を統合する
2. workflow に `id-token: write` permission を付ける
3. npm publish tag と `package.json` version の完全一致チェックを入れる
4. dot suffix tag では npm publish を skip する
5. README と `docs/development.md` に一本化した workflow であることを記録する
6. workflow の最低限の契約をテストで確認する
7. `npm test` と `npm run build` で確認する

## 実装済み: 保守リファクタリング

- 挙動変更なしで、責務が大きくなった実装ファイルを小さく分ける
- 次の機能追加前に、Markdown front matter、help text、test helper、JSON formatting の境界を整理する

### 対象

1. `src/markdown.ts` から front matter parse / metadata sanitizer を `src/frontmatter.ts` へ切り出す
2. `src/cli.ts` から `printHelp()` を `src/help.ts` へ切り出す
3. `test/indexer-core.test.ts` などで繰り返している `JSON.parse(readFileSync(...))` を test helper 化する
4. `formatIndexJson()` を `src/index-json.ts` へ切り出す

### 方針

- 既存の CLI と public export の互換性を保つ
- 出力内容は変更しない
- refactor 後に `npm test`, `npm run build`, `--refresh-index` を確認する
