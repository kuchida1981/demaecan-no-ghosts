## 1. アダプタ拡張

- [x] 1.1 `ListingAdapter`（`src/types.ts`）に `extractShopNameElement(card: HTMLElement): HTMLElement | null` を追加する
- [x] 1.2 `DemaecanListingAdapter`（`src/adapters/ListingAdapter.ts`）で、`card` の `aria-labelledby` 値から `document.getElementById` して店名要素を返す実装を追加する。`aria-labelledby` がない（カルーセル/リンクベース）場合は `null` を返す
- [x] 1.3 上記のユニットテストを追加する(該当あり/該当なしの両ケース)

## 2. URLヘルパー

- [x] 2.1 `buildShopMenuUrl(shopId: ShopId): string`（`/shop/menu/{shopId}` を組み立てる）を `src/logic.ts` に追加する
- [x] 2.2 ユニットテストを追加する

## 3. AddressLabelManager: 住所行の常時表示

- [x] 3.1 新規クラス `AddressLabelManager`（`src/managers/AddressLabelManager.ts`）を作成する。コンストラクタで `Store` を受け取る
- [x] 3.2 `decorateCard(shopId, card)`: `adapter.extractShopNameElement(card)` が `null` なら何もしない。要素があれば `<p class="ghosts-address-label">` を作成し、店名要素の直後に `insertAdjacentElement('afterend', ...)` で挿入する
- [x] 3.3 挿入時、`store.getShopRecord(shopId)?.address` があれば即座にテキストへ反映する
- [x] 3.4 `store.subscribe` で以後の更新を監視し、該当shopIdの住所が新たに埋まった場合にラベルのテキストを更新する
- [x] 3.5 `store.getState().addressPrefetchEnabled` を初期反映し、以後は同じ購読コールバック内でフラグの変化に応じて表示/非表示（`ghosts-address-label--hidden` 等のクラス切り替え）を行う
- [x] 3.6 ユニットテストを追加する(住所即時反映、後から埋まるケース、カルーセルカードに挿入されないこと、フラグOFFで非表示になること)

## 4. AddressLabelManager: 同一住所ホバー一覧ツールチップ

- [x] 4.1 住所ラベルに `mouseenter`/`mouseleave`(hover対応、既存の `supportsHover()` 判定を再利用) と `click`(タッチ対応) を配線する
- [x] 4.2 開くたびに `normalizeAddress` + `store.getShopIdsByNormalizedAddress` で自分以外のshopId一覧を取得し、0件なら何もしない
- [x] 4.3 1件以上あれば `<div class="ghosts-address-tooltip">` を構築する。各エントリは `store.getShopRecord(otherId)?.name` を優先し、なければ `otherId` を表示、`href` は `buildShopMenuUrl(otherId)`、`target="_blank"` `rel="noopener noreferrer"`
- [x] 4.4 開く方向の自動判定: 一旦非表示で配置してサイズを測り、ビューポート下端をはみ出す場合は上向きに配置し直す
- [x] 4.5 hover close の遅延処理を、既存の `CardOverlayManager` の `HOVER_CLOSE_DELAY_MS` と同じパターンで実装する(カーソルをラベルからツールチップへ移動する猶予)
- [x] 4.6 ユニットテストを追加する(0件で非表示、1件以上でリスト表示、名前未キャッシュ時のshopIdフォールバック、リンクのhref/target、開く方向の自動判定)

## 5. 表示トグルUI

- [x] 5.1 `FilterManager`（`src/managers/FilterManager.ts`）のパネルに「住所表示」チェックボックスを追加する。初期状態は `store.getState().addressPrefetchEnabled`
- [x] 5.2 チェックボックスの `change` イベントで `store.setAddressPrefetchEnabled(checked)` を呼ぶ
- [x] 5.3 ユニットテストを追加する(初期状態の反映、クリックでフラグが更新されること)

## 6. 配線

- [x] 6.1 `CardOverlayManager.decorateCard`（`src/managers/CardOverlayManager.ts`）から `AddressLabelManager.decorateCard(shopId, card)` を呼ぶよう変更する
- [x] 6.2 `src/main.ts` で `AddressLabelManager` をインスタンス化し、`CardOverlayManager` に配線する

## 7. スタイル

- [x] 7.1 `src/ui/styles.ts` に `.ghosts-address-label`（1行省略: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` 相当、小さめのフォントサイズ）を追加する
- [x] 7.2 `.ghosts-address-label--hidden`（`display: none`）を追加する
- [x] 7.3 `.ghosts-address-tooltip` とそのリスト項目のスタイルを追加する(既存の `ghosts-popover` のトーンに合わせる)

## 8. 検証

- [x] 8.1 `npm run test` を実行し、既存テストを含めて全て通ることを確認する
- [x] 8.2 lint・型チェックを実行する
- [x] 8.3 実機（出前館サイト、Tampermonkey経由）で、住所行の表示・省略、トグルON/OFF、同一住所ホバー一覧の動作を確認する
