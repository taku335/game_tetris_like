# Falling Blocks

PCブラウザ向けの落ち物パズルゲームです。Vite + TypeScript で作成した静的Webアプリで、GitHub Pages にデプロイできます。

## 対象環境

- PCブラウザ向けです
- Chrome / Edge を優先します
- スマホ対応は今回のスコープ外です
- 外部API、サーバーサイド処理、オンラインランキングは使いません
- 任天堂・公式テトリスの画像、音源、ロゴ、商標表現は使いません

## セットアップ

Docker と make を使って開発します。

```bash
make install
make dev
```

開発サーバーは `http://localhost:5173/` で起動します。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `make install` | Docker内で依存パッケージをインストール |
| `make dev` | Vite 開発サーバーを起動 |
| `make build` | TypeScript チェック後に本番ビルド |
| `make test` | TypeScript の型チェックを実行 |
| `make preview` | ビルド済みアプリのプレビューを起動 |

ホスト環境に Node.js がある場合は npm scripts も利用できます。

```bash
npm install
npm run dev
npm run build
npm run test
npm run preview
```

## 操作方法

### キーボード

| 操作 | キー |
| --- | --- |
| 左移動 | `Left` / `A` |
| 右移動 | `Right` / `D` |
| ソフトドロップ | `Down` / `S` |
| 時計回り回転 | `Up` / `W` / `X` |
| 反時計回り回転 | `Z` |
| ハードドロップ | `Space` |
| Hold | `C` / `Shift` |
| Pause | `Esc` / `P` |

### タイトル / 操作説明画面

| 操作 | キー |
| --- | --- |
| メニュー選択 | `Up` / `Down` / `Left` / `Right` / `W` / `A` / `S` / `D` |
| 決定 | `Enter` / `Space` |
| 戻る | `Esc` |

### Nintendo Switch Proコントローラー

Gamepad API の入力を `procon-gamepad-mapper` 経由で取得します。Bluetooth接続したPCで、Chrome / Edge の利用を想定しています。

現時点で `procon-gamepad-mapper` は npm 未公開のため、GitHub の HTTPS 参照を依存関係として導入しています。

| 操作 | 割り当て案 |
| --- | --- |
| 左右移動 | 十字キー / 左スティック |
| ソフトドロップ | 十字キー下 / 左スティック下 |
| ハードドロップ | 十字キー上 / `X` / `Y` |
| 回転 | `A` / `B` |
| Hold | `L` / `R` / `ZL` / `ZR` |
| Pause | `+` |

ゲーム本体側では物理ボタン番号や axis index を直接扱わず、`moveLeft`、`rotateCW`、`pause` などの抽象アクションだけを参照します。

タイトル画面は十字キーまたは左スティックでメニューを選択し、`A` または `+` で決定できます。操作説明画面では接続中の gamepad、選択中の controller、入力状態、mapped action、dead zone、保存済み設定の状態をリアルタイム表示します。

## Proコン接続手順

1. PCのBluetooth設定を開きます。
2. Proコントローラーのシンクロボタンを長押ししてペアリング状態にします。
3. PC側でコントローラーを選択して接続します。
4. Chrome / Edge でアプリを開きます。
5. ゲーム画面または操作説明画面の Gamepad Status が `Connected` になることを確認します。

接続済みでも入力されない場合は、ブラウザを再読み込みするか、コントローラーの再接続を試してください。

Windows / macOS、Chrome / Edge、Bluetooth / USB、コントローラーのファームウェア差によって、Gamepad API の `id` や列挙タイミングが変わる場合があります。ブラウザによっては、コントローラーのボタンを一度押すまで gamepad が列挙されません。GitHub Pages は HTTPS の secure context で配信されるため Gamepad API の利用に適しています。

## 実装済み機能

- ブロック落下
- 左右移動
- 回転
- ソフトドロップ
- ハードドロップ
- ライン消去
- スコア
- レベル
- ゲームオーバー
- Next表示
- Hold
- 一時停止
- リスタート
- 操作説明画面
- Gamepad API 接続状態表示
- タイトル画面のゲームパッド操作
- procon-gamepad-mapper 経由のコントローラー入力
- コントローラー入力と mapped action の可視化
- localStorage によるハイスコア保存
- localStorage によるコントローラー設定保存状態の表示

## GitHub Pages

`main` ブランチに反映されると、GitHub Actions が `BASE_PATH=/game_tetris_like/` を指定してビルドし、`dist` を GitHub Pages にデプロイします。

Vite の `base` は `BASE_PATH` 環境変数から設定するため、GitHub Pages のサブパス配信でも JS / CSS を正しく読み込めます。

## 動作確認

```bash
make build
make test
make preview
```

プレビューは `http://localhost:4173/` で確認します。
