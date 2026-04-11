# Architecture Memo

このファイルは、このソフトウェア固有の構成と仕様を記述する。

## Current Shape

- 実装の入口は `src/main.ts`
- ビルド結果は `dist/main.js`
- モジュール方式は Node ESM
- 主出力はルートの `index.json`
- `index.json` は `files` 配列を正本にしたフラット構造
- 各要素は少なくとも `name`, `path`, `directory` を持つ

## Build Flow

- `npm run build` はフルビルド
- `dist/` を削除してから `tsc` を実行する
- その後に `npm test` を実行する
- 続けて、このリポジトリを入力にした `workspace/index.json` を生成する

## Main Files

- `src/main.ts`
- `test/main.test.ts`
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `README.md`

## Reproduction Steps

```bash
npm install
npm run build
node dist/main.js <targetDir>
```
