import { describe, it, expect } from 'vitest';
import {
  extractShopIdFromCard,
  extractShopIdFromShopPageUrl,
  extractAddressFromDetailDocument,
  normalizeAddress,
  buildGoogleMapsUrl,
  buildGoogleSearchUrl,
  buildShopDetailUrl,
  buildShopMenuUrl,
  mergeShopRecord,
  clearJudgment,
  shouldHideCard,
  getBadgeLabel,
  getIconGlyph
} from './logic';

function createCard(html: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  return wrapper.firstElementChild as HTMLElement;
}

describe('extractShopIdFromCard', () => {
  it('extracts shopId from aria-labelledby', () => {
    const card = createCard(
      '<article aria-labelledby="shoplist-3042658-shopname"><a href="/shop/menu/3042658">店名</a></article>'
    );
    expect(extractShopIdFromCard(card)).toBe('3042658');
  });

  it('falls back to the /shop/menu/{id} link when aria-labelledby is absent', () => {
    const card = createCard('<article><a href="/shop/menu/1002298">店名</a></article>');
    expect(extractShopIdFromCard(card)).toBe('1002298');
  });

  it('falls back to the link when aria-labelledby does not match the expected pattern', () => {
    const card = createCard(
      '<article aria-labelledby="something-else"><a href="/shop/menu/999">店名</a></article>'
    );
    expect(extractShopIdFromCard(card)).toBe('999');
  });

  it('returns null when neither aria-labelledby nor a matching link exists', () => {
    const card = createCard('<article><a href="/other/path">店名</a></article>');
    expect(extractShopIdFromCard(card)).toBeNull();
  });

  it('returns null when the shop link href has no numeric shopId', () => {
    const card = createCard('<article><a href="/shop/menu/abc">店名</a></article>');
    expect(extractShopIdFromCard(card)).toBeNull();
  });
});

describe('extractShopIdFromShopPageUrl', () => {
  it('extracts the shopId from a shop menu page path', () => {
    expect(extractShopIdFromShopPageUrl('/shop/menu/3207834')).toBe('3207834');
  });

  it('extracts the shopId from a full shop menu URL', () => {
    expect(extractShopIdFromShopPageUrl('https://demae-can.com/shop/menu/3207834#first-category')).toBe('3207834');
  });

  it('extracts the shopId from a shop detail page path', () => {
    expect(extractShopIdFromShopPageUrl('/shopDetail/3207834/01101060009')).toBe('3207834');
  });

  it('extracts the shopId from a full shop detail URL', () => {
    expect(extractShopIdFromShopPageUrl('https://demae-can.com/shopDetail/3207834/01101060009')).toBe('3207834');
  });

  it('returns null for URLs without a shopId', () => {
    expect(extractShopIdFromShopPageUrl('https://demae-can.com/')).toBeNull();
  });
});

