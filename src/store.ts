import { ShopId, ShopRecord, ShopRecords, VisibleJudgments } from './types';
import { mergeShopRecord, clearJudgment } from './logic';

export const STORAGE_KEYS = {
  SHOP_RECORDS: 'demaecan-no-ghosts-shop-records',
  FILTER_ENABLED: 'demaecan-no-ghosts-filter-enabled',
  VISIBLE_JUDGMENTS: 'demaecan-no-ghosts-visible-judgments'
} as const;

const DEFAULT_VISIBLE_JUDGMENTS: VisibleJudgments = { ghost: true, notGhost: true, unjudged: true };

export interface StoreState {
  shopRecords: ShopRecords;
  visibleJudgments: VisibleJudgments;
}

export type StoreListener = (state: StoreState) => void;

export class Store {
  private state: StoreState;
  private listeners: StoreListener[];

  constructor() {
    this.state = {
      shopRecords: this._loadShopRecords(),
      visibleJudgments: this._loadVisibleJudgments()
    };
    this.listeners = [];
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

  getState = (): StoreState => {
    return { ...this.state };
  };

  getShopRecord = (shopId: ShopId): ShopRecord | undefined => {
    return this.state.shopRecords[shopId];
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
    GM_setValue(STORAGE_KEYS.SHOP_RECORDS, JSON.stringify(shopRecords));
    this._notify();
  };

  toggleJudgmentVisibility = (key: keyof VisibleJudgments, visible: boolean): void => {
    if (this.state.visibleJudgments[key] === visible) return;
    const visibleJudgments = { ...this.state.visibleJudgments, [key]: visible };
    this.state = { ...this.state, visibleJudgments };
    GM_setValue(STORAGE_KEYS.VISIBLE_JUDGMENTS, JSON.stringify(visibleJudgments));
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
