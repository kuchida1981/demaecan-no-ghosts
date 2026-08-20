import { ListingAdapter } from '../types';
import { extractShopIdFromCard } from '../logic';

const SHOP_CARD_SELECTOR = 'article[aria-labelledby^="shoplist-"]';
const SHOP_LINK_SELECTOR = 'a[href*="/shop/menu/"]';

/**
 * Adapter for demae-can.com shop-listing pages (top page, category/genre pages).
 * Shop cards have no stable class names (Tailwind utility classes only), so this
 * relies on the `aria-labelledby="shoplist-{shopId}-shopname"` accessibility hook.
 */
export const DemaecanListingAdapter: ListingAdapter = {
  match: () => true,
  getListingContainer: () => document.body,
  getShopCards: (container: ParentNode): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(SHOP_CARD_SELECTOR)),
  matchesShopCard: (el: Element) => el.matches(SHOP_CARD_SELECTOR),
  extractShopId: (card: HTMLElement) => extractShopIdFromCard(card),
  extractShopName: (card: HTMLElement) => {
    const text = card.querySelector<HTMLAnchorElement>(SHOP_LINK_SELECTOR)?.textContent;
    return text ? text.trim() : null;
  }
};

export { SHOP_CARD_SELECTOR };
