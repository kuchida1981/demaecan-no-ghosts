## 1. 型定義

- [x] 1.1 `src/types.ts` に `VisibleJudgments` 型（`{ ghost: boolean; notGhost: boolean; unjudged: boolean }`）を追加する

## 2. 判定ロジック

- [x] 2.1 `src/logic.ts` に `judgmentKey(record)` を追加し、record の judgment を `'ghost' | 'notGhost' | 'unjudged'` に正規化する
- [x] 2.2 `src/logic.ts` の `shouldHideCard` のシグネチャを `(record, visibleJudgments: VisibleJudgments) => boolean` に変更し、`judgmentKey` を使って判定する
- [x] 2.3 `src/logic.test.ts` の `shouldHideCard` のテストを新シグネチャに更新し、ghost/not-ghost/unjudged 各カテゴリの表示・非表示パターンを網羅する

## 3. ストア

- [x] 3.1 `src/store.ts` の `STORAGE_KEYS` に `VISIBLE_JUDGMENTS` を追加する（`FILTER_ENABLED` は残置し、読み書きしない）
- [x] 3.2 `StoreState.filterEnabled` を `visibleJudgments: VisibleJudgments` に置き換える
- [x] 3.3 コンストラクタで `visibleJudgments` を読み込む処理を追加する。未設定または parse 失敗時は `{ ghost: true, notGhost: true, unjudged: true }` にフォールバックする（`_loadShopRecords` の try/catch パターンを踏襲）
- [x] 3.4 `setFilterEnabled` を削除し、`toggleJudgmentVisibility(key: keyof VisibleJudgments, visible: boolean): void` を追加する。状態を更新し `GM_setValue(STORAGE_KEYS.VISIBLE_JUDGMENTS, JSON.stringify(...))` で永続化し、購読者に通知する
- [x] 3.5 `src/store.test.ts` を新しい状態形・API（`visibleJudgments`, `toggleJudgmentVisibility`）に合わせて更新する

## 4. フィルタパネルUI

- [x] 4.1 `src/managers/FilterManager.ts` の `_mountPanel` を、チェックボックス1つから「ゴースト」「実店舗」「未評価」の3チェックボックス（横並び）に変更する
- [x] 4.2 各チェックボックスの `change` イベントで対応する `store.toggleJudgmentVisibility(key, checkbox.checked)` を呼ぶ
- [x] 4.3 `_applyAll` で3チェックボックス全ての `checked` 状態を `store.getState().visibleJudgments` から同期する
- [x] 4.4 `_applyCard` で `shouldHideCard(record, store.getState().visibleJudgments)` を呼ぶよう更新する
- [x] 4.5 `src/managers/FilterManager.test.ts` を3チェックボックスの構成に合わせて更新する

## 5. 検証

- [x] 5.1 `npm test`（または相当のテストコマンド）を実行し全テストが通ることを確認する
- [x] 5.2 ビルド後、実際のページでチェックボックス3つの表示切り替え・永続化・動的追加カードへの適用を目視確認する
