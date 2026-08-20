import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { ShopDetailFetcher } from './ShopDetailFetcher';
import { JudgmentManager } from './JudgmentManager';
import { CardOverlayManager } from './CardOverlayManager';
import { ListingAdapter } from '../types';

const DETAIL_HTML =
  '<html><body><section><h2>住所</h2><div><p>北海道札幌市豊平区中の島1条5丁目4番1号</p></div></section></body></html>';

function createTestAdapter(): ListingAdapter {
  return {
    match: () => true,
    getListingContainer: () => document.getElementById('listing'),
    getShopCards: root => Array.from(root.querySelectorAll<HTMLElement>('[data-shop-card]')),
    matchesShopCard: el => el.matches('[data-shop-card]'),
    extractShopId: card => card.getAttribute('data-shop-id'),
    extractShopName: card => card.getAttribute('data-shop-name')
  };
}

function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('CardOverlayManager', () => {
  let store: Store;
  let fetcher: ShopDetailFetcher;
  let judgmentManager: JudgmentManager;
  let adapter: ListingAdapter;

  beforeEach(() => {
    setupGMStorageMock();
    document.body.innerHTML = '<div id="listing"></div>';
    document.head.innerHTML = '';
    store = new Store();
    fetcher = new ShopDetailFetcher(store);
    judgmentManager = new JudgmentManager(store);
    adapter = createTestAdapter();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: async () => DETAIL_HTML })
    );
  });

  it('decorates existing cards on init with an icon and popover', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';

    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const card = document.querySelector('article')!;
    expect(card.querySelector('.ghosts-icon-btn')).not.toBeNull();
    expect(card.querySelector('.ghosts-popover')).not.toBeNull();
  });

  it('does not add a judgment badge to the card', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';

    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const card = document.querySelector('article')!;
    expect(card.querySelector('.ghosts-badge')).toBeNull();
  });

  it('shows the default info glyph on the icon for an unjudged shop', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';

    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const icon = document.querySelector('.ghosts-icon-btn')!;
    expect(icon.textContent).toBe('i');
  });

  it('shows the ghost glyph on the icon once judged as ghost', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';

    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    store.updateShopRecord('123', { judgment: 'ghost' });

    const icon = document.querySelector('.ghosts-icon-btn')!;
    expect(icon.textContent).toBe('👻');
  });

  it('shows the not-ghost glyph on the icon once judged as not-ghost', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';

    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    store.updateShopRecord('123', { judgment: 'not-ghost' });

    const icon = document.querySelector('.ghosts-icon-btn')!;
    expect(icon.textContent).toBe('🏠');
  });

  it('does not decorate a card twice', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();
    manager.decorateCard(document.querySelector('article')!);

    expect(document.querySelectorAll('.ghosts-icon-btn')).toHaveLength(1);
  });

  it('skips a card whose shopId cannot be extracted', () => {
    document.getElementById('listing')!.innerHTML = '<article data-shop-card>no id</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    expect(document.querySelector('.ghosts-icon-btn')).toBeNull();
  });

  it('fetches and displays the address when the icon is clicked', async () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const card = document.querySelector('article')!;
    const icon = card.querySelector<HTMLButtonElement>('.ghosts-icon-btn')!;
    const popover = card.querySelector('.ghosts-popover')!;

    icon.click();
    expect(popover.classList.contains('ghosts-popover--open')).toBe(true);
    expect(popover.querySelector('.ghosts-popover__address')!.textContent).toBe('読み込み中...');

    await flushMicrotasks();

    expect(popover.querySelector('.ghosts-popover__address')!.textContent).toBe(
      '北海道札幌市豊平区中の島1条5丁目4番1号'
    );
    const mapLink = popover.querySelector<HTMLAnchorElement>('.ghosts-popover__links a')!;
    expect(mapLink.href).toContain('google.com/maps');
  });

  it('toggles the popover closed on a second icon click', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const icon = document.querySelector<HTMLButtonElement>('.ghosts-icon-btn')!;
    const popover = document.querySelector('.ghosts-popover')!;

    icon.click();
    expect(popover.classList.contains('ghosts-popover--open')).toBe(true);
    icon.click();
    expect(popover.classList.contains('ghosts-popover--open')).toBe(false);
  });

  it('closes the popover when clicking outside the card', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const icon = document.querySelector<HTMLButtonElement>('.ghosts-icon-btn')!;
    const popover = document.querySelector('.ghosts-popover')!;
    icon.click();
    expect(popover.classList.contains('ghosts-popover--open')).toBe(true);

    document.body.click();
    expect(popover.classList.contains('ghosts-popover--open')).toBe(false);
  });

  it('re-fetches the address when the refetch button is clicked', async () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    document.querySelector<HTMLButtonElement>('.ghosts-icon-btn')!.click();
    await flushMicrotasks();
    expect(fetch).toHaveBeenCalledTimes(1);

    document.querySelector<HTMLButtonElement>('.ghosts-popover__refetch')!.click();
    await flushMicrotasks();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shows an error message when the address cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    document.querySelector<HTMLButtonElement>('.ghosts-icon-btn')!.click();
    await flushMicrotasks();

    expect(document.querySelector('.ghosts-popover__address')!.textContent).toBe(
      '住所を取得できませんでした'
    );
  });

  it('decorates cards added dynamically after init (e.g. load-more)', async () => {
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const listing = document.getElementById('listing')!;
    listing.innerHTML +=
      '<article data-shop-card data-shop-id="999" data-shop-name="新店舗">card</article>';

    await flushMicrotasks();

    const card = listing.querySelector('article')!;
    expect(card.querySelector('.ghosts-icon-btn')).not.toBeNull();
  });

  it('invokes the onDecorate callback with the shopId and card', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const onDecorate = vi.fn();
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager, onDecorate);
    manager.init();

    expect(onDecorate).toHaveBeenCalledWith('123', document.querySelector('article'));
  });

  it('opens the popover on hover over the icon, closing shortly after leaving it', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const card = document.querySelector('article')!;
    const icon = card.querySelector('.ghosts-icon-btn')!;
    const popover = card.querySelector('.ghosts-popover')!;

    icon.dispatchEvent(new MouseEvent('mouseenter'));
    expect(popover.classList.contains('ghosts-popover--open')).toBe(true);

    icon.dispatchEvent(new MouseEvent('mouseleave'));
    expect(popover.classList.contains('ghosts-popover--open')).toBe(true);

    vi.advanceTimersByTime(250);
    expect(popover.classList.contains('ghosts-popover--open')).toBe(false);

    vi.useRealTimers();
  });

  it('stays open when the cursor moves from the icon into the popover before the close delay elapses', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const card = document.querySelector('article')!;
    const icon = card.querySelector('.ghosts-icon-btn')!;
    const popover = card.querySelector('.ghosts-popover')!;

    icon.dispatchEvent(new MouseEvent('mouseenter'));
    icon.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(100);
    popover.dispatchEvent(new MouseEvent('mouseenter'));

    vi.advanceTimersByTime(1000);
    expect(popover.classList.contains('ghosts-popover--open')).toBe(true);

    popover.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(250);
    expect(popover.classList.contains('ghosts-popover--open')).toBe(false);

    vi.useRealTimers();
  });

  it('does not open the popover when hovering over the card outside the icon', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const card = document.querySelector('article')!;
    const popover = card.querySelector('.ghosts-popover')!;

    card.dispatchEvent(new MouseEvent('mouseenter'));
    expect(popover.classList.contains('ghosts-popover--open')).toBe(false);
  });

  it('does nothing when the listing container is not found', () => {
    document.body.innerHTML = '';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    expect(() => { manager.init(); }).not.toThrow();
  });

  it('embeds working judgment controls inside the popover', () => {
    document.getElementById('listing')!.innerHTML =
      '<article data-shop-card data-shop-id="123" data-shop-name="銀のさら">card</article>';
    const manager = new CardOverlayManager(adapter, fetcher, judgmentManager);
    manager.init();

    const icon = document.querySelector<HTMLButtonElement>('.ghosts-icon-btn')!;
    icon.click();
    const ghostBtn = document.querySelector<HTMLButtonElement>('.ghosts-judge-btn--ghost')!;
    ghostBtn.click();

    expect(store.getShopRecord('123')?.judgment).toBe('ghost');
    expect(icon.textContent).toBe('👻');
  });
});
