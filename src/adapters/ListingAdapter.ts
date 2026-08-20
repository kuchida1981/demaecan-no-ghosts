import { ListingAdapter } from '../types';
import { extractShopIdFromCard } from '../logic';

const SHOP_CARD_SELECTOR = 'article[aria-labelledby^="shoplist-"]';
const SHOP_LINK_SELECTOR = 'a[href*="/shop/menu/"]';
const LINK_CARD_MAX_CLIMB = 8;
// Decorative UI icons (star rating, delivery-time bike, share icon, etc.) are
// served from this path and can appear inside the text column next to the
// shop link, ahead of the shop's own featured photo further up the tree.
// Excluding them keeps findLinkCardRoot from stopping too early.
const FEATURED_IMG_SELECTOR = 'img:not([src*="static-assets/images/"])';

/**
 * Walks up from a shop menu-page link to the closest ancestor that contains
 * the shop's featured photo (as opposed to a decorative icon), treated as
 * the visual boundary of a card whose markup doesn't use the
 * `article[aria-labelledby^="shoplist-"]` pattern (e.g. a carousel section
 * like "過去に注文したお店").
 */
function findLinkCardRoot(anchor: HTMLAnchorElement): HTMLElement | null {
  let node: HTMLElement | null = anchor.parentElement;
  for (let depth = 0; node && depth < LINK_CARD_MAX_CLIMB; depth += 1) {
    if (node.querySelector(FEATURED_IMG_SELECTOR)) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Finds shop cards whose markup isn't `article[aria-labelledby^="shoplist-"]`
 * but does contain a shop menu-page link, skipping links already covered by
 * that selector to avoid detecting the same shop twice.
 */
function getLinkBasedShopCards(container: ParentNode): HTMLElement[] {
  const anchors = Array.from(container.querySelectorAll<HTMLAnchorElement>(SHOP_LINK_SELECTOR));
  const roots = new Set<HTMLElement>();
  for (const anchor of anchors) {
    if (anchor.closest(SHOP_CARD_SELECTOR)) continue;
    const root = findLinkCardRoot(anchor);
    if (root) roots.add(root);
  }
  return Array.from(roots);
}

/**
 * Determines whether `el` itself is the link-based card root for a shop
 * menu-page link it contains (i.e. matches what `getLinkBasedShopCards`
 * would detect), using the same resolution logic for consistency.
 */
function isLinkCardRoot(el: Element): boolean {
  const anchor = el.querySelector<HTMLAnchorElement>(SHOP_LINK_SELECTOR);
  if (!anchor || anchor.closest(SHOP_CARD_SELECTOR)) return false;
  return findLinkCardRoot(anchor) === el;
}

/**
 * Adapter for demae-can.com shop-listing pages (top page, category/genre pages).
 * Shop cards have no stable class names (Tailwind utility classes only), so this
 * relies on the `aria-labelledby="shoplist-{shopId}-shopname"` accessibility hook
 * where available, and falls back to a shop menu-page link + image heuristic for
 * cards with other markup (e.g. carousel sections such as "過去に注文したお店").
 */
export const DemaecanListingAdapter: ListingAdapter = {
  match: () => true,
  getListingContainer: () => document.body,
  getShopCards: (container: ParentNode): HTMLElement[] => [
    ...Array.from(container.querySelectorAll<HTMLElement>(SHOP_CARD_SELECTOR)),
    ...getLinkBasedShopCards(container)
  ],
  matchesShopCard: (el: Element) => el.matches(SHOP_CARD_SELECTOR) || isLinkCardRoot(el),
  extractShopId: (card: HTMLElement) => extractShopIdFromCard(card),
  extractShopName: (card: HTMLElement) => {
    const text = card.querySelector<HTMLAnchorElement>(SHOP_LINK_SELECTOR)?.textContent;
    return text ? text.trim() : null;
  }
};

export { SHOP_CARD_SELECTOR };
