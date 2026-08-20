## 1. Route watcher

- [x] 1.1 `src/route-watcher.ts` を新規作成し、`onRouteChange(callback: (url: string) => void): void` を実装する（`history.pushState`/`replaceState`をパッチして`locationchange`カスタムイベントをdispatch、`popstate`をリッスン、1秒間隔のポーリングをフォールバックとして持つ）
- [x] 1.2 `history.pushState`/`replaceState`への二重パッチを防ぐガードを入れる
- [x] 1.3 `src/route-watcher.test.ts` を作成し、`pushState`呼び出し・`popstate`発火・ポーリングによるフォールバックそれぞれでコールバックが呼ばれることを検証する

## 2. ShopPageManager

- [x] 2.1 `src/managers/ShopPageManager.ts` を新規作成し、既存の`CardOverlayManager`/`FilterManager`と同様に`init()`を持つmanagerクラスとして実装する
- [x] 2.2 `init()`内で`route-watcher`を購読し、現在のURLで初回同期を行う
- [x] 2.3 URL変化のたびに`DemaecanShopPageAdapter.match`/`extractShopId`で判定し、以下を行う: (a) 未表示→表示対象なら`JudgmentManager.mountBadge`/`createControls`でパネルを構築・DOM追加、(b) 表示中のshopIdと異なる対象への変化なら既存パネルを除去してから新しいshopIdで再構築、(c) 表示対象でなくなったら既存パネルをDOMから除去、(d) 同一shopIdのまま変化がなければ何もしない
- [x] 2.4 `src/managers/ShopPageManager.test.ts` を作成し、2.3の分岐（初回表示/除去/shopId切り替え/変化なし）をそれぞれ検証する

## 3. main.ts への統合

- [x] 3.1 `src/main.ts`の`App._initShopPage`とその一度きりの呼び出しを削除し、`ShopPageManager`のインスタンス化・`init()`呼び出しに置き換える
- [x] 3.2 既存の`openspec/specs/ghost-shop-judgment/spec.md`の「Judgment input from shop page」要件が本changeのdelta spec通りに満たされることを手動確認する（一覧→店舗ページ→一覧のSPA遷移を実機で確認）— `/shop/menu/{shopId}`で確認済み、問題なし

## 4. 仕上げ

- [x] 4.1 `npm test`（vitest）を実行し全テストが通ることを確認する
- [x] 4.2 `npm run build`相当のビルドを実行し、ユーザースクリプトとして問題なくビルドできることを確認する

## 5. `/shopDetail/{shopId}/{areaId}` への対応拡張

- [x] 5.1 `src/logic.ts`の`extractShopIdFromShopPageUrl`に`/shopDetail/{shopId}`パターンのマッチを追加する
- [x] 5.2 `src/logic.test.ts`・`src/adapters/ShopPageAdapter.test.ts`を更新し、shopDetail URLでも判定UIの対象になることを検証する
- [x] 5.3 `/shopDetail/{shopId}/{areaId}`ページで判定UIが表示されることを実機で確認する — 確認済み、問題なし
