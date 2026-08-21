## Context

`add-address-prefetch-cache`（マージ済み）により、`Store` には店舗ごとの `name`・`address` がキャッシュされ、`addressPrefetchEnabled` フラグと `PrefetchQueue` によって一覧カード検出時に穏やかに住所が集まってくる基盤ができている。`normalizeAddress` と `Store.getShopIdsByNormalizedAddress` により、正規化住所での逆引きも可能。

今回はこの基盤を使って、issue #26 の残り3点（住所常時表示、表示トグル、同一住所ホバー一覧）をUIとして実装する。exploreモードでの対話で以下が既に決まっている:
- 対象カードは `article[aria-labelledby^="shoplist-"]` のみ。カルーセル（リンクベースのフォールバックカード）は対象外
- 出前館側のDOM調査により、`aria-labelledby` の値がそのまま店名 `<p>` 要素の `id` になっており、`document.getElementById` で正確に店名要素を特定できることを確認済み。その親は `flex flex-col gap-1`（縦積み）
- 表示トグルは新規フラグを作らず、既存の `addressPrefetchEnabled` をそのまま流用する
- ホバー一覧は0件なら何も出さない、各店名は新規タブリンク、店名未キャッシュ時はshopIdフォールバック、開く方向は画面内に収まるよう自動判定

## Goals / Non-Goals

**Goals:**
- 一覧カードの店名直下に、キャッシュ済みの住所を1行・省略表示で常時表示する
- 表示トグル（既存フラグ流用）で住所行の表示/非表示を切り替えられる
- 住所行のホバー/クリックで、同一正規化住所を持つ他店舗の店名一覧を、画面内に収まる方向にツールチップ表示する

**Non-Goals:**
- カルーセル（リンクベースカード）への住所表示
- 住所正規化ロジック自体の精度向上
- 先読みキューの挙動変更(既存のまま)

## Decisions

### 1. 店名要素の特定は新規アダプタメソッドで行う

`ListingAdapter` に `extractShopNameElement(card: HTMLElement): HTMLElement | null` を追加する。実装は `aria-labelledby` の値で `document.getElementById` するだけ。`aria-labelledby` を持たないカード（カルーセル）では `null` を返し、呼び出し側はその場合は住所行を追加しない。

既存の `extractShopName`（文字列を返す）とは別メソッドにする。文字列版は popover の店名表示に使われ続けるため、責務を分けて既存の挙動に影響を与えない。

### 2. 住所行の挿入・更新は新規クラス `AddressLabelManager` が担当する

`CardOverlayManager` に機能を足すのではなく、責務ごとに小さいクラスに分ける既存の設計方針（`FilterManager`, `JudgmentManager` など）に倣い、新規クラス `AddressLabelManager` を追加する。

- `CardOverlayManager.decorateCard` は既存どおり `PrefetchQueue.enqueue` と popover の構築を行い、追加で `AddressLabelManager.decorateCard(shopId, card)` を呼ぶ（`onDecorate` コールバックではなく、`CardOverlayManager` 内で直接呼ぶ形にする。理由: 店名要素の特定にアダプタが必要で、`onDecorate` コールバックには `card` しか渡っておらず店名要素を二重に探索することになるため）。
- `AddressLabelManager.decorateCard(shopId, card)`:
  1. `adapter.extractShopNameElement(card)` で店名要素を取得。`null` なら何もしない
  2. `<p class="ghosts-address-label">` を作成し、店名要素の直後に `insertAdjacentElement('afterend', ...)` で挿入
  3. `store.getShopRecord(shopId)?.address` があれば即座にテキストを設定、なければ空のまま
  4. `store.subscribe` で該当 shopId のレコード更新を監視し、住所が後から埋まったら（先読み完了時など）テキストを更新する
  5. 表示/非表示は `store.getState().addressPrefetchEnabled` を初期反映し、以後は同じ `subscribe` コールバック内でフラグの変化も見て `ghosts-address-label--hidden` 相当のクラスを切り替える

`store.subscribe` は全レコード更新のたびに呼ばれる粒度の粗い通知だが、既存の `FilterManager._applyAll` も同じパターンで「全登録カードを毎回チェックし直す」設計なので、それに倣う（対象店舗数はユーザースクリプトのローカル規模であり、性能上の懸念は小さいと判断）。

