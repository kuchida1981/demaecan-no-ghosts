import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { JudgmentManager } from './JudgmentManager';
import { ShopPageManager } from './ShopPageManager';
import { ShopPageAdapter } from '../types';

const SHOP_PAGE_URL_PATTERN = /\/shop\/menu\/(\d+)/;

function createTestAdapter(): ShopPageAdapter {
  return {
    match: url => SHOP_PAGE_URL_PATTERN.test(url),
    extractShopId: url => SHOP_PAGE_URL_PATTERN.exec(url)?.[1] ?? null,
    getShopName: () => null
  };
}

function navigateTo(path: string): void {
  window.history.pushState({}, '', path);
}

describe('ShopPageManager', () => {
  let store: Store;
  let judgmentManager: JudgmentManager;
  let adapter: ShopPageAdapter;
  let manager: ShopPageManager;

  beforeEach(() => {
    setupGMStorageMock();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
    store = new Store();
    judgmentManager = new JudgmentManager(store);
    adapter = createTestAdapter();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('mounts the panel immediately on init when the current URL matches a shop page', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager);
    manager.init();

    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();
  });

  it('does not mount a panel on init when the current URL does not match a shop page', () => {
    manager = new ShopPageManager(adapter, judgmentManager);
    manager.init();

    expect(document.querySelector('.ghosts-shop-page-panel')).toBeNull();
  });

  it('mounts the panel after SPA navigation into a shop page', () => {
    manager = new ShopPageManager(adapter, judgmentManager);
    manager.init();
    expect(document.querySelector('.ghosts-shop-page-panel')).toBeNull();

    navigateTo('/shop/menu/123');

    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();
  });

  it('removes the panel after SPA navigation away from a shop page', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager);
    manager.init();
    expect(document.querySelector('.ghosts-shop-page-panel')).not.toBeNull();

    navigateTo('/');

    expect(document.querySelector('.ghosts-shop-page-panel')).toBeNull();
  });

  it('rebuilds the panel for the new shopId when navigating directly between two shop pages', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager);
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
    manager = new ShopPageManager(adapter, judgmentManager);
    manager.init();
    const panel = document.querySelector('.ghosts-shop-page-panel');

    navigateTo('/shop/menu/123?ref=foo');

    expect(document.querySelector('.ghosts-shop-page-panel')).toBe(panel);
  });

  it('embeds working judgment controls inside the mounted panel', () => {
    window.history.replaceState({}, '', '/shop/menu/123');
    manager = new ShopPageManager(adapter, judgmentManager);
    manager.init();

    const ghostBtn = document.querySelector<HTMLButtonElement>(
      '.ghosts-shop-page-panel .ghosts-judge-btn--ghost'
    )!;
    ghostBtn.click();

    expect(store.getShopRecord('123')?.judgment).toBe('ghost');
  });
});
