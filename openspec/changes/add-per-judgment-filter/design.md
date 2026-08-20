## Context

現状、`StoreState.filterEnabled: boolean` が「ゴースト店舗を非表示にするか」のみを表現しており、`ShopRecord.judgment: 'ghost' | 'not-ghost' | undefined` の3値のうち1値しか絞り込みに使えていない（イシュー #16）。`shouldHideCard`（`src/logic.ts`）、永続化キー（`src/store.ts` の `FILTER_ENABLED`）、パネルUI（`src/managers/FilterManager.ts`）の3箇所が連動して動いており、この変更ではこの3箇所を「ゴースト/実店舗/未評価を個別にON/OFFできる」形に揃えて書き換える。

## Goals / Non-Goals

**Goals:**
- ゴースト/実店舗/未評価を独立した3つのチェックボックスで表示・非表示切り替えできるようにする。
- デフォルト（初回起動・ストレージ未設定時）は全選択（現状と同じ全件表示）。
- 既存の judgment 判定ロジック・バッジ・アイコン表示には手を入れない。

**Non-Goals:**
- ゴースト判定アルゴリズム自体の変更。
- 旧設定値（`FILTER_ENABLED`）からのマイグレーション。全ユーザー一律で全選択にリセットする。
- フィルタパネル以外のUI（店舗詳細ページのオーバーレイ等）の変更。

## Decisions

### 1. `visibleJudgments` オブジェクトで3値を表現する

`filterEnabled: boolean` を `visibleJudgments: { ghost: boolean; notGhost: boolean; unjudged: boolean }` に置き換える。

代替案として `Set<Judgment | 'unjudged'>` も検討したが、GM_setValue に文字列として保存する際 `JSON.stringify` の対象にしやすく、チェックボックスの状態とも1対1対応しやすいプレーンオブジェクトを採用する。

### 2. `shouldHideCard` は record を3値のキーに正規化してから判定する

```ts
function judgmentKey(record: ShopRecord | undefined): keyof VisibleJudgments {
  if (record?.judgment === 'ghost') return 'ghost';
  if (record?.judgment === 'not-ghost') return 'notGhost';
  return 'unjudged';
}

function shouldHideCard(record: ShopRecord | undefined, visibleJudgments: VisibleJudgments): boolean {
  return !visibleJudgments[judgmentKey(record)];
}
```

判定ロジックを1関数に閉じ込めることで、`FilterManager` 側は record を意識せず `visibleJudgments` を渡すだけで済む。

### 3. 永続化キーを新設し、旧キーは無視する

`STORAGE_KEYS.VISIBLE_JUDGMENTS` を新設し、値は `JSON.stringify({ghost, notGhost, unjudged})` で保存する。読み込み時は `_loadShopRecords` と同じ try/catch パターンで、未設定・parse失敗時は `{ ghost: true, notGhost: true, unjudged: true }` にフォールバックする。

`STORAGE_KEYS.FILTER_ENABLED` は削除せず定数としては残さない（未使用になる）。既存ユーザーの古い値は読みにも書きにも使わず、実質的に放置する。ユーザー数が少ない個人用スクリプトであり、初回起動時と同じ「全選択」に一度リセットされることは許容範囲と判断（要件確認済み）。

### 4. store の更新APIは単一キートグル方式にする

`setFilterEnabled(enabled: boolean)` を廃止し、`toggleJudgmentVisibility(key: keyof VisibleJudgments, visible: boolean): void` を新設する。3つのチェックボックスはそれぞれ独立してON/OFFされるため、呼び出し側（`FilterManager`）が現在の全体状態をマージする必要がなく、単一キー更新の方がシンプルになる。

### 5. FilterManager のパネルUIは横並び3チェックボックス、ラベルは短縮形

「ゴースト」「実店舗」「未評価」の3ラベル・3チェックボックスを横並びで配置する（既存の `.ghosts-filter-panel` の flex レイアウトをそのまま流用）。各チェックボックスの `change` イベントで `store.toggleJudgmentVisibility(key, checkbox.checked)` を呼ぶ。`store.subscribe` による再描画（`_applyAll`）も3チェックボックス分のチェック状態を同期する。

## Risks / Trade-offs

- [旧 `FILTER_ENABLED` の値が引き継がれず、既存ユーザーの「ゴースト非表示」設定が一度失われる] → 設計判断として許容（Decision 3）。影響は軽微（個人用スクリプト、再設定はチェックボックス1クリック）。
- [`STORAGE_KEYS.FILTER_ENABLED` に対応するストレージ値がゴミとして残り続ける] → GM storage のクリーンアップは行わない。実害はなく、削除コストの方が高いため許容。
- [3チェックボックスにより横並びパネルの幅が増える] → ラベルを短縮形にすることで許容範囲に収める（要件確認済み）。

## Migration Plan

マイグレーションコードは書かない。デプロイ後、既存ユーザーは次回ページロード時から新キー未設定として扱われ、フィルタ状態は全選択（全件表示）から開始する。ロールバックは通常のリリース取り消しと同様（旧バージョンに戻せば旧キーがそのまま再度参照される）。
