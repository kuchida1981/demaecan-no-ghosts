## Context

`src/adapters/ListingAdapter.ts`は現在、店舗カードを`SHOP_CARD_SELECTOR = 'article[aria-labelledby^="shoplist-"]'`一本で検出している。「過去に注文したお店」セクション（カルーセル形式）のカードは実機調査の結果、以下のような構造だと分かっている（GitHub Issue #6のコメント参照）。

```html
<div class="group relative z-0 flex size-full cursor-pointer overflow-hidden rounded-lg bg-white ...">
  <div class="relative h-[9rem] w-[9rem] ...">
    <img ... />
  </div>
  <div class="flex min-w-0 flex-1 flex-col ...">
    <p class="line-clamp-1 ..."><a href="/shop/menu/3056894">かつや　札幌石山通店</a></p>
    ...
  </div>
</div>
```

- ルート要素は`<article>`ではなく`<div>`で、`aria-labelledby`属性を持たない。
- 店舗詳細への内部リンク（`a[href*="/shop/menu/"]`）は共通して存在する。
- カードの視覚的な境界（角丸・overflow-hidden・背景色）を持つのは、リンクの4階層上にある`<img>`と店舗名リンクの両方を子孫に持つdivである。

このdivを直接クラス名で選択する（例: `.overflow-hidden.rounded-lg`）ことも検討したが、Tailwindのユーティリティクラスの組み合わせは出前館サイトの実装変更で容易に変わりうるため、より構造的に安定した目印を使いたい。

## Goals / Non-Goals

**Goals:**
- 「過去に注文したお店」のようなカルーセル形式のカードも、既存の判定UI（情報アイコン）・フィルタの対象にする。
- 既存の`article[aria-labelledby^="shoplist-"]`カードの挙動・検出結果は変えない（二重検出しない）。

**Non-Goals:**
- `CardOverlayManager`/`FilterManager`自体の変更（アダプタから受け取ったカード要素を汎用的に扱う既存設計をそのまま活かす）。
- 「過去に注文したお店」以外の、まだ確認していない未知のセクション形式への対応（今回確認できた構造にのみ対応する）。

## Decisions

### 1. カードのルート要素は「店舗詳細リンクから祖先方向に辿り、直近で`<img>`を子孫に持つ要素」とする

```ts
function findLinkCardRoot(anchor: HTMLAnchorElement): HTMLElement | null {
  let node: HTMLElement | null = anchor.parentElement;
  for (let depth = 0; node && depth < LINK_CARD_MAX_CLIMB; depth++) {
    if (node.querySelector('img')) return node;
    node = node.parentElement;
  }
  return null;
}
```

リンク自身の祖先を1階層ずつ辿り、`<img>`を子孫に持つ最初の要素を「カードの視覚的な境界」とみなす。カード型UIでは「画像とテキスト（リンクを含む）が共通の親要素の中にある」という構造がスタイリングの実装に依存せず一般的に成り立つため、具体的なクラス名に依存するより壊れにくいと判断した。

`LINK_CARD_MAX_CLIMB`（例: 8階層）で上限を設け、際限なく`document.body`まで遡ってしまうことを防ぐ。上限に達して`<img>`が見つからなければ、そのリンクはカードとして扱わない（`extractShopIdFromCard`が既にshopId抽出失敗時にカードをスキップする設計になっているのと同じ考え方）。

- **却下した代替案: `.overflow-hidden.rounded-lg`等のクラス名の組み合わせで直接セレクタ指定する**
  実装は単純だが、Tailwindのユーティリティクラスはサイトの実装変更で容易に変わりうる。今回の`article[aria-labelledby^="shoplist-"]`も同種の脆さを抱えているが、aria属性は元々アクセシビリティのための意味的な目印であり多少安定していると期待できるのに対し、見た目のためだけの複数クラス名の組み合わせはより変わりやすいと判断した。
- **却下した代替案: 祖先方向に固定階層数（例: 4階層）だけ遡る**
  今回確認したサンプルでは4階層だったが、実装の些細な変更（ラッパーdivの追加/削除）で階層数がずれると簡単に壊れる。「`<img>`を子孫に持つ最初の祖先」という構造的な条件の方が、階層数の変化に対して頑健。

