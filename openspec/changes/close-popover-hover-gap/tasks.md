## 1. 隙間を埋める

- [ ] 1.1 `src/ui/styles.ts`の`.ghosts-popover`の`top`を`2.625rem`から、アイコン下端（`0.375rem + 2rem = 2.375rem`）に密着する値に変更する
- [ ] 1.2 `npm test`・`npm run lint`・`npx tsc --noEmit`・`npm run build`を実行し問題がないことを確認する
- [ ] 1.3 実機（出前館サイト）で、アイコンをホバーで開いたポップオーバーへカーソルを移動し、地図/検索リンク・住所を再取得ボタン・ゴースト/実店舗/解除ボタンをクリックで操作できることを確認する

## 2. 追加調整（1.3で問題が残った場合のみ）

- [ ] 2.1 `src/managers/CardOverlayManager.ts`の`_wireEvents`で、ポップオーバー自体にも`mouseenter`/`mouseleave`を貼り、アイコン・ポップオーバーいずれかにカーソルがある間は開いたままになるよう状態管理を調整する
- [ ] 2.2 `src/managers/CardOverlayManager.test.ts`に、ポップオーバーへのホバーで開いたままになることを検証するテストを追加する
- [ ] 2.3 `npm test`・`npm run lint`・`npx tsc --noEmit`・`npm run build`を再度実行し問題がないことを確認する
- [ ] 2.4 実機で再度、ポップオーバーの操作性を確認する
