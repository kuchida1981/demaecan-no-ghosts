## Context

出前館のショップページはNext.js製と見られるSPAで、店舗一覧からのクリック遷移は`history.pushState`（等価のクライアントサイドルーティング）で行われ、Tampermonkeyのユーザースクリプトは初回ロード時に一度だけ実行される。

現行の`App._initShopPage()`（`src/main.ts`）は起動時の`window.location.href`を一度だけ`DemaecanShopPageAdapter.match`で判定し、マッチすればパネルを`document.body`に追加するだけで、その後のURL変化を一切見ていない。`CardOverlayManager`は`MutationObserver`で新規カードのDOM追加を継続的に監視しているのに対し、ショップページ用パネルには同等の継続監視がなく、ここが非対称になっている。

## Goals / Non-Goals

**Goals:**
- SPA遷移でショップページ（`/shop/menu/{shopId}`または`/shopDetail/{shopId}/{areaId}`）に入ったら、リロードなしで判定パネルを表示する。
- SPA遷移でショップページから離れたら、判定パネルを除去する。
- 同じショップページ内で別のshopId（例: 関連店舗リンクなど、もしあれば）に遷移した場合も、パネルの内容を新しいshopIdに追従させる。

**Non-Goals:**
- `CardOverlayManager`や`FilterManager`側のルート変更対応（既に`MutationObserver`でDOM追加を直接監視しているため、URLベースの検知は不要）。
- `JudgmentManager`の判定ロジック・永続化ロジックの変更。

**スコープ変更の記録:** 当初`ShopPageAdapter`が対象とするURLパターンの見直しはNon-Goalとし、`/shop/menu/{shopId}`のみを対象としていたが、実機確認後にユーザーから`/shopDetail/{shopId}/{areaId}`（住所等が載っている店舗詳細ページ）でも判定UIを出したいという要望があり、Goalsに追加した（下記Decisions #5）。

## Decisions

### 1. ルート変更検知は「history APIのパッチ + popstate + 低頻度ポーリングのフォールバック」の組み合わせで行う

`history.pushState`/`history.replaceState`をラップして呼び出し後に`locationchange`カスタムイベントを`window`にdispatchし、あわせて`popstate`（戻る/進む操作）もリッスンする。両方とも同じハンドラに集約し、現在のURLを再評価する。

保険として、低頻度（例: 1秒間隔）で`location.href`の変化を比較するポーリングも併用する。SPAフレームワークが将来Navigation APIなど別の手段でURLを書き換えた場合でもパッチが漏れなく効いているとは限らないため、最終防衛ラインとして持たせる。

- **却下した代替案: MutationObserverでDOM変化を検知しURLを再チェックする**
  `CardOverlayManager`と同じ仕組みを流用する案も検討したが、ショップページには「一覧のカード」のような安定した監視対象コンテナがなく、DOM全体を監視すると発火頻度が過剰になる。URLの変化そのものを見る方が意図が明確でコストも低い。
- **却下した代替案: ポーリングのみ（history APIパッチなし）**
  実装は単純だが、間隔を短くしないと遷移直後の一瞬パネルが出ない状態が体感できてしまう。間隔を短くすると常時実行コストが増える。history APIパッチを主経路にすることで、ポーリングは低頻度のままで体感遅延をなくせる。

### 2. ルート監視ロジックは`src/route-watcher.ts`として独立させる

`onRouteChange(callback: (url: string) => void): () => void`のような小さい関数を切り出す。ショップページパネル以外（将来的な用途）でも再利用できるようにするためだが、現時点での呼び出し元は新設する`ShopPageManager`のみ。戻り値のunsubscribe関数は本番コードでは使わない（ページの寿命いっぱい監視し続けるため）が、テストでイベントリスナー・タイマーを確実に片付けてテスト間の汚染を防ぐために実装時に追加した。

### 3. `main.ts`の`_initShopPage`を`ShopPageManager`クラスに切り出す

