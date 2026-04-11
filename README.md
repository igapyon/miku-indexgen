# miku-md-indexgen

生成AIファーストで、指定したフォルダ直下の各サブフォルダを走査し、配下の `*.md` をフラットな一覧の `index.json` としてルートに生成します。

`index.json` は人間向けの目次ではなく、生成AI やプログラムがそのまま読み取りやすい機械可読な入力を主目的にしています。

## Build

```bash
npm install
npm run build
```

`npm run build` は `dist/` を一度消してから再ビルドします。
その後に `npm test` を実行し、このリポジトリを入力にした `workspace/index.json` も生成します。

## Usage

```bash
node dist/main.js ./docs
```

### Options

- `--output`, `-o`: 出力ファイル名。デフォルトは `index.json`
- `--no-recursive`: サブフォルダ内を再帰走査しない
- `--no-overwrite`: 既存のインデックスファイルを上書きしない

## Example

`./docs` の直下に `chapter1`, `chapter2` がある場合、`./docs/index.json` を生成します。

生成される JSON は、`files` 配列を正本にしたフラット構造です。
