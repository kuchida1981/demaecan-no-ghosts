import { describe, it, expect, beforeEach } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { FilterManager } from './FilterManager';

function getCheckbox(index: number): HTMLInputElement {
  return document.querySelectorAll<HTMLInputElement>('.ghosts-filter-panel input[type="checkbox"]')[index];
}

describe('FilterManager', () => {
  let store: Store;
  let manager: FilterManager;

  beforeEach(() => {
    setupGMStorageMock();
    document.body.innerHTML = '';
    store = new Store();
    manager = new FilterManager(store);
  });

  it('mounts three judgment checkboxes reflecting the persisted visible-judgments state', () => {
    manager.init();
    const checkboxes = [getCheckbox(0), getCheckbox(1), getCheckbox(2)];
    checkboxes.forEach(checkbox => { expect(checkbox.checked).toBe(true); });
  });

  it('mounts a checkbox unchecked when its judgment was previously hidden', () => {
    store.toggleJudgmentVisibility('ghost', false);
    manager.init();
    expect(getCheckbox(0).checked).toBe(false);
  });

  it('updates the store when the ghost checkbox is toggled', () => {
    manager.init();
    const checkbox = getCheckbox(0);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    expect(store.getState().visibleJudgments.ghost).toBe(false);
  });

  it('hides a registered card judged as ghost once the ghost checkbox is unchecked', () => {
    manager.init();
    const card = document.createElement('article');
    store.updateShopRecord('123', { judgment: 'ghost' });
    manager.registerCard('123', card);

    expect(card.classList.contains('ghosts-hidden')).toBe(false);

    store.toggleJudgmentVisibility('ghost', false);
    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  it('does not hide not-ghost or unjudged cards when only the ghost checkbox is unchecked', () => {
    manager.init();
    const notGhostCard = document.createElement('article');
    const unknownCard = document.createElement('article');
    store.updateShopRecord('1', { judgment: 'not-ghost' });
    manager.registerCard('1', notGhostCard);
    manager.registerCard('2', unknownCard);

    store.toggleJudgmentVisibility('ghost', false);

    expect(notGhostCard.classList.contains('ghosts-hidden')).toBe(false);
    expect(unknownCard.classList.contains('ghosts-hidden')).toBe(false);
  });

  it('restores hidden cards when their checkbox is checked again', () => {
    manager.init();
    const card = document.createElement('article');
    store.updateShopRecord('123', { judgment: 'ghost' });
    manager.registerCard('123', card);
    store.toggleJudgmentVisibility('ghost', false);
    expect(card.classList.contains('ghosts-hidden')).toBe(true);

    store.toggleJudgmentVisibility('ghost', true);
    expect(card.classList.contains('ghosts-hidden')).toBe(false);
  });

  it('hides a newly registered ghost card immediately when the ghost checkbox is already unchecked', () => {
    manager.init();
    store.toggleJudgmentVisibility('ghost', false);
    store.updateShopRecord('123', { judgment: 'ghost' });

    const card = document.createElement('article');
    manager.registerCard('123', card);

    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  it('hides a visible card immediately when it is judged as ghost while the ghost checkbox is unchecked', () => {
    manager.init();
    store.toggleJudgmentVisibility('ghost', false);
    const card = document.createElement('article');
    manager.registerCard('123', card);
    expect(card.classList.contains('ghosts-hidden')).toBe(false);

    store.updateShopRecord('123', { judgment: 'ghost' });
    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  it('applies the current filter state before init() mounts the checkboxes', () => {
    const card = document.createElement('article');
    store.updateShopRecord('123', { judgment: 'ghost' });
    store.toggleJudgmentVisibility('ghost', false);
    manager.registerCard('123', card);

    expect(card.classList.contains('ghosts-hidden')).toBe(true);
  });

  function getAddressCheckbox(): HTMLInputElement {
    return document.querySelectorAll<HTMLInputElement>('.ghosts-filter-panel input[type="checkbox"]')[3];
  }

  it('mounts an address-display checkbox reflecting the persisted prefetch-enabled flag', () => {
    manager.init();
    expect(getAddressCheckbox().checked).toBe(true);
  });

  it('mounts the address-display checkbox unchecked when prefetching was previously disabled', () => {
    store.setAddressPrefetchEnabled(false);
    manager.init();
    expect(getAddressCheckbox().checked).toBe(false);
  });

  it('updates the store when the address-display checkbox is toggled', () => {
    manager.init();
    const checkbox = getAddressCheckbox();

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    expect(store.getState().addressPrefetchEnabled).toBe(false);
  });

  it('reflects an address-display flag change made elsewhere', () => {
    manager.init();
    store.setAddressPrefetchEnabled(false);

    expect(getAddressCheckbox().checked).toBe(false);
  });
});
