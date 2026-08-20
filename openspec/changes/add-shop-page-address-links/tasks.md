## 1. 住所ブロックの共通コンポーネント抽出

- [ ] 1.1 `src/ui/AddressBlock.ts` を新規作成し、`shopId` / `shopName` / `ShopDetailFetcher` を受け取って、住所表示要素・地図/検索リンク・再取得ボタンを含む要素と `load(forceRefetch: boolean): void` を返す `buildAddressBlock()` を実装する（`CardOverlayManager._buildPopover` / `_loadAddress` / `_renderAddressResult` のロジックを移植し、既存のCSSクラス名 `.ghosts-popover__address` 等をそのまま使う）
- [ ] 1.2 `CardOverlayManager` を `buildAddressBlock()` を使う形にリファクタリングし、`PopoverRefs` / `_loadAddress` / `_renderAddressResult` の重複コードを削除する
- [ ] 1.3 `CardOverlayManager.test.ts` を実行し、リファクタリングで挙動が変わっていないことを確認する（テストの追加・修正が必要なら行う）

## 2. `ShopPageManager` へのパネル拡張

- [ ] 2.1 `ShopPageManager` のコンストラクタが `ShopDetailFetcher` を受け取るように変更する
- [ ] 2.2 `_mountPanel` で `adapter.getShopName()` と `buildAddressBlock()` を使い、パネルに住所ブロックを追加し、マウント時に即座に `load(false)` を呼ぶ
- [ ] 2.3 `src/main.ts` で `ShopPageManager` のインスタンス化時に既存の `this.fetcher` を注入する

## 3. スタイル調整

- [ ] 3.1 `src/ui/styles.ts` の `.ghosts-shop-page-panel` 関連スタイルを見直し、住所テキスト・地図/検索リンク・再取得ボタンがパネル幅（12rem）内で適切に折り返し・表示されるようにする

## 4. テスト

- [ ] 4.1 `src/ui/AddressBlock.test.ts` を新規作成し、`buildAddressBlock()` の住所取得（キャッシュヒット/未キャッシュ）・再取得・エラー時表示・地図/検索リンクのhref生成を検証する
- [ ] 4.2 `ShopPageManager.test.ts` に、パネルマウント時に住所ブロックが表示されること、両方のURL形式（`/shop/menu/{shopId}` と `/shopDetail/{shopId}`）で同じ挙動になること、ページ間ナビゲーションで住所ブロックが再構築されることのテストを追加する

## 5. 動作確認・クローズ

- [ ] 5.1 `npm run build`（またはプロジェクトのビルドコマンド）でユーザースクリプトをビルドし、実際の demae-can の店舗メニューページ・店舗詳細ページで住所・地図リンク・検索リンク・再取得ボタンの表示と動作を確認する
- [ ] 5.2 GitHub issue #18 をこの変更のクローズ対象として紐付ける
