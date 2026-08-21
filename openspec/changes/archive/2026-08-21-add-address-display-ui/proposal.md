## Why

issue #26 の前段（`add-address-prefetch-cache`）で、住所・店名を穏やかに先読み・キャッシュする基盤ができた。ここからは、そのキャッシュを実際に使って店舗一覧カードに住所を表示し、「一つの場所がいくつもの店舗を出店しているケース（ダークキッチン／バーチャルレストラン）」をユーザー自身が見つけられるようにする、issue #26 本来の目的であるUI部分を実装する。

## What Changes

- 店舗一覧カードの店名の下に、その店舗の住所を1行・省略表示（`text-overflow: ellipsis` 相当）で常時表示する。対象は `article[aria-labelledby^="shoplist-"]` 形式のカードのみとし、カルーセル（リンクベースのフォールバックカード）は対象外とする。
- 既存の判定フィルタパネル（画面右下、`ghosts-filter-panel`）に「住所表示」チェックボックスを追加し、`add-address-prefetch-cache` で新設済みの `Store` の先読み有効フラグ（`addressPrefetchEnabled`）をそのままON/OFFする。OFFで住所行が非表示になり先読みも止まる。ONで住所行が表示され先読みも再開する。
- カードの住所行にマウスオーバー（タッチはクリック）すると、同一の正規化住所を持つ他の店舗（`Store.getShopIdsByNormalizedAddress` を利用）の店名一覧をツールチップで表示する。各店名は該当店舗のメニューページへの新規タブリンクとする。自分以外に該当店舗がない場合はツールチップを出さない。ツールチップは画面内に収まる方向に自動で開く。

## Capabilities

### New Capabilities
- `address-display`: 店舗一覧カードへの住所常時表示（1行省略）、表示トグル、同一住所の他店舗ホバー一覧を提供するUI capability。

### Modified Capabilities
(なし。`address-prefetch-cache` の先読み有効フラグはUIから操作されるようになるが、フラグ自体の存在・デフォルト値・先読みキューとの連動という既存要件の記述内容は変わらない。`ghost-shop-filter` の既存3チェックボックスの挙動にも変更はなく、パネルに新しいチェックボックスが並ぶだけ。)

## Impact

- `src/adapters/ListingAdapter.ts` — 店名要素そのもの（`id="shoplist-{shopId}-shopname"`）を返す新しいアダプタメソッドを追加
- `src/managers/CardOverlayManager.ts` または新規マネージャ — 住所行の挿入、ホバー/クリックでのツールチップ表示
- `src/managers/FilterManager.ts` — 「住所表示」チェックボックスの追加、`Store.setAddressPrefetchEnabled` との連携
- `src/store.ts` — 追加の永続化キーは不要（既存の `addressPrefetchEnabled` を流用）
- `src/ui/styles.ts` — 住所行・ツールチップ用の新規CSSクラス
- スコープ外: 住所の正規化精度の改善、カルーセル（リンクベースカード）への対応
