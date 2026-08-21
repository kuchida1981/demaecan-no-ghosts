import { describe, it, expect } from 'vitest';
import { DemaecanListingAdapter } from './ListingAdapter';

function buildContainer(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

describe('DemaecanListingAdapter', () => {
  it('finds shop cards by the shoplist aria-labelledby hook', () => {
    const container = buildContainer(`
      <article aria-labelledby="shoplist-1002298-shopname">
        <p id="shoplist-1002298-shopname"><a href="/shop/menu/1002298">銀のさら　札幌中央店</a></p>
      </article>
      <div>not a card</div>
      <article aria-labelledby="shoplist-3042658-shopname">
        <p id="shoplist-3042658-shopname"><a href="/shop/menu/3042658">中国料理　布袋　本店</a></p>
      </article>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);
    expect(cards).toHaveLength(2);
  });

  it('extracts the shopId and shop name from a card', () => {
    const container = buildContainer(`
      <article aria-labelledby="shoplist-1002298-shopname">
        <p id="shoplist-1002298-shopname"><a href="/shop/menu/1002298">銀のさら　札幌中央店</a></p>
      </article>
    `);
    const [card] = DemaecanListingAdapter.getShopCards(container);

    expect(DemaecanListingAdapter.extractShopId(card)).toBe('1002298');
    expect(DemaecanListingAdapter.extractShopName(card)).toBe('銀のさら　札幌中央店');
  });

  it('recognizes an element as a shop card via matchesShopCard', () => {
    const container = buildContainer(`
      <article aria-labelledby="shoplist-1002298-shopname"></article>
      <div>not a card</div>
    `);
    const [card, other] = Array.from(container.children) as HTMLElement[];

    expect(DemaecanListingAdapter.matchesShopCard(card)).toBe(true);
    expect(DemaecanListingAdapter.matchesShopCard(other)).toBe(false);
  });

  it('returns null for shop name when the card has no shop link', () => {
    const container = buildContainer('<article aria-labelledby="shoplist-1-shopname"></article>');
    const [card] = DemaecanListingAdapter.getShopCards(container);

    expect(DemaecanListingAdapter.extractShopName(card)).toBeNull();
  });

  it('finds div-based shop cards via a menu-page link and image (e.g. order-history carousel)', () => {
    const container = buildContainer(`
      <div class="card-root">
        <div class="image-wrap"><img src="x.jpg" alt=""></div>
        <div class="text-wrap"><p><a href="/shop/menu/3056894">かつや　札幌石山通店</a></p></div>
      </div>
      <div>not a card</div>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(1);
    expect(cards[0].classList.contains('card-root')).toBe(true);
    expect(DemaecanListingAdapter.extractShopId(cards[0])).toBe('3056894');
    expect(DemaecanListingAdapter.extractShopName(cards[0])).toBe('かつや　札幌石山通店');
  });

  it('does not double-count a menu-page link already inside an article[aria-labelledby] card', () => {
    const container = buildContainer(`
      <article aria-labelledby="shoplist-1002298-shopname">
        <div><img src="x.jpg" alt=""></div>
        <p id="shoplist-1002298-shopname"><a href="/shop/menu/1002298">銀のさら　札幌中央店</a></p>
      </article>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(1);
    expect(cards[0].tagName).toBe('ARTICLE');
  });

  it('recognizes the resolved root of a div-based card via matchesShopCard, but not its descendants', () => {
    const container = buildContainer(`
      <div class="card-root">
        <div class="image-wrap"><img src="x.jpg" alt=""></div>
        <div class="text-wrap"><p><a href="/shop/menu/3056894">かつや</a></p></div>
      </div>
    `);
    const root = container.querySelector('.card-root')!;
    const imageWrap = container.querySelector('.image-wrap')!;
    const textWrap = container.querySelector('.text-wrap')!;

    expect(DemaecanListingAdapter.matchesShopCard(root)).toBe(true);
    expect(DemaecanListingAdapter.matchesShopCard(imageWrap)).toBe(false);
    expect(DemaecanListingAdapter.matchesShopCard(textWrap)).toBe(false);
  });

  it('skips a decorative icon nested near the link and resolves to the ancestor containing the featured photo', () => {
    const container = buildContainer(`
      <div class="card-root">
        <div class="image-wrap"><img src="https://cdn.demae-can.com/files/imgix/item720/xxx/photo.jpg" alt=""></div>
        <div class="text-wrap">
          <p><a href="/shop/menu/3056894">かつや　札幌石山通店</a></p>
          <p><img src="https://cdn.demae-can.com/static-assets/images/review/star_on.png" alt=""><span>4.5</span></p>
        </div>
      </div>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(1);
    expect(cards[0].classList.contains('card-root')).toBe(true);
  });

  it('does not detect a card when the only nearby image is a decorative icon', () => {
    const container = buildContainer(`
      <div class="text-with-icon-only">
        <p><a href="/shop/menu/999">星アイコンしかない</a></p>
        <p><img src="https://cdn.demae-can.com/static-assets/images/review/star_on.png" alt=""></p>
      </div>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(0);
  });

  it('does not detect a card when no ancestor of the link contains an image', () => {
    const container = buildContainer(`
      <div class="text-only">
        <p><a href="/shop/menu/999">対応する画像がない</a></p>
      </div>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(0);
    expect(DemaecanListingAdapter.matchesShopCard(container.querySelector('.text-only')!)).toBe(false);
  });

  it('extracts a clean shop name from a fallback card whose link also wraps a badge, rating, delivery time, and shipping fee (issue #20)', () => {
    const container = buildContainer(`
      <div class="card-root">
        <a href="/shop/menu/3309303">
          <div class="photo-wrap">
            <img src="https://cdn.demae-can.com/files/imgix/item720/xxx/photo.jpg" alt="">
            <div class="badge"><span>クーポンあり</span></div>
          </div>
          <div class="text-col">
            <p class="name">吉野家　環状通美園店</p>
            <div class="metrics">
              <p><img src="https://cdn.demae-can.com/contents/img_s/review/star_on.png" alt=""><span>4.5</span></p>
              <p><span><img src="https://cdn.demae-can.com/static-assets/images/icon-share-deli-v3.svg" alt=""></span><span>34分</span></p>
            </div>
            <p class="shipping"><span>標準送料</span><span>0円</span></p>
          </div>
        </a>
      </div>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(1);
    expect(DemaecanListingAdapter.extractShopId(cards[0])).toBe('3309303');
    expect(DemaecanListingAdapter.extractShopName(cards[0])).toBe('吉野家　環状通美園店');
  });

  it('extracts the shop-name element via the aria-labelledby id', () => {
    const container = buildContainer(`
      <article aria-labelledby="shoplist-1002298-shopname">
        <p id="shoplist-1002298-shopname"><a href="/shop/menu/1002298">銀のさら　札幌中央店</a></p>
      </article>
    `);
    const [card] = DemaecanListingAdapter.getShopCards(container);

    const nameEl = DemaecanListingAdapter.extractShopNameElement(card);
    expect(nameEl?.id).toBe('shoplist-1002298-shopname');
  });

  it('returns null for the shop-name element on a fallback (link-based) card', () => {
    const container = buildContainer(`
      <div class="card-root">
        <div class="image-wrap"><img src="x.jpg" alt=""></div>
        <div class="text-wrap"><p><a href="/shop/menu/3056894">かつや　札幌石山通店</a></p></div>
      </div>
    `);
    const [card] = DemaecanListingAdapter.getShopCards(container);

    expect(DemaecanListingAdapter.extractShopNameElement(card)).toBeNull();
  });

  it('excludes a paid product-placement card whose link wraps both a shop-name line and a separate product-name line', () => {
    const container = buildContainer(`
      <div class="card-root">
        <a href="/shop/menu/3121838#first-category">
          <div class="photo-wrap">
            <img src="https://cdn.demae-can.com/files/img/chain/xxx/menu/dish.jpg" alt="">
            <div class="badges"><span>セール中</span><span>お店価格</span></div>
            <div class="logo-badge"><img src="https://cdn.demae-can.com/files/img/chain/xxx/logo150x150/x.jpg" alt=""></div>
          </div>
          <div class="text-col">
            <p class="shop-name">かつ丼屋　のぶお　札幌円山店</p>
            <p class="product-name">とろける柔らかさ！ヒレ3枚かつ丼</p>
            <p class="price"><span>1,320円</span></p>
          </div>
        </a>
      </div>
    `);

    const cards = DemaecanListingAdapter.getShopCards(container);

    expect(cards).toHaveLength(0);
    expect(DemaecanListingAdapter.matchesShopCard(container.querySelector('.card-root')!)).toBe(false);
  });
});
