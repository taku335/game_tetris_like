# Falling Blocks

PCブラウザ向けの落ち物パズルゲームです。GitHub Pages で公開できる静的Webアプリとして開発します。

現時点では Vite + TypeScript の初期構成のみです。ゲームロジック、Docker、GitHub Pages デプロイ、操作説明は後続Issueで実装します。

## 開発コマンド

Docker と make を使って開発します。

```bash
make install
make dev
make build
make test
make preview
```

補助的に、ホスト環境に Node.js がある場合は npm scripts も利用できます。

```bash
npm install
npm run dev
npm run build
npm run test
npm run preview
```

## 方針

- 外部APIは使いません
- サーバーサイド処理は使いません
- PCブラウザの Chrome / Edge を優先します
- 任天堂・公式テトリスの画像、音源、ロゴ、商標表現は使いません

## GitHub Pages

`main` ブランチに反映されると、GitHub Actions が `BASE_PATH=/game_tetris_like/` を指定してビルドし、`dist` を GitHub Pages にデプロイします。
