## Why

出前館のショップページ (`/shop/menu/{shopId}`) はSPA遷移で表示されるため、店舗一覧からクリック遷移した直後はゴースト店舗判定パネルが表示されず、逆に判定パネル表示中に一覧へ戻ってもパネルが残り続ける。判定はこのユーザースクリプトの中核機能であり、店舗ページで判定操作ができない・不要な画面に判定UIが残るのはユーザー体験上の欠陥であるため修正する（GitHub Issue #5）。

あわせて、住所などが載っている店舗詳細ページ (`/shopDetail/{shopId}/{areaId}`) でも判定UIを利用したいという要望があったため、対象URLパターンを拡張する。

## What Changes

- SPAのルート変更（`history.pushState`/`replaceState`/`popstate`、およびそれらで捕捉できないケースへのポーリングによるフォールバック）を検知する仕組みを追加する。
- ルート変更のたびに、現在のURLがショップページ (`/shop/menu/{shopId}` または `/shopDetail/{shopId}/{areaId}`) にマッチするかを再評価し、判定パネルの表示/非表示を同期させる。
  - マッチする場合: パネルが未表示なら新しいshopIdで表示する。すでに表示されていて対象shopIdが変わった場合は、そのshopIdの内容に更新する。
  - マッチしない場合: パネルが表示されていれば除去する。
- 初回ロード時の一度きりの判定という現行の仕組み（`main.ts`の`_initShopPage`）を、ルート変更のたびに再評価される仕組みに置き換える。
- ショップページの判定対象URLに `/shopDetail/{shopId}/{areaId}` を追加する。

## Capabilities

### New Capabilities
(なし)

### Modified Capabilities
- `ghost-shop-judgment`: 「Judgment input from shop page」要件に、SPA遷移で店舗ページへ遷移した際にリロードなしで判定UIが表示されること、および店舗ページから離れた際に判定UIが除去されることを追加する。

## Impact

- `src/main.ts`: `_initShopPage`の一度きりの初期化を、ルート変更を監視して都度呼び出す仕組みに変更する。
- `src/adapters/ShopPageAdapter.ts`: doc commentの更新のみ。判定ロジックは`logic.ts`の`extractShopIdFromShopPageUrl`に委譲している。
- `src/logic.ts`: `extractShopIdFromShopPageUrl`が`/shopDetail/{shopId}/{areaId}`もマッチするように拡張する。
- `src/managers/JudgmentManager.ts`: 変更なし（`mountBadge`/`createControls`は再利用する）。
