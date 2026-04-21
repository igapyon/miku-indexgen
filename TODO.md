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

## 検討中: Node 向け公開

- npm registry で公開できる CLI パッケージ形態をさらに整える
- npm 公開時の信頼性確保は、Java のような成果物 GPG 署名ではなく、npm の 2FA と Trusted Publishing / provenance 対応を優先する
- GitHub Actions などの CI から Trusted Publishing で publish できる構成を検討する
