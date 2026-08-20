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
 * Finds the direct child of `anchor` that (recursively) contains the
 * anchor's featured photo, e.g. the photo/badge block in
 * `<a><div>photo+badges</div><div>name+rating+...</div></a>`. Excluding this
 * whole block from title-candidate search removes the photo itself and any
 * badge overlays nested alongside it (e.g. "クーポンあり", "セール中") in
 * one step, without needing to recognize badges individually. Returns null
 * if the anchor doesn't contain a featured photo at all (e.g. a link whose
 * only content is the shop name text, with the photo living elsewhere in
 * the card).
 */
function findExcludedPhotoBlock(anchor: HTMLAnchorElement): Element | null {
  const img = anchor.querySelector(FEATURED_IMG_SELECTOR);
  if (!img) return null;
  let node: Element = img;
  while (node.parentElement !== anchor) {
    node = node.parentElement as Element;
  }
  return node;
}

/**
 * An element "is" title-like text (a shop name, or on some cards a
 * promoted product name) if it directly owns a non-whitespace text node,
 * as opposed to metric rows (rating, delivery time, price) whose text sits
 * inside nested `<span>`/`<img>` children instead. The "no nested image"
 * check guards against a row that happens to mix direct text with an
 * inline icon (e.g. "4.5★" without a wrapping span).
 */
function isTitleCandidate(el: Element): boolean {
  const hasDirectText = Array.from(el.childNodes).some(
    node => node.nodeType === Node.TEXT_NODE && !!node.textContent && node.textContent.trim().length > 0
  );
  return hasDirectText && !el.querySelector('img');
}

/**
 * Finds title-like candidate elements within `container` (excluding
 * `excluded`, if given). If `container` itself is title-like, it's the
 * sole candidate. Otherwise, single-child wrapper elements are transparently
 * unwrapped (they add nesting, not structure) until reaching a container
 * with multiple children, whose direct children are then tested - without
 * recursing any deeper, so that a metric row's own nested `<span>` text
 * (e.g. "標準送料"/"0円") is never mistaken for a title.
 */
function collectTitleCandidates(container: Element, excluded: Element | null): HTMLElement[] {
  if (isTitleCandidate(container)) return [container as HTMLElement];
  const children = Array.from(container.children).filter(child => child !== excluded);
  if (children.length === 1) return collectTitleCandidates(children[0], excluded);
  return children.filter(isTitleCandidate) as HTMLElement[];
}

/**
 * Finds the title-like candidates for a fallback-path card's shop-menu
 * link: normally just the shop name, but a link-based card with two or
 * more candidates (e.g. a shop-name line alongside a separately promoted
 * product/menu-item name, as seen on demae-can's paid featured-placement
 * cards) is ambiguous and should not be treated as a shop card at all -
 * see `hasSingleTitleCandidate`.
 */
function findFallbackTitleCandidates(anchor: HTMLAnchorElement): HTMLElement[] {
  return collectTitleCandidates(anchor, findExcludedPhotoBlock(anchor));
}

function hasSingleTitleCandidate(anchor: HTMLAnchorElement): boolean {
  return findFallbackTitleCandidates(anchor).length === 1;
}

/**
 * Finds shop cards whose markup isn't `article[aria-labelledby^="shoplist-"]`
 * but does contain a shop menu-page link, skipping links already covered by
 * that selector to avoid detecting the same shop twice. A link whose content
 * doesn't resolve to exactly one title-like candidate (see
 * `hasSingleTitleCandidate`) is skipped rather than guessed at.
 */
function getLinkBasedShopCards(container: ParentNode): HTMLElement[] {
  const anchors = Array.from(container.querySelectorAll<HTMLAnchorElement>(SHOP_LINK_SELECTOR));
  const roots = new Set<HTMLElement>();
  for (const anchor of anchors) {
    if (anchor.closest(SHOP_CARD_SELECTOR)) continue;
    const root = findLinkCardRoot(anchor);
    if (root && hasSingleTitleCandidate(anchor)) roots.add(root);
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
  return findLinkCardRoot(anchor) === el && hasSingleTitleCandidate(anchor);
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
    const anchor = card.querySelector<HTMLAnchorElement>(SHOP_LINK_SELECTOR);
    if (!anchor) return null;
    if (card.matches(SHOP_CARD_SELECTOR)) {
      const text = anchor.textContent;
      return text ? text.trim() : null;
    }
    const candidates = findFallbackTitleCandidates(anchor);
    if (candidates.length !== 1) return null;
    const text = candidates[0].textContent;
    return text ? text.trim() : null;
  }
};

export { SHOP_CARD_SELECTOR };
