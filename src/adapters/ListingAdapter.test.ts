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
});
