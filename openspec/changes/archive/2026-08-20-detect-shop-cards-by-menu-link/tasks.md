## 1. リンク起点のカード検出

- [x] 1.1 `src/adapters/ListingAdapter.ts`に`findLinkCardRoot(anchor): HTMLElement | null`を追加する（リンクの祖先を`LINK_CARD_MAX_CLIMB`階層まで辿り、直近で`<img>`を子孫に持つ要素を返す）
- [x] 1.2 `getLinkBasedShopCards(container): HTMLElement[]`を追加する。`SHOP_LINK_SELECTOR`でリンクを列挙し、`anchor.closest(SHOP_CARD_SELECTOR)`が存在するものはスキップし、残りに`findLinkCardRoot`を適用して重複のないカード要素リストを返す
- [x] 1.3 `isLinkCardRoot(el): boolean`を追加する。`el`内の店舗詳細リンクに`findLinkCardRoot`を適用した結果が`el`自身と一致するかどうかで判定する
- [x] 1.4 `DemaecanListingAdapter.getShopCards`が既存の`SHOP_CARD_SELECTOR`による検出結果と`getLinkBasedShopCards`の結果を結合して返すようにする
- [x] 1.5 `DemaecanListingAdapter.matchesShopCard`が`el.matches(SHOP_CARD_SELECTOR) || isLinkCardRoot(el)`を返すようにする

## 2. テスト

- [x] 2.1 `src/adapters/ListingAdapter.test.ts`に、`<img>`とリンクを持つ`<div>`ベースのカード（過去に注文したお店セクションを模したマークアップ）が`getShopCards`で検出されることを検証するテストを追加する
- [x] 2.2 `article[aria-labelledby^="shoplist-"]`カード内のリンクが、リンク起点の検出で二重にカウントされないことを検証するテストを追加する
- [x] 2.3 `matchesShopCard`が、div型カードのルート要素に対して`true`を返し、その子孫要素（画像divやテキストdivなど）に対しては`false`を返すことを検証するテストを追加する
- [x] 2.4 `<img>`を子孫に持つ祖先が見つからない（`LINK_CARD_MAX_CLIMB`を超える、またはページ末尾まで到達する）リンクは、カードとして検出されないことを検証するテストを追加する

## 3. 仕上げ

- [x] 3.1 `npm test`を実行し全テストが通ることを確認する
- [x] 3.2 `npm run lint`・`npx tsc --noEmit`を実行し問題がないことを確認する
- [x] 3.3 `npm run build`を実行しビルドできることを確認する
- [x] 3.4 実機（出前館サイト）で、「過去に注文したお店」セクションのカードに情報アイコンが表示され、判定・フィルタが機能することを確認する。あわせて「〜〜付近の店舗ランキング」セクションで二重表示や既存動作の劣化がないことも確認する — 表示位置がずれる不具合を発見（4章参照）

## 4. アイコン表示位置の修正

- [x] 4.1 実機フィードバックで判明した、`findLinkCardRoot`が星評価アイコン等の装飾`<img>`に反応して本来より内側のdivで停止してしまう問題を修正する（`static-assets/images/`配下の画像を除外し、`files/imgix/`配下の実店舗写真のみを対象にする）
- [x] 4.2 `src/adapters/ListingAdapter.test.ts`に、装飾アイコンをスキップして実店舗写真を含む祖先まで正しく遡ることを検証するテストを追加する
- [x] 4.3 実機で再度、「過去に注文したお店」セクションのアイコン表示位置が正しくなったことを確認する — 確認済み、問題なし
