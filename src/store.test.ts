import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGMStorageMock } from './test/mocks/gm_storage';
import { Store, STORAGE_KEYS } from './store';

describe('Store', () => {
  beforeEach(() => {
    setupGMStorageMock();
  });

  it('starts with empty shop records, all judgments visible, and prefetch enabled by default', () => {
    const store = new Store();
    expect(store.getState()).toEqual({
      shopRecords: {},
      visibleJudgments: { ghost: true, notGhost: true, unjudged: true },
      addressPrefetchEnabled: true
    });
  });

  it('loads previously persisted shop records, visible-judgments, and prefetch-enabled state', () => {
    GM_setValue(STORAGE_KEYS.SHOP_RECORDS, JSON.stringify({ '123': { judgment: 'ghost' } }));
    GM_setValue(STORAGE_KEYS.VISIBLE_JUDGMENTS, JSON.stringify({ ghost: false, notGhost: true, unjudged: true }));
    GM_setValue(STORAGE_KEYS.ADDRESS_PREFETCH_ENABLED, 'false');

    const store = new Store();
    expect(store.getState()).toEqual({
      shopRecords: { '123': { judgment: 'ghost' } },
      visibleJudgments: { ghost: false, notGhost: true, unjudged: true },
      addressPrefetchEnabled: false
    });
  });

  it('falls back to all judgments visible when persisted JSON is invalid', () => {
    GM_setValue(STORAGE_KEYS.VISIBLE_JUDGMENTS, 'not json');
    const store = new Store();
    expect(store.getState().visibleJudgments).toEqual({ ghost: true, notGhost: true, unjudged: true });
  });

  it('ignores a legacy filterEnabled value and starts with all judgments visible', () => {
    GM_setValue(STORAGE_KEYS.FILTER_ENABLED, 'true');
    const store = new Store();
    expect(store.getState().visibleJudgments).toEqual({ ghost: true, notGhost: true, unjudged: true });
  });

  it('falls back to empty records when persisted JSON is invalid', () => {
    GM_setValue(STORAGE_KEYS.SHOP_RECORDS, 'not json');
    const store = new Store();
    expect(store.getState().shopRecords).toEqual({});
  });

  it('updates a shop record in memory immediately and persists it once flushed', () => {
    const store = new Store();
    store.updateShopRecord('123', { judgment: 'ghost' });

    expect(store.getShopRecord('123')).toEqual({ judgment: 'ghost' });
    expect(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)).toBeUndefined();

    store.flush();
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
    store.flush();

    expect(store.getShopRecord('123')).toBeUndefined();
    expect(JSON.parse(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)!)).toEqual({});
  });

  it('is a no-op when clearing a judgment for a shop with no record', () => {
    const store = new Store();
    store.clearShopJudgment('unknown-shop');
    expect(store.getShopRecord('unknown-shop')).toBeUndefined();
  });

  it('updates and persists a judgment visibility toggle', () => {
    const store = new Store();
    store.toggleJudgmentVisibility('ghost', false);

    expect(store.getState().visibleJudgments).toEqual({ ghost: false, notGhost: true, unjudged: true });
    expect(JSON.parse(GM_getValue(STORAGE_KEYS.VISIBLE_JUDGMENTS)!)).toEqual({
      ghost: false,
      notGhost: true,
      unjudged: true
    });
  });

  it('does not notify listeners when toggling a judgment to its current value', () => {
    const store = new Store();
    const listener = vi.fn();
    store.subscribe(listener);

    store.toggleJudgmentVisibility('ghost', true);
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

  describe('debounced persistence', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('collapses rapid successive updates into a single persisted write', () => {
      const store = new Store();
      const setValueSpy = vi.spyOn(globalThis, 'GM_setValue');

      store.updateShopRecord('123', { address: '住所A' });
      store.updateShopRecord('456', { address: '住所B' });
      store.updateShopRecord('123', { judgment: 'ghost' });

      const shopRecordWrites = setValueSpy.mock.calls.filter(([key]) => key === STORAGE_KEYS.SHOP_RECORDS);
      expect(shopRecordWrites).toHaveLength(0);

      vi.advanceTimersByTime(800);

      const finalShopRecordWrites = setValueSpy.mock.calls.filter(([key]) => key === STORAGE_KEYS.SHOP_RECORDS);
      expect(finalShopRecordWrites).toHaveLength(1);
      expect(JSON.parse(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)!)).toEqual({
        '123': { address: '住所A', judgment: 'ghost' },
        '456': { address: '住所B' }
      });
    });

    it('flushes a pending write immediately on beforeunload', () => {
      const store = new Store();
      store.updateShopRecord('123', { address: '住所A' });
      expect(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)).toBeUndefined();

      window.dispatchEvent(new Event('beforeunload'));

      expect(JSON.parse(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)!)).toEqual({
        '123': { address: '住所A' }
      });
    });

    it('flushes a pending write immediately on pagehide', () => {
      const store = new Store();
      store.updateShopRecord('123', { address: '住所A' });

      window.dispatchEvent(new Event('pagehide'));

      expect(JSON.parse(GM_getValue(STORAGE_KEYS.SHOP_RECORDS)!)).toEqual({
        '123': { address: '住所A' }
      });
    });

    it('is a no-op to flush when there is no pending write', () => {
      const store = new Store();
      const setValueSpy = vi.spyOn(globalThis, 'GM_setValue');

      store.flush();

      expect(setValueSpy).not.toHaveBeenCalled();
    });
  });

  describe('getShopIdsByNormalizedAddress', () => {
    it('returns shopIds whose address normalizes to the same value', () => {
      const store = new Store();
      store.updateShopRecord('123', { address: '東京都渋谷区１－２－３' });
      store.updateShopRecord('456', { address: '東京都渋谷区1-2-3' });
      store.updateShopRecord('789', { address: '別の住所' });

      const shopIds = store.getShopIdsByNormalizedAddress('東京都渋谷区1-2-3').sort();
      expect(shopIds).toEqual(['123', '456']);
    });

    it('excludes shops with no cached address', () => {
      const store = new Store();
      store.updateShopRecord('123', { judgment: 'ghost' });

      expect(store.getShopIdsByNormalizedAddress('')).toEqual([]);
    });
  });

  describe('setAddressPrefetchEnabled', () => {
    it('updates and persists the prefetch-enabled flag', () => {
      const store = new Store();
      store.setAddressPrefetchEnabled(false);

      expect(store.getState().addressPrefetchEnabled).toBe(false);
      expect(GM_getValue(STORAGE_KEYS.ADDRESS_PREFETCH_ENABLED)).toBe('false');
    });

    it('does not notify listeners when set to its current value', () => {
      const store = new Store();
      const listener = vi.fn();
      store.subscribe(listener);

      store.setAddressPrefetchEnabled(true);
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies listeners when the flag changes', () => {
      const store = new Store();
      const listener = vi.fn();
      store.subscribe(listener);

      store.setAddressPrefetchEnabled(false);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ addressPrefetchEnabled: false }));
    });
  });
});
