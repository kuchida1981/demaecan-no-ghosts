## Context

`CardOverlayManager`（一覧ページのカードポップオーバー）は `ShopDetailFetcher` を使って住所を取得し、住所表示・Googleマップリンク・Google検索リンク・手動再取得ボタンを提供している（`shop-detail-overlay` spec）。`ShopPageManager`（店舗自身のページのパネル）は判定バッジ・判定コントロールのみで、この情報を持たない。

`ShopPageAdapter.match()` は `/shop/menu/{shopId}`（メニューページ）と `/shopDetail/{shopId}`（詳細ページ）の両方にマッチし、`ShopPageManager` のパネルはどちらのURLでも表示される。実際のページを確認したところ、`/shopDetail/{shopId}` は住所を `<h2>住所</h2>` セクションとしてDOM内に持つが、`/shop/menu/{shopId}` は持たない。したがってパネル側で住所を得るには、ページ種別によらず動作する経路が必要になる。

## Goals / Non-Goals

**Goals:**
- `ShopPageManager` のパネルに、`CardOverlayManager` のポップオーバーと同等の住所・地図リンク・検索リンク・再取得ボタンを表示する。
- 両方のページ種別（menu / detail）で同じ挙動にする。
- 住所取得ロジック・UIを `CardOverlayManager` と共通化し、今後の変更（例: #17のホバープレビュー）で二重メンテナンスにならないようにする。

**Non-Goals:**
- `/shopDetail/{shopId}` ページでDOMから直接住所を読み取る最適化は行わない（今回はスコープ外。将来的な最適化の余地として残す）。
- パネルのレイアウト自体（固定位置・全体デザイン）の見直しは行わない。既存の `.ghosts-shop-page-panel` の枠組みに要素を追加するのみ。

## Decisions

### 住所取得は常に `ShopDetailFetcher` 経由（ページ内DOM直読みはしない）
`/shop/menu/{shopId}` ページは住所をDOMに持たないため、`/shopDetail/{shopId}` ページだけ特別扱いして `document` から直接読む案（B案）は、2つのページ種別で異なるコードパスが必要になり複雑化する。既存の `ShopDetailFetcher`（`store` によるキャッシュ・重複リクエスト防止つき）を両ページで一律に使う（A案）ことで、実装を一本化し、一覧側とキャッシュも共有できる。`/shopDetail/{shopId}` ページで開いた際に、画面に既に見えている住所を無駄にfetchし直す形にはなるが、実装の単純さを優先する。

### 住所ブロックをカードポップオーバーとパネルの共通コンポーネントとして切り出す
`CardOverlayManager._buildPopover` 内の「住所表示 (`addressEl`) ＋ 地図/検索リンク (`linksEl`, `mapLink`, `searchLink`) ＋ 再取得ボタン (`refetchBtn`)」と、その読み込みロジック (`_loadAddress` / `_renderAddressResult`) を、`shopId` / `shopName` / `ShopDetailFetcher` を受け取り、DOM要素と `load(forceRefetch: boolean)` を返す独立した関数（例: `src/ui/AddressBlock.ts` の `buildAddressBlock()`）に切り出す。`CardOverlayManager` はホバー/クリックで開いたタイミングで `load(false)` を呼び、`ShopPageManager` はパネルのマウント時に即座に `load(false)` を呼ぶ。両者は同じCSSクラス（`.ghosts-popover__address` 等）をそのまま使い回す。

### パネルでも再取得ボタンをそのまま表示する
`/shopDetail/{shopId}` ページでは住所が既に画面に見えているため、再取得ボタンの実用上の意味は薄いが、UIの一貫性・共通コンポーネント化のシンプルさを優先し、条件分岐で隠さずそのまま表示する。

### `ShopPageAdapter.getShopName()` を初めて使用する
検索リンクのクエリに必要な店名は、既存の（これまで未使用だった）`getShopName()`（`document.querySelector('h1')` ベース）から取得する。カード側と異なり、店名はページ読み込み時点で即座に取得できるため、住所の非同期取得を待たずに検索リンクの `href` を設定できる（既存のポップオーバー実装と同じパターン）。

## Risks / Trade-offs

- [`/shopDetail/{shopId}` ページで無駄なネットワークリクエストが発生する] → 許容する。パネル表示のたびに毎回起きるわけではなく、`ShopDetailFetcher` のキャッシュにより同一shopIdへの再訪問時はキャッシュヒットする。
- [パネル幅（12rem固定）に地図/検索リンクや住所テキストが収まらない可能性] → 実装時にスタイル調整（折り返し等）で対応する。レイアウトの大幅な見直しはNon-Goalとする。

## Open Questions
(none)
