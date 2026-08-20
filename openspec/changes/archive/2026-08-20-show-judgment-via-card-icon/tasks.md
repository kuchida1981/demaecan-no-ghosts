## 1. JudgmentManager

- [x] 1.1 `src/managers/JudgmentManager.ts`に`icons: Map<ShopId, HTMLElement[]>`フィールドを追加する
- [x] 1.2 `mountIcon(shopId: ShopId, icon: HTMLElement): void`を追加し、`_registerList`で登録後、判定状態に応じたグリフ（👻/🏠/`i`）を反映する
- [x] 1.3 `_renderAll`に`icons`の再描画ループを追加する
- [x] 1.4 `src/managers/JudgmentManager.test.ts`に`mountIcon`のテスト（初期描画・判定変更での更新・複数登録）を追加する

## 2. CardOverlayManager

- [x] 2.1 `src/managers/CardOverlayManager.ts`の`_buildPopover`で、`icon`生成後に`this.judgmentManager.mountIcon(shopId, icon)`を呼び出す（`icon.textContent = 'i'`の直接指定を削除）
- [x] 2.2 `decorateCard`から`this.judgmentManager.mountBadge(shopId)`の呼び出しと`card.append`へのbadge追加を削除する
- [x] 2.3 `src/managers/CardOverlayManager.test.ts`を更新し、カードに`.ghosts-badge`が追加されないこと、判定済みの場合に`.ghosts-icon-btn`のtextContentが対応するグリフになることを検証する

## 3. 仕上げ

- [x] 3.1 `npm test`を実行し全テストが通ることを確認する
- [x] 3.2 `npm run lint`・`npx tsc --noEmit`を実行し問題がないことを確認する
- [x] 3.3 `npm run build`を実行しビルドできることを確認する
- [x] 3.4 実機（出前館サイト）で、判定に応じてカード右上のアイコンが👻/🏠/iに切り替わること、左上のバッジが表示されないこと、店舗ページのパネルのバッジ表示は変わらないことを確認する — アイコン表示自体はOK、視認性の懸念あり（4章参照）

## 4. 視認性の追加調整

- [x] 4.1 実機確認のフィードバックを受け、`src/ui/styles.ts`の`.ghosts-icon-btn`のサイズ（1.5rem→2rem）・font-size（0.8125rem→1.125rem）を拡大し、`.ghosts-popover`の`top`オフセットを追従調整する
- [x] 4.2 実機フィードバックで判明した、`font-style: italic`が絵文字に適用され歪んで見えていた問題を修正する（`.ghosts-icon-btn--info`修飾クラスに切り出し、未評価時のみ適用）
- [x] 4.3 実機で再度、絵文字アイコンの視認性が改善したことを確認する — 確認済み、問題なし
