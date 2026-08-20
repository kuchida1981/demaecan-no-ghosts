## Why

店舗一覧のフィルタは「ゴースト店舗を非表示」のON/OFF1種類のみ（`filterEnabled: boolean`）で、judgment は `'ghost' | 'not-ghost' | undefined(未評価)` の3値あるにもかかわらず絞り込み軸が1つしかない。実際に運用してみるとゴースト店舗の絶対数が思ったより少なく見え、実店舗・未評価もあわせて絞り込めないと判定状況の全体像を把握しにくい（イシュー #16）。

## What Changes

- フィルタパネルのUIを、単一チェックボックス（ゴースト店舗を非表示）から、ゴースト/実店舗/未評価を個別にON/OFFできるチェックボックス3つに変更する。デフォルトは全選択（現状と同じく全件表示）。
- **BREAKING**: `StoreState.filterEnabled: boolean` を `visibleJudgments: { ghost: boolean; notGhost: boolean; unjudged: boolean }` に置き換える。
- **BREAKING**: 永続化キーを新設（`VISIBLE_JUDGMENTS`）し、旧キー（`FILTER_ENABLED`）は読み書きしない。旧設定値は引き継がず、新規ユーザーと同様に全選択で開始する。
- `shouldHideCard` のシグネチャを、boolean1つを受け取る形から `visibleJudgments` オブジェクトを受け取る形に変更する。

## Capabilities

### New Capabilities
(なし)

### Modified Capabilities
- `ghost-shop-filter`: フィルタの絞り込み軸を「ゴースト非表示のON/OFF」から「ゴースト/実店舗/未評価を個別に表示切り替え」に変更する。関連する要件（トグルコントロール、表示/非表示の判定条件、永続化）をすべて3値対応の形に書き換える。

## Impact

- `src/types.ts`: `StoreState.filterEnabled` → `visibleJudgments` 型の追加・置き換え。
- `src/store.ts`: `STORAGE_KEYS.FILTER_ENABLED` を使わなくなり `VISIBLE_JUDGMENTS` を新設。`setFilterEnabled` を廃止し、3値を個別に切り替えるAPIに置き換え。
- `src/logic.ts`: `shouldHideCard` のシグネチャ変更。
- `src/managers/FilterManager.ts`: パネルUIをチェックボックス1つから3つに変更。
- 既存テスト `src/store.test.ts`, `src/managers/FilterManager.test.ts`, `src/logic.test.ts` の更新が必要。
