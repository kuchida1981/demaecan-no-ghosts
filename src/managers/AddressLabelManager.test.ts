import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { AddressLabelManager } from './AddressLabelManager';
import { ListingAdapter } from '../types';

function buildAriaLabelledByCard(shopId: string, shopName: string): HTMLElement {
  const card = document.createElement('article');
  card.setAttribute('aria-labelledby', `shoplist-${shopId}-shopname`);
  card.innerHTML = `<p id="shoplist-${shopId}-shopname">${shopName}</p>`;
  return card;
}

function createTestAdapter(): ListingAdapter {
  return {
    match: () => true,
    getListingContainer: () => document.body,
    getShopCards: root => Array.from(root.querySelectorAll<HTMLElement>('article')),
    matchesShopCard: el => el.matches('article'),
    extractShopId: card => card.getAttribute('data-shop-id'),
    extractShopName: card => card.querySelector('p')?.textContent ?? null,
    extractShopNameElement: card => card.querySelector('p')
  };
}

function getLabel(card: HTMLElement): HTMLElement {
  return card.querySelector('.ghosts-address-label')!;
}

// The tooltip is mounted directly under document.body (see AddressLabelManager
// for why), so it's looked up globally rather than scoped to the card.
function getLastTooltip(): HTMLElement {
  const tooltips = document.querySelectorAll<HTMLElement>('.ghosts-address-tooltip');
  return tooltips[tooltips.length - 1];
}

describe('AddressLabelManager', () => {
  let store: Store;
  let adapter: ListingAdapter;
  let manager: AddressLabelManager;

  beforeEach(() => {
    setupGMStorageMock();
    document.body.innerHTML = '';
    store = new Store();
    adapter = createTestAdapter();
    manager = new AddressLabelManager(adapter, store);
  });

  it('inserts an address label right after the shop-name element', () => {
    const card = buildAriaLabelledByCard('123', '銀のさら');
    document.body.appendChild(card);

    manager.decorateCard('123', card);

    const nameEl = card.querySelector('p')!;
    expect(nameEl.nextElementSibling).toBe(getLabel(card));
  });

  it('shows the cached address immediately', () => {
    const card = buildAriaLabelledByCard('123', '銀のさら');
    store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });

    manager.decorateCard('123', card);

    expect(getLabel(card).textContent).toBe('東京都渋谷区1-2-3');
  });

  it('updates the label once the address arrives later', () => {
    const card = buildAriaLabelledByCard('123', '銀のさら');
    manager.decorateCard('123', card);
    expect(getLabel(card).textContent).toBe('');

    store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });

    expect(getLabel(card).textContent).toBe('東京都渋谷区1-2-3');
  });

  it('does not insert a label for a card with no identifiable shop-name element', () => {
    const linkBasedAdapter: ListingAdapter = { ...adapter, extractShopNameElement: () => null };
    manager = new AddressLabelManager(linkBasedAdapter, store);
    const card = buildAriaLabelledByCard('123', '銀のさら');

    manager.decorateCard('123', card);

    expect(card.querySelector('.ghosts-address-label')).toBeNull();
  });

  it('hides the label when address display is disabled', () => {
    const card = buildAriaLabelledByCard('123', '銀のさら');
    store.setAddressPrefetchEnabled(false);

    manager.decorateCard('123', card);

    expect(getLabel(card).classList.contains('ghosts-address-label--hidden')).toBe(true);
  });

  it('shows the label again when address display is re-enabled', () => {
    const card = buildAriaLabelledByCard('123', '銀のさら');
    store.setAddressPrefetchEnabled(false);
    manager.decorateCard('123', card);

    store.setAddressPrefetchEnabled(true);

    expect(getLabel(card).classList.contains('ghosts-address-label--hidden')).toBe(false);
  });

  describe('hover/click tooltip', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal('matchMedia', () => ({ matches: true }));
      vi.stubGlobal('open', vi.fn());
    });

    it('does not open a tooltip when no other shop shares the address', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      manager.decorateCard('123', card);

      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));

      const tooltip = getLastTooltip();
      expect(tooltip.classList.contains('ghosts-address-tooltip--open')).toBe(false);
      expect(tooltip.children).toHaveLength(0);
    });

    it('lists other shops sharing the same normalized address on hover', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区１－２－３', name: '銀のさら' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));

      const tooltip = getLastTooltip();
      expect(tooltip.classList.contains('ghosts-address-tooltip--open')).toBe(true);
      expect(tooltip.textContent).toContain('隣の店');
      expect(tooltip.textContent).not.toContain('銀のさら');
    });

    it('falls back to the shopId when the other shop has no cached name', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3' });
      manager.decorateCard('123', card);

      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));

      expect(getLastTooltip().textContent).toContain('456');
    });

    it('opens the target shop menu page in a new tab when a listed shop is activated', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);
      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));

      getLastTooltip().querySelector('button')!.click();

      expect(window.open).toHaveBeenCalledWith('/shop/menu/456', '_blank', 'noopener,noreferrer');
    });

    it('closes shortly after the cursor leaves the label', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));
      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(true);

      getLabel(card).dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(250);

      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(false);
    });

    it('toggles the tooltip open and closed on click', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      getLabel(card).click();
      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(true);

      getLabel(card).click();
      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(false);
    });

    it('closes an open tooltip when address display is disabled', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      getLabel(card).click();
      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(true);

      store.setAddressPrefetchEnabled(false);

      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(false);
    });

    it('closes the tooltip when the page is scrolled', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      getLabel(card).click();
      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(true);

      window.dispatchEvent(new Event('scroll'));

      expect(getLastTooltip().classList.contains('ghosts-address-tooltip--open')).toBe(false);
    });

    it('positions the tooltip against the label, opening downward when there is room', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      const label = getLabel(card);
      vi.spyOn(label, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 120, left: 50 } as DOMRect);
      const tooltip = getLastTooltip();
      vi.spyOn(tooltip, 'getBoundingClientRect').mockReturnValue({ height: 80 } as DOMRect);

      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));

      expect(tooltip.style.left).toBe('50px');
      expect(tooltip.style.top).toBe('120px');
    });

    it('opens upward when there is not enough room below in the viewport', () => {
      const card = buildAriaLabelledByCard('123', '銀のさら');
      store.updateShopRecord('123', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3', name: '隣の店' });
      manager.decorateCard('123', card);

      const label = getLabel(card);
      vi.spyOn(label, 'getBoundingClientRect').mockReturnValue({
        top: window.innerHeight - 10,
        bottom: window.innerHeight,
        left: 50
      } as DOMRect);
      const tooltip = getLastTooltip();
      vi.spyOn(tooltip, 'getBoundingClientRect').mockReturnValue({ height: 200 } as DOMRect);

      getLabel(card).dispatchEvent(new MouseEvent('mouseenter'));

      expect(tooltip.style.top).toBe(`${window.innerHeight - 10 - 200}px`);
    });
  });
});
