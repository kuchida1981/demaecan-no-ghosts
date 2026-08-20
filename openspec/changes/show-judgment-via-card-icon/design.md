## Context

`JudgmentManager`は既に`mountBadge(shopId)`で判定状態を反映するバッジ要素を作成・登録し、`store.subscribe`経由で判定が変わるたびに全登録要素を再描画する仕組み（`badges: Map<ShopId, HTMLElement[]>` + `_renderAll`）を持っている。`CardOverlayManager.decorateCard`はこの`mountBadge`をカードごとに呼び出し、カード左上にバッジを追加している。

一方、カード右上の情報アイコン（`icon`要素、`CardOverlayManager._buildPopover`で生成）は判定状態と無関係に固定で`'i'`が表示されている。

## Goals / Non-Goals

**Goals:**
- カード右上の情報アイコンの絵柄が、判定状態（ゴースト/実店舗/未評価）に応じて自動的に切り替わり、判定が変わった際も即座に反映される。
- カード左上のテキストバッジ表示を廃止する。

**Non-Goals:**
- 店舗ページの判定パネル（`ghosts-shop-page-panel`）でのバッジ表示・`JudgmentManager.mountBadge`/`createControls`自体の変更。
- アイコンの背景色やサイズなど、絵柄以外の見た目の変更。
- アイコンのaria-labelを判定状態に応じて変える対応（「詳細情報を表示」という現状の文言のままとする）。

## Decisions

### 1. `JudgmentManager`に`mountIcon`を追加し、`badges`と同じパターンで管理する

```ts
mountIcon = (shopId: ShopId, icon: HTMLElement): void => {
  this._registerList(this.icons, shopId, icon);
  this._renderIcon(icon, shopId);
};

private _renderIcon = (icon: HTMLElement, shopId: ShopId): void => {
  const judgment = this.store.getShopRecord(shopId)?.judgment;
  icon.textContent = judgment === 'ghost' ? '👻' : judgment === 'not-ghost' ? '🏠' : 'i';
};
```

`icons: Map<ShopId, HTMLElement[]>`を追加し、`_renderAll`のループにも`_renderIcon`を加える。`mountBadge`が「要素の生成＋登録＋初期描画」を行うのに対し、`mountIcon`は`CardOverlayManager`側が既に生成した`icon`要素を受け取って登録するだけの違いがある（アイコンはクリック/ホバーのイベント配線を`CardOverlayManager`が担っており、生成主体を`JudgmentManager`に移すと責務が分散するため、生成は呼び出し元に残す）。

- **却下した代替案: アイコンの生成自体を`JudgmentManager`に移す（`mountBadge`と同じパターンに完全に揃える）**
  アイコンは判定表示だけでなく、ポップオーバーの開閉トリガーというレイヤードなUI要素講造を持っており（クリック/ホバーの配線、位置調整用の`_ensurePositioned`など）、`CardOverlayManager`が生成と配線を一貫して担う現状の設計の方が自然。判定状態の反映だけを`JudgmentManager`に委譲する方が責務が明確。

### 2. `CardOverlayManager.decorateCard`から`mountBadge`の呼び出しとバッジのDOM追加を削除する

```ts
// before
const badge = this.judgmentManager.mountBadge(shopId);
const { icon, popover, refs } = this._buildPopover(shopId, shopName);
card.append(badge, icon, popover);

// after
const { icon, popover, refs } = this._buildPopover(shopId, shopName);
card.append(icon, popover);
```

`_buildPopover`内で`icon`生成後に`this.judgmentManager.mountIcon(shopId, icon)`を呼ぶ。

`JudgmentManager.mountBadge`自体は`ShopPageManager`（店舗ページパネル）が引き続き使うため削除しない。

## Risks / Trade-offs

- [Risk] 絵文字のレンダリングはOS・ブラウザ・フォントによって見た目が異なる（例: Windows版Chromeと macOS版Safariで色味が違う）→ 既存の`ghosts-judge-btn`等でも絵文字は使っていないが、シンプルなカラー絵文字（👻🏠）は主要環境で概ね一貫した見た目になるため許容する。
- [Risk] `.ghosts-badge`をカードに追加しなくなることで、カード上の判定状態を示す視覚要素が小さいアイコン1つだけになり、判定状態に気づきにくくなる可能性 → Issueの要望（他サイト要素との衝突回避のための情報量削減）を優先する。使いづらければ別Issueで調整する。
- [Risk（実機確認で顕在化）] 従来の`.ghosts-icon-btn`のサイズ（1.5rem/24px、font-size 0.8125rem）は「i」の文字1つ向けに調整されており、絵文字（👻🏠）を表示すると小さすぎて視認しづらい → アイコンのサイズを2rem（32px）、font-sizeを1.125remに拡大して対応（`src/ui/styles.ts`）。あわせてポップオーバーの`top`オフセットもアイコンの高さ拡大分（2.125rem→2.625rem）調整した。
- [Risk（実機確認で顕在化）] `.ghosts-icon-btn`に付けていた`font-style: italic`は「i」の文字を情報アイコン風に見せるためのものだったが、絵文字（👻🏠）にも適用されてしまい、合成イタリックでグリフが歪んで視認性を下げていた → `font-style: italic`をベースクラスから外し、未評価時（グリフが`i`のとき）のみ付与する`.ghosts-icon-btn--info`修飾クラスに切り出した。`JudgmentManager._renderIcon`がグリフに応じてこのクラスを`toggle`する。
