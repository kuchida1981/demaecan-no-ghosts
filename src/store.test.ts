import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGMStorageMock } from './test/mocks/gm_storage';
import { Store, STORAGE_KEYS } from './store';

describe('Store', () => {
  beforeEach(() => {
    setupGMStorageMock();
  });

  it('starts with empty shop records and filter disabled by default', () => {
    const store = new Store();
    expect(store.getState()).toEqual({ shopRecords: {}, filterEnabled: false });
  });

  it('loads previously persisted shop records and filter state', () => {
    GM_setValue(STORAGE_KEYS.SHOP_RECORDS, JSON.stringify({ '123': { judgment: 'ghost' } }));
    GM_setValue(STORAGE_KEYS.FILTER_ENABLED, 'true');

    const store = new Store();
    expect(store.getState()).toEqual({
      shopRecords: { '123': { judgment: 'ghost' } },
      filterEnabled: true
    });
  });

  it('falls back to empty records when persisted JSON is invalid', () => {
    GM_setValue(STORAGE_KEYS.SHOP_RECORDS, 'not json');
    const store = new Store();
    expect(store.getState().shopRecords).toEqual({});
  });

  it('updates and persists a shop record', () => {
    const store = new Store();
    store.updateShopRecord('123', { judgment: 'ghost' });

    expect(store.getShopRecord('123')).toEqual({ judgment: 'ghost' });
    expect(JSON.parse(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)!)).toEqual({
      '123': { judgment: 'ghost' }
    });
  });

  it('merges patches into an existing shop record', () => {
    const store = new Store();
    store.updateShopRecord('123', { address: '住所' });
    store.updateShopRecord('123', { judgment: 'not-ghost' });

    expect(store.getShopRecord('123')).toEqual({ address: '住所', judgment: 'not-ghost' });
  });

  it('clears a judgment while keeping other cached data', () => {
    const store = new Store();
    store.updateShopRecord('123', { address: '住所', judgment: 'ghost' });
    store.clearShopJudgment('123');

    expect(store.getShopRecord('123')).toEqual({ address: '住所' });
  });

  it('removes the record entirely when clearing leaves nothing behind', () => {
    const store = new Store();
    store.updateShopRecord('123', { judgment: 'ghost' });
    store.clearShopJudgment('123');

    expect(store.getShopRecord('123')).toBeUndefined();
    expect(JSON.parse(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)!)).toEqual({});
  });

  it('is a no-op when clearing a judgment for a shop with no record', () => {
    const store = new Store();
    store.clearShopJudgment('unknown-shop');
    expect(store.getShopRecord('unknown-shop')).toBeUndefined();
  });

  it('updates and persists the filter toggle state', () => {
    const store = new Store();
    store.setFilterEnabled(true);

    expect(store.getState().filterEnabled).toBe(true);
    expect(GM_getValue(STORAGE_KEYS.FILTER_ENABLED)).toBe('true');
  });

  it('does not notify listeners when setting the filter to its current value', () => {
    const store = new Store();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setFilterEnabled(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies subscribers on shop record updates', () => {
    const store = new Store();
    const listener = vi.fn();
    store.subscribe(listener);

    store.updateShopRecord('123', { judgment: 'ghost' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ shopRecords: { '123': { judgment: 'ghost' } } })
    );
  });

  it('allows unsubscribing from updates', () => {
    const store = new Store();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    store.updateShopRecord('123', { judgment: 'ghost' });
    expect(listener).not.toHaveBeenCalled();
  });
});
