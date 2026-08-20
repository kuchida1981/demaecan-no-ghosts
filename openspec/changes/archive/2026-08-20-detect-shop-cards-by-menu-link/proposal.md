## Why

現在、ゴースト判定UI（情報アイコン・フィルタ）は店舗一覧ページの「〜〜付近の店舗ランキング」セクションにしか表示されない。これは店舗カードの検出が`article[aria-labelledby^="shoplist-"]`という1種類のセレクタに限定されているためで、「過去に注文したお店」セクションのカードはこのセレクタにマッチしないマークアップ（`<article>`ではなく`<div>`、`aria-labelledby`なし）のため、判定UI・フィルタが一切適用されない（GitHub Issue #6）。

実機のDOMを調査した結果、「過去に注文したお店」のカードも店舗詳細への内部リンク（`a[href*="/shop/menu/{shopId}"]`）は共通して持っていることが分かった。カード発見の起点をこのリンクに広げることで、対応セクションを増やす。

## What Changes

- 店舗カード検出を、既存の`article[aria-labelledby^="shoplist-"]`セレクタに加えて、`a[href*="/shop/menu/"]`リンクを起点とした検出方式を併用するように拡張する。
  - リンクから祖先方向に辿り、直近で`<img>`を含む要素を「カードのルート要素」とみなす。
  - 既に`article[aria-labelledby^="shoplist-"]`でカバーされているリンク（ランキングカード内のリンク）は二重検出しないようスキップする。
- これにより、判定UI（情報アイコン）・フィルタ（表示/非表示切り替え）が「過去に注文したお店」セクションのカードにも自動的に適用されるようになる。`CardOverlayManager`/`FilterManager`自体への変更は不要（両者ともセレクタに依存せず、渡されたカード要素を汎用的に扱う設計のため）。

## Capabilities

### New Capabilities
(なし)

### Modified Capabilities
- `shop-detail-overlay`: 「Icon injection on shop cards」要件を、`article[aria-labelledby^="shoplist-"]`カードに限定せず、店舗詳細への内部リンクを持つ他のマークアップのカード（例: 「過去に注文したお店」セクション）にも適用されるように拡張する。

## Impact

- `src/adapters/ListingAdapter.ts`: `getShopCards`/`matchesShopCard`にリンク起点の検出ロジックを追加する。`extractShopId`/`extractShopName`は既存の実装（`extractShopIdFromCard`のリンクフォールバック、`SHOP_LINK_SELECTOR`によるリンク検索）がそのまま新しいカードにも通用するため変更不要。
- `src/managers/CardOverlayManager.ts`・`src/managers/FilterManager.ts`: 変更なし（アダプタから受け取ったカード要素を汎用的に扱っているため）。
