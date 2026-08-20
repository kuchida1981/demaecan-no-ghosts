## Why

店舗一覧ページのカードポップオーバー（`CardOverlayManager`）では住所・地図リンク・検索リンクを確認できるが、店舗自身のページ（`ShopPageManager` が表示する判定パネル）には判定バッジと判定コントロールしかなく、同じ情報を確認できない。店舗ページを開いた状態のまま地図や検索で店舗の実在性を確認したいユーザーが、一覧ページに戻る必要がある（GitHub issue #18）。

## What Changes

- `ShopPageManager` が表示するパネルに、住所表示・Googleマップリンク・Google検索リンク・住所再取得ボタンを追加する。対象は `ShopPageAdapter` がマッチする両方のURL（`/shop/menu/{shopId}` と `/shopDetail/{shopId}`）。
- 住所取得は既存の `ShopDetailFetcher`（`CardOverlayManager` と同一インスタンス）を `ShopPageManager` に注入し、fetch経由・キャッシュ共有で行う。パネル表示時（`_mountPanel`）に即座に読み込みを開始する。
- 検索リンクの店名取得に、既存だが未使用だった `ShopPageAdapter.getShopName()` を初めて使用する。
- `CardOverlayManager._buildPopover` 内の「住所表示＋地図/検索リンク＋再取得ボタン」ブロックを独立した共通コンポーネントに切り出し、`CardOverlayManager` と `ShopPageManager` の両方から使用する。既存のCSSクラス（`.ghosts-popover__address` 等）を可能な限り再利用する。

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `shop-detail-overlay`: 住所表示・地図/検索リンク・手動再取得の対象範囲を、店舗一覧カードのポップオーバーだけでなく、店舗自身のページ（menu/detailページ）のパネルにも拡張する。

## Impact

- `src/managers/ShopPageManager.ts`: パネル構築時に住所ブロックを追加、`ShopDetailFetcher` を新たにコンストラクタで受け取る。
- `src/managers/CardOverlayManager.ts`: 住所ブロックの構築ロジックを共通コンポーネントへ切り出す（リファクタ、挙動は変えない）。
- 新規: 住所ブロックの共通コンポーネント（例: `src/ui/AddressBlock.ts`）。
- `src/adapters/ShopPageAdapter.ts`: `getShopName()` が初めて呼び出される。
- `src/ui/styles.ts`: `.ghosts-shop-page-panel` 内での住所ブロック表示に必要なスタイル追加。
- `src/main.ts`: `ShopPageManager` のインスタンス化時に既存の `ShopDetailFetcher` を注入。
