import { describe, it, expect, beforeEach } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { FilterManager } from './FilterManager';

describe('FilterManager', () => {
  let store: Store;
  let manager: FilterManager;

  beforeEach(() => {
    setupGMStorageMock();
    document.body.innerHTML = '';
    store = new Store();
    manager = new FilterManager(store);
  });

  it('mounts a toggle panel reflecting the persisted filter state', () => {
    manager.init();
    const checkbox = document.querySelector<HTMLInputElement>('.ghosts-filter-panel input[type="checkbox"]')!;
    expect(checkbox.checked).toBe(false);
  });

  it('mounts the toggle already checked when the filter was previously enabled', () => {
    store.setFilterEnabled(true);
    manager.init();
    const checkbox = document.querySelector<HTMLInputElement>('.ghosts-filter-panel input[type="checkbox"]')!;
    expect(checkbox.checked).toBe(true);
  });

  it('updates the store when the checkbox is toggled', () => {
    manager.init();
    const checkbox = document.querySelector<HTMLInputElement>('.ghosts-filter-panel input[type="checkbox"]')!;

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(store.getState().filterEnabled).toBe(true);
  });

  it('hides a registered card judged as ghost once the filter is enabled', () => {
    manager.init();
    const card = document.createElement('article');
    store.updateShopRecord('123', { judgment: 'ghost' });
    manager.registerCard('123', card);

    expect(card.classList.contains('ghosts-hidden')).toBe(false);

    store.setFilterEnabled(true);
    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  it('does not hide not-ghost or unjudged cards when the filter is enabled', () => {
    manager.init();
    const notGhostCard = document.createElement('article');
    const unknownCard = document.createElement('article');
    store.updateShopRecord('1', { judgment: 'not-ghost' });
    manager.registerCard('1', notGhostCard);
    manager.registerCard('2', unknownCard);

    store.setFilterEnabled(true);

    expect(notGhostCard.classList.contains('ghosts-hidden')).toBe(false);
    expect(unknownCard.classList.contains('ghosts-hidden')).toBe(false);
  });

  it('restores hidden cards when the filter is disabled', () => {
    manager.init();
    const card = document.createElement('article');
    store.updateShopRecord('123', { judgment: 'ghost' });
    manager.registerCard('123', card);
    store.setFilterEnabled(true);
    expect(card.classList.contains('ghosts-hidden')).toBe(true);

    store.setFilterEnabled(false);
    expect(card.classList.contains('ghosts-hidden')).toBe(false);
  });

  it('hides a newly registered ghost card immediately when the filter is already on', () => {
    manager.init();
    store.setFilterEnabled(true);
    store.updateShopRecord('123', { judgment: 'ghost' });

    const card = document.createElement('article');
    manager.registerCard('123', card);

    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  it('hides a visible card immediately when it is judged as ghost while the filter is on', () => {
    manager.init();
    store.setFilterEnabled(true);
    const card = document.createElement('article');
    manager.registerCard('123', card);
    expect(card.classList.contains('ghosts-hidden')).toBe(false);

    store.updateShopRecord('123', { judgment: 'ghost' });
    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  it('applies the current filter state before init() mounts the checkbox', () => {
    const card = document.createElement('article');
    store.updateShopRecord('123', { judgment: 'ghost' });
    store.setFilterEnabled(true);
    manager.registerCard('123', card);

    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });
});
