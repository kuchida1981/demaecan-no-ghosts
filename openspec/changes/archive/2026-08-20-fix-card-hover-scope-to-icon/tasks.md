## 1. 実装

- [x] 1.1 `src/managers/CardOverlayManager.ts`の`_wireEvents`内、`card.addEventListener('mouseenter', open)`/`card.addEventListener('mouseleave', close)`を`icon`要素への貼り付けに変更する

## 2. テスト

- [x] 2.1 `src/managers/CardOverlayManager.test.ts`の既存テスト「opens and closes the popover on hover when the device supports hover」を、`card.dispatchEvent`ではなく`icon.dispatchEvent`でmouseenter/mouseleaveを発火する形に更新する
- [x] 2.2 カードのアイコン以外の部分（例: カード要素自体）へのmouseenterではポップオーバーが開かないことを検証するテストを追加する

## 3. 仕上げ

- [x] 3.1 `npm test`を実行し全テストが通ることを確認する
- [x] 3.2 `npm run lint`・`npx tsc --noEmit`を実行し問題がないことを確認する
- [x] 3.3 `npm run build`を実行しビルドできることを確認する
- [x] 3.4 実機（出前館サイト）で、カード右上のアイコンにマウスオーバーしたときのみポップオーバーが開くことを確認する — 確認済み、問題なし
