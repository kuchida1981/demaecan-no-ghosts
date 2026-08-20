## Why

店舗一覧の店舗カードでは、現在ゴースト/実店舗の判定結果をカード左上のテキストバッジ（「ゴースト」/「実店舗」）で表示している。一方、出前館サイト側は「クーポンあり」などのバッジをカード上に表示することがあり、今後どの位置に追加されても衝突しにくいよう、カード上の独自表示を最小限（右上の情報アイコン1つ）に集約したい（GitHub Issue #4）。

## What Changes

- 店舗一覧カードの右上に表示している情報アイコンの絵柄を、判定状態に応じて出し分ける。
  - ゴースト判定済み → 👻
  - 実店舗判定済み → 🏠
  - 未評価 → `i`（現状維持）
- 店舗一覧カード左上のテキストバッジ（`.ghosts-badge`）表示を廃止する。
- 店舗ページ（`/shop/menu/{shopId}`・`/shopDetail/{shopId}/{areaId}`）のゴースト判定パネルに表示しているバッジは変更しない（カード上の表示とは別の文脈であり、他サイト要素との衝突リスクがないため）。

## Capabilities

### New Capabilities
(なし)

### Modified Capabilities
- `ghost-shop-judgment`: 「Card badge reflects stored judgment」要件を、店舗一覧カード上ではテキストバッジではなく情報アイコンの絵柄で判定状態を表すように変更する。

## Impact

- `src/managers/JudgmentManager.ts`: アイコン要素を判定状態に応じて再描画する仕組み（`mountIcon`）を追加する。
- `src/managers/CardOverlayManager.ts`: `decorateCard`で`mountBadge`の呼び出し・バッジのDOM追加をやめ、`_buildPopover`で作成する`icon`要素を`JudgmentManager.mountIcon`に登録する。
- `src/ui/styles.ts`: `.ghosts-badge`関連スタイルは店舗ページパネルでの利用のため残す。カード側の見た目調整が必要であれば`.ghosts-icon-btn`のスタイルを微調整する。
