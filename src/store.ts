import { ShopId, ShopRecord, ShopRecords, VisibleJudgments } from './types';
import { mergeShopRecord, clearJudgment, normalizeAddress } from './logic';

export const STORAGE_KEYS = {
  SHOP_RECORDS: 'demaecan-no-ghosts-shop-records',
  FILTER_ENABLED: 'demaecan-no-ghosts-filter-enabled',
  VISIBLE_JUDGMENTS: 'demaecan-no-ghosts-visible-judgments',
  ADDRESS_PREFETCH_ENABLED: 'demaecan-no-ghosts-address-prefetch-enabled'
} as const;

const DEFAULT_VISIBLE_JUDGMENTS: VisibleJudgments = { ghost: true, notGhost: true, unjudged: true };

// Short enough that a burst of prefetch resolutions still lands as one write,
// long enough to avoid a GM_setValue call per resolved address.
const PERSIST_DEBOUNCE_MS = 800;

export interface StoreState {
  shopRecords: ShopRecords;
  visibleJudgments: VisibleJudgments;
  addressPrefetchEnabled: boolean;
}

export type StoreListener = (state: StoreState) => void;

export class Store {
  private state: StoreState;
  private listeners: StoreListener[];
  private persistTimer: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.state = {
      shopRecords: this._loadShopRecords(),
      visibleJudgments: this._loadVisibleJudgments(),
      addressPrefetchEnabled: this._loadAddressPrefetchEnabled()
    };
    this.listeners = [];
    this.persistTimer = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.flush);
      window.addEventListener('pagehide', this.flush);
    }
  }

  private _loadShopRecords = (): ShopRecords => {
    const raw = GM_getValue(STORAGE_KEYS.SHOP_RECORDS);
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as ShopRecords) : {};
    } catch {
      return {};
    }
  };

  private _loadVisibleJudgments = (): VisibleJudgments => {
    const raw = GM_getValue(STORAGE_KEYS.VISIBLE_JUDGMENTS);
    if (!raw) return { ...DEFAULT_VISIBLE_JUDGMENTS };
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object'
        ? { ...DEFAULT_VISIBLE_JUDGMENTS, ...(parsed as Partial<VisibleJudgments>) }
        : { ...DEFAULT_VISIBLE_JUDGMENTS };
    } catch {
      return { ...DEFAULT_VISIBLE_JUDGMENTS };
    }
  };

  private _loadAddressPrefetchEnabled = (): boolean => {
    const raw = GM_getValue(STORAGE_KEYS.ADDRESS_PREFETCH_ENABLED);
    return raw === undefined ? true : raw === 'true';
  };

  getState = (): StoreState => {
    return { ...this.state };
  };

  getShopRecord = (shopId: ShopId): ShopRecord | undefined => {
    return this.state.shopRecords[shopId];
  };

  /**
   * Returns the shopIds of all cached shop records whose address normalizes
   * to the given normalized address. Shops with no cached address are never
   * included.
   */
  getShopIdsByNormalizedAddress = (normalizedAddress: string): ShopId[] => {
    return Object.entries(this.state.shopRecords)
      .filter(([, record]) => record.address !== undefined && normalizeAddress(record.address) === normalizedAddress)
      .map(([shopId]) => shopId);
  };

  updateShopRecord = (shopId: ShopId, patch: Partial<ShopRecord>): void => {
    const merged = mergeShopRecord(this.state.shopRecords[shopId], patch);
    this._setShopRecords({ ...this.state.shopRecords, [shopId]: merged });
  };

  clearShopJudgment = (shopId: ShopId): void => {
    const next = clearJudgment(this.state.shopRecords[shopId]);
    const shopRecords = { ...this.state.shopRecords };
    if (next) {
      shopRecords[shopId] = next;
    } else {
      delete shopRecords[shopId];
    }
    this._setShopRecords(shopRecords);
  };

  private _setShopRecords = (shopRecords: ShopRecords): void => {
    this.state = { ...this.state, shopRecords };
    this._schedulePersist();
    this._notify();
  };

  private _schedulePersist = (): void => {
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this._persistShopRecords();
    }, PERSIST_DEBOUNCE_MS);
  };

  private _persistShopRecords = (): void => {
    GM_setValue(STORAGE_KEYS.SHOP_RECORDS, JSON.stringify(this.state.shopRecords));
  };

  /**
   * Flushes a pending debounced shop-records write immediately. Registered
   * as a `beforeunload`/`pagehide` handler so a debounced update is not
   * silently lost when the page is navigated away from.
   */
  flush = (): void => {
    if (this.persistTimer === null) return;
    clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this._persistShopRecords();
  };

  toggleJudgmentVisibility = (key: keyof VisibleJudgments, visible: boolean): void => {
    if (this.state.visibleJudgments[key] === visible) return;
    const visibleJudgments = { ...this.state.visibleJudgments, [key]: visible };
    this.state = { ...this.state, visibleJudgments };
    GM_setValue(STORAGE_KEYS.VISIBLE_JUDGMENTS, JSON.stringify(visibleJudgments));
    this._notify();
  };

  setAddressPrefetchEnabled = (enabled: boolean): void => {
    if (this.state.addressPrefetchEnabled === enabled) return;
    this.state = { ...this.state, addressPrefetchEnabled: enabled };
    GM_setValue(STORAGE_KEYS.ADDRESS_PREFETCH_ENABLED, String(enabled));
    this._notify();
  };

  subscribe = (callback: StoreListener): (() => void) => {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  };

  private _notify = (): void => {
    this.listeners.forEach(callback => { callback(this.getState()); });
  };
}
