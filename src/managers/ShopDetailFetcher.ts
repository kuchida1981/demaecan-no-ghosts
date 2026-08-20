import { Store } from '../store';
import { ShopId } from '../types';
import { buildShopDetailUrl, extractAddressFromDetailDocument } from '../logic';

export type AddressResult =
  | { status: 'cached' | 'fetched'; address: string }
  | { status: 'error' };

export class ShopDetailFetcher {
  private store: Store;
  private pending: Map<ShopId, Promise<AddressResult>>;

  constructor(store: Store) {
    this.store = store;
    this.pending = new Map();
  }

  /**
   * Returns the address for a shop, using the persisted cache when available
   * and only issuing a network request the first time a shop is looked up.
   */
  getAddress = (shopId: ShopId): Promise<AddressResult> => {
    const cached = this.store.getShopRecord(shopId)?.address;
    if (cached) {
      return Promise.resolve({ status: 'cached', address: cached });
    }
    return this._fetchAndCache(shopId);
  };

  /**
   * Re-fetches and overwrites the cached address regardless of cache state.
   */
  refetch = (shopId: ShopId): Promise<AddressResult> => {
    return this._fetchAndCache(shopId);
  };

  private _fetchAndCache = (shopId: ShopId): Promise<AddressResult> => {
    const inFlight = this.pending.get(shopId);
    if (inFlight) return inFlight;

    const request = this._request(shopId).finally(() => {
      this.pending.delete(shopId);
    });
    this.pending.set(shopId, request);
    return request;
  };

  private _request = async (shopId: ShopId): Promise<AddressResult> => {
    try {
      const res = await fetch(buildShopDetailUrl(shopId));
      if (!res.ok) return { status: 'error' };

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const address = extractAddressFromDetailDocument(doc);
      if (!address) return { status: 'error' };

      this.store.updateShopRecord(shopId, { address, addressFetchedAt: Date.now() });
      return { status: 'fetched', address };
    } catch (error) {
      console.error(`Failed to fetch shop detail for ${shopId}:`, error);
      return { status: 'error' };
    }
  };
}
