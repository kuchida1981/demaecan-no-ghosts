import { Store } from '../store';
import { ShopId } from '../types';
import { ShopDetailFetcher } from './ShopDetailFetcher';

// Gentle-on-demae-can.com defaults: at most 2 requests in flight, and at
// least 400ms between one request finishing and the next one starting.
const CONCURRENCY_LIMIT = 2;
const INTERVAL_MS = 400;

/**
 * Queues shopIds detected on a listing page and resolves their addresses
 * (via ShopDetailFetcher, reusing its cache/coalescing) at a gentle pace:
 * bounded concurrency plus a minimum interval between requests. Driven by
 * the store's address-prefetch-enabled flag - enqueueing always happens,
 * but the worker only issues requests while the flag is enabled.
 */
export class PrefetchQueue {
  private store: Store;
  private fetcher: ShopDetailFetcher;
  private queue: ShopId[];
  private queued: Set<ShopId>;
  private activeCount: number;
  private enabled: boolean;

  constructor(store: Store, fetcher: ShopDetailFetcher) {
    this.store = store;
    this.fetcher = fetcher;
    this.queue = [];
    this.queued = new Set();
    this.activeCount = 0;
    this.enabled = store.getState().addressPrefetchEnabled;

    store.subscribe(state => {
      const wasEnabled = this.enabled;
      this.enabled = state.addressPrefetchEnabled;
      if (this.enabled && !wasEnabled) {
        this._pump();
      }
    });
  }

  /**
   * Adds a shopId to the queue, unless it's already queued/in-flight or
   * already has a cached address. Enqueueing happens regardless of whether
   * the prefetch-enabled flag is currently on.
   */
  enqueue = (shopId: ShopId): void => {
    if (this.queued.has(shopId)) return;
    if (this.store.getShopRecord(shopId)?.address) return;

    this.queued.add(shopId);
    this.queue.push(shopId);
    this._pump();
  };

  private _pump = (): void => {
    if (!this.enabled) return;
    while (this.activeCount < CONCURRENCY_LIMIT && this.queue.length > 0) {
      const shopId = this.queue.shift()!;
      this.activeCount++;
      this._processOne(shopId);
    }
  };

  private _processOne = (shopId: ShopId): void => {
    void this.fetcher.getAddress(shopId).finally(() => {
      this.queued.delete(shopId);
      setTimeout(() => {
        this.activeCount--;
        this._pump();
      }, INTERVAL_MS);
    });
  };
}
