# 出前館ゴースト店舗判定 (Demaecan No Ghosts)

[English version here](README.md)

[出前館](https://demae-can.com/)向けの[Tampermonkey](https://www.tampermonkey.net/)ユーザースクリプトです。店舗一覧カードから住所を確認できるようにし、「ゴーストレストラン」（実店舗を持たず、店舗一覧上は通常の飲食店のように見えるデリバリー専用ブランド）を判定・一覧から非表示にできます。

## 主な機能

- **店舗カードの情報アイコン** — 店舗一覧ページ（「過去に注文したお店」カルーセルを含む）の各店舗カード右上に情報アイコンが表示されます。クリックまたはホバーすると、店名・住所（初回のみ取得）・Googleマップへのリンク・Google検索へのリンク・住所の再取得ボタンを含むポップオーバーが開きます。
- **ゴースト / 実店舗の判定** — ポップオーバー、または店舗自身のページから、ゴースト（👻）または実店舗（🏠）として判定できます。判定結果は保存され、その店舗が表示されるすべての箇所で情報アイコンの絵柄に反映されます。
- **フィルタ機能** — 画面右下のトグルで、「ゴースト」と判定した店舗を一覧から非表示にできます。
- **店舗ページの判定パネル** — 店舗自身のページ（`/shop/menu/{shopId}`または`/shopDetail/{shopId}/{areaId}`）を開くと、画面左下に判定用パネルが表示されます。サイト内の画面遷移にも追従します。

## インストール方法

1. [Tampermonkey](https://www.tampermonkey.net/)ブラウザ拡張機能をインストールします。
2. 以下のユーザースクリプトURLを開くと、Tampermonkeyがインストールを提案します。

   ```
   https://raw.githubusercontent.com/kuchida1981/demaecan-no-ghosts/stable/demaecan-no-ghosts.user.js
   ```

このURLから自動更新されます。開発版（作業中の変更）を試したい場合は、代わりに`unstable`ブランチのURLを使用してください。

```
https://raw.githubusercontent.com/kuchida1981/demaecan-no-ghosts/unstable/demaecan-no-ghosts.user.js
```

## 開発者向け情報

```bash
npm install          # 依存関係のインストール
npm test             # テスト実行(vitest、カバレッジ計測込み)
npm run lint          # eslintによるlint
npm run check-types   # tscによる型チェック
npm run build         # dist/demaecan-no-ghosts.user.js のビルド
```

このプロジェクトは変更の計画・追跡に[OpenSpec](https://github.com/Fission-AI/OpenSpec)を使用しています。詳細は`openspec/`ディレクトリを参照してください。

## ライセンス

[ISC](https://opensource.org/licenses/ISC)