describe('extractAddressFromDetailDocument', () => {
  function parse(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  it('extracts the address from the labelled section', () => {
    const doc = parse(
      '<html><body><section><h2>住所</h2><div><p>北海道札幌市豊平区中の島1条5丁目4番1号</p></div></section></body></html>'
    );
    expect(extractAddressFromDetailDocument(doc)).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
  });

  it('ignores unrelated labelled sections', () => {
    const doc = parse(
      '<html><body><section><h2>営業時間</h2><div><p>07:00〜24:00</p></div></section></body></html>'
    );
    expect(extractAddressFromDetailDocument(doc)).toBeNull();
  });

  it('falls back to the parent element when the heading has no enclosing section', () => {
    const doc = parse(
      '<html><body><div><h2>住所</h2><p>北海道札幌市豊平区中の島1条5丁目4番1号</p></div></body></html>'
    );
    expect(extractAddressFromDetailDocument(doc)).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
  });

  it('returns null when the address section has no paragraph', () => {
    const doc = parse('<html><body><section><h2>住所</h2><div></div></section></body></html>');
    expect(extractAddressFromDetailDocument(doc)).toBeNull();
  });

  it('returns null when there is no h2 at all', () => {
    const doc = parse('<html><body><p>no headings here</p></body></html>');
    expect(extractAddressFromDetailDocument(doc)).toBeNull();
  });
});

describe('normalizeAddress', () => {
  it('converts full-width digits and symbols to half-width', () => {
    expect(normalizeAddress('東京都渋谷区１－２－３')).toBe('東京都渋谷区1-2-3');
  });

  it('trims leading/trailing whitespace and collapses consecutive whitespace', () => {
    expect(normalizeAddress('  東京都　　渋谷区  1-2-3  ')).toBe('東京都 渋谷区 1-2-3');
  });

  it('leaves an already-normalized address unchanged', () => {
    expect(normalizeAddress('北海道札幌市豊平区中の島1条5丁目4番1号')).toBe(
      '北海道札幌市豊平区中の島1条5丁目4番1号'
    );
  });
});

describe('buildGoogleMapsUrl', () => {
  it('builds a maps search URL with the encoded address as the query', () => {
    const url = buildGoogleMapsUrl('北海道札幌市豊平区中の島1条5丁目4番1号');
    expect(url.startsWith('https://www.google.com/maps/search/?')).toBe(true);
    expect(new URL(url).searchParams.get('query')).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
    expect(new URL(url).searchParams.get('api')).toBe('1');
  });
});

describe('buildGoogleSearchUrl', () => {
  it('builds a search URL with the encoded query', () => {
    const url = buildGoogleSearchUrl('銀のさら 札幌中央店');
    expect(url.startsWith('https://www.google.com/search?')).toBe(true);
    expect(new URL(url).searchParams.get('q')).toBe('銀のさら 札幌中央店');
  });
});

describe('buildShopDetailUrl', () => {
  it('builds the relative shop detail URL', () => {
    expect(buildShopDetailUrl('3451329')).toBe('/shopDetail/3451329');
  });
});

describe('buildShopMenuUrl', () => {
  it('builds the relative shop menu URL', () => {
    expect(buildShopMenuUrl('3451329')).toBe('/shop/menu/3451329');
  });
});

describe('mergeShopRecord', () => {
  it('creates a new record when there is no existing one', () => {
    expect(mergeShopRecord(undefined, { judgment: 'ghost' })).toEqual({ judgment: 'ghost' });
  });

  it('merges a patch into an existing record without losing other fields', () => {
    const existing = { address: '住所', judgment: 'not-ghost' as const };
    expect(mergeShopRecord(existing, { judgment: 'ghost' })).toEqual({
      address: '住所',
      judgment: 'ghost'
    });
  });
});

describe('clearJudgment', () => {
  it('returns undefined for an already-empty record', () => {
    expect(clearJudgment(undefined)).toBeUndefined();
  });

  it('drops the judgment and returns undefined when nothing else remains', () => {
    expect(clearJudgment({ judgment: 'ghost', judgedAt: 123 })).toBeUndefined();
  });

  it('drops the judgment but keeps other fields such as the cached address', () => {
    expect(clearJudgment({ judgment: 'ghost', judgedAt: 123, address: '住所' })).toEqual({
      address: '住所'
    });
  });
});

describe('shouldHideCard', () => {
  const ALL_VISIBLE = { ghost: true, notGhost: true, unjudged: true };

  it('hides a ghost-judged shop when the ghost checkbox is unchecked', () => {
    expect(shouldHideCard({ judgment: 'ghost' }, { ...ALL_VISIBLE, ghost: false })).toBe(true);
  });

  it('does not hide a ghost-judged shop when the ghost checkbox is checked', () => {
    expect(shouldHideCard({ judgment: 'ghost' }, ALL_VISIBLE)).toBe(false);
  });

  it('hides a not-ghost shop when the not-ghost checkbox is unchecked', () => {
    expect(shouldHideCard({ judgment: 'not-ghost' }, { ...ALL_VISIBLE, notGhost: false })).toBe(true);
  });

  it('does not hide a not-ghost shop when the not-ghost checkbox is checked', () => {
    expect(shouldHideCard({ judgment: 'not-ghost' }, ALL_VISIBLE)).toBe(false);
  });

  it('hides an unjudged shop when the unjudged checkbox is unchecked', () => {
    expect(shouldHideCard(undefined, { ...ALL_VISIBLE, unjudged: false })).toBe(true);
  });

  it('does not hide an unjudged shop when the unjudged checkbox is checked', () => {
    expect(shouldHideCard(undefined, ALL_VISIBLE)).toBe(false);
  });
});

describe('getBadgeLabel', () => {
  it('returns the ghost badge label', () => {
    expect(getBadgeLabel('ghost')).toBe('ゴースト');
  });

  it('returns the not-ghost badge label', () => {
    expect(getBadgeLabel('not-ghost')).toBe('実店舗');
  });

  it('returns null for unjudged shops', () => {
    expect(getBadgeLabel(undefined)).toBeNull();
  });
});

describe('getIconGlyph', () => {
  it('returns the ghost glyph', () => {
    expect(getIconGlyph('ghost')).toBe('👻');
  });

  it('returns the not-ghost glyph', () => {
    expect(getIconGlyph('not-ghost')).toBe('🏠');
  });

  it('returns the default info glyph for unjudged shops', () => {
    expect(getIconGlyph(undefined)).toBe('i');
  });
});
