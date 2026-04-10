# miku-md-indexgen

指定したフォルダ直下の各サブフォルダを対象に、配下の `*.md` へのリンク一覧を持つ `index.md` を生成します。

## Build

```bash
npm install
npm run build
```

`npm run build` は `dist/` を一度消してから再ビルドします。

## Usage

```bash
node dist/main.js ./docs
```

### Options

- `--output`, `-o`: 出力ファイル名。デフォルトは `index.md`
- `--no-recursive`: サブフォルダ内を再帰走査しない
- `--no-overwrite`: 既存のインデックスファイルを上書きしない

## Example

`./docs` の直下に `chapter1`, `chapter2` がある場合、それぞれに `index.md` を生成します。
