## 1. 隙間を埋める

- [x] 1.1 `src/ui/styles.ts`の`.ghosts-popover`の`top`を`2.625rem`から、アイコン下端（`0.375rem + 2rem = 2.375rem`）に密着する値に変更する
- [x] 1.2 `npm test`・`npm run lint`・`npx tsc --noEmit`・`npm run build`を実行し問題がないことを確認する
- [x] 1.3 実機（出前館サイト）で、アイコンをホバーで開いたポップオーバーへカーソルを移動し、地図/検索リンク・住所を再取得ボタン・ゴースト/実店舗/解除ボタンをクリックで操作できることを確認する — 隙間ゼロだけでは不十分（消えてしまう・シビアすぎる）と判明、2章の追加調整を実施

## 2. 追加調整（1.3で問題が残ったため実施）

- [x] 2.1 `src/managers/CardOverlayManager.ts`の`_wireEvents`で、ポップオーバー自体にも`mouseenter`/`mouseleave`を貼り、アイコン・ポップオーバーいずれかにカーソルがある間は開いたままになるよう状態管理を調整する。「離れたら即座に閉じる」のではなく、`HOVER_CLOSE_DELAY_MS`(250ms)の遅延クローズにし、遅延中にアイコンまたはポップオーバーへ再度カーソルが入ればキャンセルする
- [x] 2.2 `src/managers/CardOverlayManager.test.ts`に、ポップオーバーへのホバーで開いたままになることを検証するテストを追加する
- [x] 2.3 `npm test`・`npm run lint`・`npx tsc --noEmit`・`npm run build`を再度実行し問題がないことを確認する
- [x] 2.4 実機で再度、ポップオーバーの操作性を確認する — 確認済み、問題なし
