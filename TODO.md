# TODO

## 検討中: Markdown content 抽出

- `index.json` 生成時に、Markdown ファイル本文から追加情報を抽出したい
- `summary` 抽出を実装する

## 決定事項

- 行頭が `#` で始まる最初の行があれば、その右側を `summary` に使う
- 先頭が `#` で始まらない場合は、先頭から `#` 行が出る前までの本文を使う
- 本文は空行を飛ばして連結する
- 本文由来の `summary` は最大 256 文字に制限する
- 既定のエンコーディングは UTF-8 とする
- `summary` は JSON 出力前に最低限サニタイズする
- 改行は半角空白に変換する
- タブ文字やその他の不味そうな不可視文字・制御文字も半角空白に変換する
- 危ない文字は削除よりも半角空白への置換を優先する

## メモ

- `workbook: ファイル名` のような非見出し先頭行も、そのまま `summary` 候補にできる
- 将来的に入力エンコーディング指定と出力エンコーディング指定のオプションが欲しい

## 検討中: Node 向け配布

- npm registry で公開できる CLI パッケージ形態を整える
- `package.json` の `"private": true` を公開向け設定に見直す
- `bin` エントリを追加して `npx miku-md-indexgen` で実行できるようにする
- 公開対象ファイルを `files` などで整理する
- README の利用例を `node dist/main.js` 中心から npm / npx 利用中心へ更新する
- npm 公開時の信頼性確保は、Java のような成果物 GPG 署名ではなく、npm の 2FA と Trusted Publishing / provenance 対応を優先する
- GitHub Actions などの CI から Trusted Publishing で publish できる構成を検討する
