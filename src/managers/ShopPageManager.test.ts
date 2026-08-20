import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { JudgmentManager } from './JudgmentManager';
import { ShopDetailFetcher } from './ShopDetailFetcher';
import { ShopPageManager } from './ShopPageManager';
import { ShopPageAdapter } from '../types';

const MENU_URL_PATTERN = /\/shop\/menu\/(\d+)/;
const DETAIL_URL_PATTERN = /\/shopDetail\/(\d+)/;

const DETAIL_HTML =
  '<html><body><section><h2>住所</h2><div><p>北海道札幌市豊平区中の島1条5丁目4番1号</p></div></section></body></html>';

function createTestAdapter(): ShopPageAdapter {
  return {
    match: url => MENU_URL_PATTERN.test(url) || DETAIL_URL_PATTERN.test(url),
    extractShopId: url => MENU_URL_PATTERN.exec(url)?.[1] ?? DETAIL_URL_PATTERN.exec(url)?.[1] ?? null,
    getShopName: () => '銀のさら'
  };
}

function navigateTo(path: string): void {
  window.history.pushState({}, '', path);
}

function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('ShopPageManager', () => {
  let store: Store;
  let judgmentManager: JudgmentManager;
  let fetcher: ShopDetailFetcher;
  let adapter: ShopPageAdapter;
  let manager: ShopPageManager;

  beforeEach(() => {
    setupGMStorageMock();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
    store = new Store();
    judgmentManager = new JudgmentManager(store);
    fetcher = new ShopDetailFetcher(store);
    adapter = createTestAdapter();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: async () => DETAIL_HTML })
    );
  });

  afterEach(() => {
    manager.destroy();
  });

  it('mounts the panel immediately on init when the current URL matches a shop page', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();
  });

  it('does not mount a panel on init when the current URL does not match a shop page', () => {
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    expect(document.querySelector('.ghosts-shop-page-panel')).toBeNull();
  });

  it('mounts the panel after SPA navigation into a shop page', () => {
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();
    expect(document.querySelector('.ghosts-shop-page-panel')).toBeNull();

    navigateTo('/shop/menu/123');

    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();
  });

  it('removes the panel after SPA navigation away from a shop page', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();
    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();

    navigateTo('/');

    expect(document.querySelector('.ghosts-shop-page-panel')).toBeNull();
  });

  it('rebuilds the panel for the new shopId when navigating directly between two shop pages', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    navigateTo('/shop/menu/456');

    const badge = document.querySelector('.ghosts-shop-page-panel .ghosts-badge')!;
    store.updateShopRecord('456', { judgment: 'ghost' });
    expect(badge.textContent).toBe('ゴースト');

    store.updateShopRecord('123', { judgment: 'not-ghost' });
    expect(badge.textContent).toBe('ゴースト');
  });

  it('does not rebuild the panel when navigating within the same shop page (unchanged shopId)', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();
    const panel = document.querySelector('.ghosts-shop-page-panel');

    navigateTo('/shop/menu/123?ref=foo');

    expect(document.querySelector('.ghosts-shop-page-panel')).toBe(panel);
  });

  it('embeds working judgment controls inside the mounted panel', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    const ghostBtn = document.querySelector<HTMLButtonElement>(
      '.ghosts-shop-page-panel .ghosts-judge-btn--ghost'
    )!;
    ghostBtn.click();

    expect(store.getShopRecord('123')?.judgment).toBe('ghost');
  });

  it('loads and displays the address, map link, and search link immediately on mount', async () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    expect(
      document.querySelector('.ghosts-shop-page-panel .ghosts-popover__address')!.textContent
    ).toBe('読み込み中...');

    await flushMicrotasks();

    expect(
      document.querySelector('.ghosts-shop-page-panel .ghosts-popover__address')!.textContent
    ).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
    const links = document.querySelectorAll<HTMLAnchorElement>(
      '.ghosts-shop-page-panel .ghosts-popover__links a'
    );
    expect(links[0].href).toContain('google.com/maps');
    expect(links[1].href).toContain('google.com/search');
  });

  it('shows the same address block behavior on a shopDetail URL', async () => {
    window.history.replaceState({}, '', '/shopDetail/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();
    await flushMicrotasks();

    expect(
      document.querySelector('.ghosts-shop-page-panel .ghosts-popover__address')!.textContent
    ).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
  });

  it('provides a working refetch button in the panel', async () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();
    await flushMicrotasks();
    expect(fetch).toHaveBeenCalledTimes(1);

    document
      .querySelector<HTMLButtonElement>('.ghosts-shop-page-panel .ghosts-popover__refetch')!
      .click();
    await flushMicrotasks();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shows an error state in the panel when the address fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();

    await flushMicrotasks();

    expect(
      document.querySelector('.ghosts-shop-page-panel .ghosts-popover__address')!.textContent
    ).toBe('住所を取得できませんでした');
  });

  it('rebuilds the address block for the new shopId when navigating between shop pages', async () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager, fetcher);
    manager.init();
    await flushMicrotasks();
    expect(fetch).toHaveBeenCalledWith('/shopDetail/123');

    navigateTo('/shop/menu/456');
    await flushMicrotasks();

    expect(fetch).toHaveBeenCalledWith('/shopDetail/456');
  });
});