### 3. 表示トグルは `FilterManager` のチェックボックス群に追加する

`FilterManager` の `JUDGMENT_CHECKBOX_LABELS` パネルに「住所表示」チェックボックスを追加する。クリックで `store.setAddressPrefetchEnabled(checked)` を呼ぶだけで、`AddressLabelManager` 側は上記の `store.subscribe` で変化を検知して自律的に表示/非表示を切り替えるので、`FilterManager` から `AddressLabelManager` への直接の参照は不要（`Store` を介した疎結合）。

初期チェック状態は `store.getState().addressPrefetchEnabled`（デフォルト `true`）を反映する。

### 4. 同一住所ホバー一覧のツールチップ

`AddressLabelManager` が住所行に `mouseenter`/`mouseleave`（hover対応、既存の `CardOverlayManager` と同じ `supportsHover()` 判定を再利用）と `click`（タッチ対応）を配線する。

- 開くたびに `normalizeAddress(record.address)` → `store.getShopIdsByNormalizedAddress(...)` で shopId 一覧を取得し、自分自身の shopId を除外
- 0件なら何もしない（ツールチップを作らない）
- 1件以上あれば、`<div class="ghosts-address-tooltip">` を構築。各エントリは `<a>`（`store.getShopRecord(otherId)?.name` があればそれを、なければ `otherId` をテキストに、`href` は `/shop/menu/{otherId}`、`target="_blank"` `rel="noopener noreferrer"`）
- 開く方向の自動判定: 一旦 `visibility: hidden` で下向きに配置してサイズを測り、`getBoundingClientRect()` でビューポート下端をはみ出す場合は上向きに配置し直してから表示する（`popover` の固定配置と異なり、カードが一覧のどこにあるかで上下の余裕が変わるため動的判定が必要）

ホバーで開いた場合は、`CardOverlayManager` の popover と同様に、アイコンからツールチップへカーソルを移動する猶予を持たせるため、短い遅延を挟んでから閉じる（既存の `HOVER_CLOSE_DELAY_MS` と同じパターンを踏襲）。

### 5. 新しい住所→URLヘルパー

`buildShopDetailUrl`（`/shopDetail/{shopId}`、fetch専用）とは別に、ツールチップのリンク先として `/shop/menu/{shopId}` を組み立てる `buildShopMenuUrl(shopId)` を `logic.ts` に追加する。

## Risks / Trade-offs

- **[Risk]** `aria-labelledby` の値からの `id` 参照は出前館側のマークアップ変更で壊れうる。 → **Mitigation**: 既存の `extractShopIdFromCard` も同じ属性に依存しており、壊れる時は既に他の機能も壊れているはずなので、追加のリスクは小さい。
- **[Risk]** 住所が先読み中でまだキャッシュされていないカードは、初回訪問時に住所行が空のまま(または非表示)になり、UXとして「何も出ていない」ように見える。 → **Mitigation**: プレースホルダー文言は出さず、先読み完了次第 `store.subscribe` 経由で自然に埋まる仕様とする。初回訪問時の体感は許容し、再訪時にはキャッシュ済みのため即座に表示される。
- **[Risk]** `store.subscribe` は住所以外の更新（判定変更など）でも毎回全カードの再チェックを走らせるため、カード数が多いページでは無駄な走査が発生する。 → **Mitigation**: 既存の `FilterManager` も同じ設計であり、実測で問題になったことはない。将来的に気になれば `shopId` ごとの差分検知に最適化できる。
- **[Trade-off]** ツールチップの開閉・位置調整ロジックが `AddressLabelManager` に新規実装され、既存の popover 実装とロジックが重複する（hover遅延、outside-click close 等）。共通化はコストに見合わないと判断し、素直に重複を許容する。

## Migration Plan

- 既存データへの影響なし。`ShopRecord` のスキーマ変更なし（`add-address-prefetch-cache` で追加済みの `name`/`address` をそのまま使う）。
- ロールバックは通常のコード変更のロールバックと同様。

## Open Questions

- 住所行のフォントサイズ・色などの具体的なスタイル値は実装時に既存の `ghosts-popover__address`（0.75rem）を参考に決める。
