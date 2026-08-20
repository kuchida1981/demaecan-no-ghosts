## 1. プロジェクトセットアップ

- [x] 1.1 comic-viewer-helperを参考に`package.json`（TypeScript, Vite, Vitest, ESLint, Husky）を作成
- [x] 1.2 `tsconfig.json`, `vite.config.mjs`, `vitest.config.mjs`, `eslint.config.mjs`を作成
- [x] 1.3 Tampermonkeyユーザースクリプトヘッダ（`@match https://demae-can.com/*`, `@grant GM_getValue`, `@grant GM_setValue`等）を`src/header.ts`相当として作成
- [x] 1.4 `src/main.ts`エントリポイントの雛形（ページ種別判定のみ）を作成

## 2. コアロジック（DOM非依存の純粋関数、`src/logic.ts`相当）

- [x] 2.1 店舗カードの`aria-labelledby`属性またはリンクhref (`/shop/menu/{shopId}`) からshopIdを抽出する関数を実装
- [x] 2.2 `/shopDetail/{shopId}`のHTML文字列から、`h2`テキストが「住所」に一致する要素を起点に住所文字列を抽出する関数を実装
- [x] 2.3 住所からGoogleマップ検索URLを生成する関数を実装
- [x] 2.4 店舗名からGoogle検索URLを生成する関数を実装
- [x] 2.5 上記関数のユニットテストを作成（正常系・要素が見つからない異常系を含む）

## 3. Store（永続化）

- [x] 3.1 `GM_getValue`/`GM_setValue`をラップし、shopIdキーのレコード（`address`, `addressFetchedAt`, `judgment`, `judgedAt`）を読み書きするStoreを実装
- [x] 3.2 フィルタトグルのON/OFF状態を読み書きするStoreの拡張を実装
- [x] 3.3 Storeの状態変更をリスナーに通知する仕組み（comic-viewer-helperの`Store.subscribe`相当）を実装
- [x] 3.4 Storeのユニットテストを作成（モックストレージを使用）

## 4. ページAdapter

- [x] 4.1 一覧ページ（トップページ・カテゴリページ）用Adapter: 店舗カードコンテナの取得、既存カード一覧の取得
- [x] 4.2 店舗ページ（`/shop/menu/{shopId}`）用Adapter: 現在のshopIdとh1店舗名の取得

## 5. ShopDetailFetcher

- [x] 5.1 `/shopDetail/{shopId}`への`fetch`実装（失敗時はエラーを返す）
- [x] 5.2 取得したHTMLをレスポンステキストとして2.2の抽出関数に渡し、住所を得るパース処理を実装
- [x] 5.3 Storeキャッシュを確認し、未取得時のみfetchするオンデマンド取得ロジックを実装
- [x] 5.4 キャッシュを無視して再取得する`refetch`メソッドを実装
- [ ] 5.5 `fetch`が動作しない場合に備え、`GM_xmlhttpRequest`へのフォールバックを検証・実装（design.mdのOpen Questions参照）— 未実施。同一オリジンfetchはjsdomシミュレーションでは問題なく動作したが、実際のTampermonkey環境・出前館のCSPヘッダ配下での動作確認がまだのため、フォールバック実装は保留

## 6. CardOverlayManager（一覧ページ）

- [x] 6.1 一覧コンテナに対する`MutationObserver`を設置し、追加された店舗カードを検知する処理を実装
- [x] 6.2 各店舗カードに情報アイコンを注入する処理を実装（初期カード・動的追加カード両方に適用）
- [x] 6.3 アイコンのhover（pointer可能デバイス）/click（タッチデバイス含む全デバイス）でポップオーバーを開閉する処理を実装
- [x] 6.4 ポップオーバー内に店舗名・住所・Googleマップリンク・Google検索リンクを表示する処理を実装（ShopDetailFetcher連携、ローディング/エラー状態を含む）
- [x] 6.5 ポップオーバー内に再取得ボタンを実装（5.4のrefetchを呼び出す）

## 7. JudgmentManager

- [x] 7.1 カードポップオーバー内に「ゴースト」「実店舗」「判定解除」の操作UIを実装
- [x] 7.2 店舗ページ内に同等の判定操作UIを実装
- [x] 7.3 判定操作からStoreへの書き込み処理を実装
- [x] 7.4 店舗カードに判定バッジ（ghost/not-ghost）を描画する処理を実装（Store変更を購読して再描画）

## 8. FilterManager

- [x] 8.1 一覧ページにフィルタON/OFFトグルUIを実装し、Storeの永続状態と同期
- [x] 8.2 トグルON時に`ghost`判定済みカードを非表示にし、OFF時に再表示するロジックを実装
- [x] 8.3 動的追加カードおよび判定変更時にフィルタ結果を即時反映する処理を実装（6.1のMutationObserver・7.3のStore変更を購読）

## 9. 動作確認

- [x] 9.1 lint/type-check/testを実行し全て成功（`npx eslint src --max-warnings 0` / `npx tsc` / `npx vitest run --coverage`）。ビルド（`npm run build`）も成功
- [x] 9.2 実サイトのHTMLスナップショット（toppage.html, genre-page.html, shop-detail.html, shop-toppage.html）をjsdomに読み込み、ビルド済みuser.jsを実行して確認: アイコン/バッジ注入（トップ115件・ジャンル100件全件）、ポップオーバーでの住所取得（実shop-detail.htmlの構造から正しく抽出）・地図リンク生成、判定操作とバッジ更新、フィルタON時の非表示、MutationObserverによる動的カード追従、店舗ページの判定パネル表示 — 全て確認
- [ ] 9.3 実際のTampermonkey＋実ブラウザ（デスクトップhover操作・モバイル相当のタッチ操作）での確認は未実施。jsdomでのシミュレーションでは代替できないため、ユーザーによる実機確認が必要
