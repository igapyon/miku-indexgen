# Software Style Memo

このプロジェクトは、最小構成の Node.js + TypeScript CLI として作る。

## Fixed Points

- 実装の入口は `src/main.ts`
- ビルド結果は `dist/main.js`
- モジュール方式は Node ESM
- 依存は最小限にして、実処理は Node 標準 API を優先する
- `npm run build` はフルビルドにする
  - `dist/` を消してから `tsc` を実行する

## Minimal File Set

- `src/main.ts`
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

## Design Shape

- ひとつの CLI に処理を集約する
- 入力はコマンドライン引数で受ける
- 出力はファイル生成として返す
- オプションは最小限だけ持つ
- 振る舞いは同期処理で素直に追える形にする
- 外部ライブラリに頼らず、Node 標準 API で完結させる

## Why This Shape

- 小さい CLI なので、フレームワークを入れずに追いやすくする
- `main.ts` を入口にして、実行開始点を明確にする
- `dist/` を毎回作り直して、古い成果物を残さない