既存の`CardOverlayManager`/`FilterManager`/`JudgmentManager`と同じ「managerクラス + `init()`」の構成に合わせる。

`ShopPageManager`の責務:
- `init()`: `route-watcher`を購読し、現在のURLで初回同期を行う。
- URL変化のたびに`DemaecanShopPageAdapter.match`で判定:
  - マッチし、かつ現在表示中のパネルがない、または表示中のshopIdと異なる → 既存パネルがあれば除去してから、新しいshopIdでパネルを再構築（`JudgmentManager.mountBadge`/`createControls`を呼び出す）。
  - マッチし、かつ同じshopIdのパネルが既に表示中 → 何もしない（重複生成を避ける）。
  - マッチしない、かつパネルが表示中 → パネルをDOMから除去する。

### 4. パネルの再構築で発生する`JudgmentManager`内部Mapの残存エントリは許容する

`JudgmentManager.mountBadge`/`createControls`は`badges`/`controls`という`Map<ShopId, T[]>`に要素を登録するだけで、除去（unregister）のAPIを持たない。`ShopPageManager`がパネルを除去する際、DOM上からは要素を消せるが、`JudgmentManager`内部のMapにはデタッチされた要素への参照が残り続ける。

1セッションで訪問するショップページ数は現実的には数十件程度であり、残存する要素も軽量（ボタン数個）なため、実害は小さいと判断し、`JudgmentManager`に除去APIを追加する変更はスコープに含めない。長時間の連続閲覧で問題が顕在化した場合は別changeで対応する。

### 5. ショップページの対象URLに`/shopDetail/{shopId}/{areaId}`も含める

実機確認（タスク3.2）の結果、`/shop/menu/{shopId}`側は問題なく動作したが、ユーザーから店舗詳細ページ（`/shopDetail/{shopId}/{areaId}`、住所などが載っているページ）でも判定UIを出したいという追加要望があった。

`src/logic.ts`の`extractShopIdFromShopPageUrl`に`SHOP_DETAIL_HREF_PATTERN = /\/shopDetail\/(\d+)/`によるマッチを追加し、`/shop/menu/{shopId}`でマッチしない場合のフォールバックとして扱う。`DemaecanShopPageAdapter.match`/`extractShopId`はこの関数を呼び出しているだけなので、アダプタ自体の変更は不要。`ShopPageManager`もアダプタ経由でURLを判定しているだけなので変更不要。

- **却下した代替案: `/shopDetail/{shopId}/{areaId}`専用の別Adapter/別Managerを新設する**
  `ShopPageAdapter`インターフェース（`match`/`extractShopId`/`getShopName`）は既にURLパターンに依存しない抽象度になっており、「ショップページのURLパターンを1箇所（`logic.ts`）で判定する」という既存の設計方針に対して、2つ目のURLパターンのために新しい抽象を増やす理由がない。既存関数の拡張で十分。

## Risks / Trade-offs

- [Risk] ポーリング間隔（1秒想定）の間、遷移直後にパネルが一瞬出ない/消えないタイムラグが生じ得る → history APIパッチと`popstate`が主経路としてほぼ即時に効くため、ポーリングはあくまで保険であり、実運用でこのタイムラグが顕在化するケースは限定的と見込む。
- [Risk] `history.pushState`/`replaceState`のパッチが他のユーザースクリプトや将来のTampermonkey機能と衝突する可能性 → 冪等にパッチを当てる（二重パッチを避けるガードを入れる）ことで軽減する。
- [Risk] `JudgmentManager`内部Mapの残存エントリによる緩やかなメモリ増加（Decisions #4参照）→ 実害が小さいと判断し許容。実測で問題になれば別途対応。

## Migration Plan

データ永続化フォーマットの変更はないため、マイグレーション作業は不要。通常のユーザースクリプト更新（バージョンアップ）として配布する。