### 2. 既に`article[aria-labelledby^="shoplist-"]`でカバーされているリンクはスキップする

ランキングカード（`<article>`）内にも店舗詳細への内部リンクが存在する（`extractShopName`が既にこのリンクを利用している）。リンク起点の検出ロジックが同じリンクを拾ってしまうと、`findLinkCardRoot`が`<article>`とは異なる（内部の）div要素を返し、同じ店舗に対して二重にアイコン・ポップオーバーが生成されてしまう。これを避けるため、リンクごとに`anchor.closest(SHOP_CARD_SELECTOR)`をチェックし、既にヒットする場合はスキップする。

### 3. `matchesShopCard`は`findLinkCardRoot`を用いて対称的に実装する

`CardOverlayManager`の`MutationObserver`は、新規追加されたDOMノード自体がカードかどうかを`matchesShopCard`で判定する（子孫のカード探索とは別に）。リンク起点のカード判定でも同じ基準を使うため、独自のロジックを重複させず、要素`el`の子孫にある店舗詳細リンクに対して`findLinkCardRoot`を実行し、結果が`el`自身と一致するかどうかで判定する。これにより「カードの発見（`getShopCards`）」と「単一要素がカードかどうかの判定（`matchesShopCard`）」の基準が完全に一致する。

### 4. `<img>`の判定は装飾アイコンを除外する（実機フィードバックで判明）

初回実装では`node.querySelector('img')`（任意の`<img>`）でカード境界を判定していたが、実機確認で「過去に注文したお店」のアイコンが本文中央（評価・時間の行あたり）にずれる不具合が見つかった。

原因: 星評価アイコン（`<img src=".../static-assets/images/review/star_on.png">`）や配達時間のバイクアイコン（`.../static-assets/images/icon-bike.svg`）が、店舗名リンクと同じテキスト列の中に配置されている。これらは`SHOP_LINK_SELECTOR`のリンクよりも先に見つかってしまうため、`findLinkCardRoot`が本来の画像+テキスト全体を包むカード境界に到達する前に、テキスト列内の小さいdivで停止してしまっていた。

出前館サイトの実際の画像パスを調べたところ、装飾アイコン類は一貫して`static-assets/images/...`配下、実店舗写真は`files/imgix/...`配下と、明確にパスが分かれていることを確認した。これを踏まえ、`node.querySelector('img')`を`node.querySelector('img:not([src*="static-assets/images/"])')`に変更し、装飾アイコンを除外して実店舗写真のみを「カードの目印」として扱うようにした。

- **却下した代替案: `getBoundingClientRect()`で描画サイズが一定以上の`<img>`のみを対象にする**
  実際の見た目のサイズで判定できれば装飾アイコンとの区別はより正確になるが、出前館サイトの配達時間アイコンは巨大な`width`/`height`属性値に`transform: scale()`を組み合わせて表示サイズを縮小するテクニックを使っており、単純なサイズ判定では見分けがつかない。また`getBoundingClientRect()`はレイアウト後でないと正しい値が取れずテストが書きにくい。パスによる判定の方がシンプルで確実だった。

## Risks / Trade-offs

- [Risk] 「`<img>`を子孫に持つ直近の祖先」というヒューリスティックは、出前館サイトのマークアップが将来変わった場合に別の（意図しない）要素を「カード」と誤認する可能性がある → `LINK_CARD_MAX_CLIMB`で探索範囲を制限し、影響範囲を限定する。実機で誤検出が確認されれば個別に調整する。
- [Risk] カルーセルの実装によっては、カードが仮想化（画面外のスライドがDOMから省かれ、スクロールに応じて動的に生成・破棄される）されている可能性があり、その場合は`MutationObserver`による追従は効くが、スクロールのたびにアイコン等が再生成される可能性がある → `decorateCard`は`DECORATED_ATTR`で重複デコレートを防いでいるため、同一要素が再利用される限りは問題にならない。要素そのものが破棄・再生成される仮想化の場合は都度再デコレートされるが、動作上の実害はない（許容する）。
