import { Judgment, ShopId, ShopRecord, VisibleJudgments } from './types';

const SHOPLIST_ARIA_PATTERN = /^shoplist-(\d+)-shopname$/;
const SHOP_MENU_HREF_PATTERN = /\/shop\/menu\/(\d+)/;
const SHOP_DETAIL_HREF_PATTERN = /\/shopDetail\/(\d+)/;
const ADDRESS_LABEL_TEXT = '住所';

/**
 * Extracts the shopId from a shop-listing card element.
 * Prefers the article's `aria-labelledby` (e.g. "shoplist-3042658-shopname"),
 * falling back to a `/shop/menu/{shopId}` link inside the card.
 */
export function extractShopIdFromCard(card: Element): ShopId | null {
  const ariaLabelledBy = card.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const match = SHOPLIST_ARIA_PATTERN.exec(ariaLabelledBy);
    if (match) {
      return match[1];
    }
  }

  const anchor = card.querySelector<HTMLAnchorElement>('a[href*="/shop/menu/"]');
  if (anchor) {
    const href = anchor.getAttribute('href')!;
    const match = SHOP_MENU_HREF_PATTERN.exec(href);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extracts the shopId from a shop page URL: either the menu page
 * (`/shop/menu/{shopId}`) or the detail page (`/shopDetail/{shopId}/{areaId}`).
 */
export function extractShopIdFromShopPageUrl(url: string): ShopId | null {
  const menuMatch = SHOP_MENU_HREF_PATTERN.exec(url);
  if (menuMatch) {
    return menuMatch[1];
  }

  const detailMatch = SHOP_DETAIL_HREF_PATTERN.exec(url);
  return detailMatch ? detailMatch[1] : null;
}

/**
 * Extracts the shop address from a `/shopDetail/{shopId}` document.
 * The page renders address as a labelled section: `<h2>住所</h2>` followed
 * by a sibling containing a `<p>` with the address text.
 */
export function extractAddressFromDetailDocument(doc: Document): string | null {
  const headings = Array.from(doc.querySelectorAll('h2'));
  const addressHeading = headings.find(h => h.textContent.trim() === ADDRESS_LABEL_TEXT);
  if (!addressHeading) {
    return null;
  }

  const section = addressHeading.closest('section') ?? addressHeading.parentElement!;
  const paragraph = section.querySelector('p');
  const text = paragraph?.textContent.trim();
  return text ? text : null;
}

/**
 * Builds a Google Maps search URL for the given address.
 */
export function buildGoogleMapsUrl(address: string): string {
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', address);
  return url.toString();
}

/**
 * Builds a Google search URL for the given query (e.g. a shop name).
 */
export function buildGoogleSearchUrl(query: string): string {
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', query);
  return url.toString();
}

/**
 * Builds the relative URL of a shop's detail page.
 */
export function buildShopDetailUrl(shopId: ShopId): string {
  return `/shopDetail/${shopId}`;
}

/**
 * Merges a partial update into an existing shop record, returning a new record.
 */
export function mergeShopRecord(existing: ShopRecord | undefined, patch: Partial<ShopRecord>): ShopRecord {
  return { ...existing, ...patch };
}

/**
 * Returns a record with the judgment cleared (back to unknown).
 * Returns undefined when the record has no other data worth keeping.
 */
export function clearJudgment(record: ShopRecord | undefined): ShopRecord | undefined {
  if (!record) return undefined;
  const { judgment: _judgment, judgedAt: _judgedAt, ...rest } = record;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/**
 * Normalizes a shop record's judgment into a visibleJudgments key.
 */
export function judgmentKey(record: ShopRecord | undefined): keyof VisibleJudgments {
  if (record?.judgment === 'ghost') return 'ghost';
  if (record?.judgment === 'not-ghost') return 'notGhost';
  return 'unjudged';
}

/**
 * Determines whether a shop card should be hidden by the judgment-visibility filter.
 */
export function shouldHideCard(record: ShopRecord | undefined, visibleJudgments: VisibleJudgments): boolean {
  return !visibleJudgments[judgmentKey(record)];
}

/**
 * Returns the badge label to display for a shop's judgment, or null when unjudged.
 */
export function getBadgeLabel(judgment: Judgment | undefined): string | null {
  if (judgment === 'ghost') return 'ゴースト';
  if (judgment === 'not-ghost') return '実店舗';
  return null;
}

/**
 * Returns the glyph to display on a shop card's info icon for a judgment:
 * a ghost glyph when judged ghost, a shop glyph when judged not-ghost, and
 * the default info glyph when unjudged.
 */
export function getIconGlyph(judgment: Judgment | undefined): string {
  if (judgment === 'ghost') return '👻';
  if (judgment === 'not-ghost') return '🏠';
  return 'i';
}
