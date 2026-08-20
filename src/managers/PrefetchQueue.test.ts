import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { ShopDetailFetcher } from './ShopDetailFetcher';
import { PrefetchQueue } from './PrefetchQueue';

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

function neverResolves<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

describe('PrefetchQueue', () => {
  let store: Store;
  let getAddress: ReturnType<typeof vi.fn>;
  let fetcher: ShopDetailFetcher;

  beforeEach(() => {
    setupGMStorageMock();
    vi.useFakeTimers();
    store = new Store();
    getAddress = vi.fn();
    fetcher = { getAddress } as unknown as ShopDetailFetcher;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not enqueue a shopId that already has a cached address', () => {
    store.updateShopRecord('123', { address: '住所' });
    const queue = new PrefetchQueue(store, fetcher);

    queue.enqueue('123');

    expect(getAddress).not.toHaveBeenCalled();
  });

  it('ignores a duplicate enqueue while the shop is already queued or in-flight', () => {
    getAddress.mockReturnValue(neverResolves());
    const queue = new PrefetchQueue(store, fetcher);

    queue.enqueue('123');
    queue.enqueue('123');

    expect(getAddress).toHaveBeenCalledTimes(1);
  });

  it('processes at most the concurrency limit of shops at a time', () => {
    getAddress.mockReturnValue(neverResolves());
    const queue = new PrefetchQueue(store, fetcher);

    queue.enqueue('1');
    queue.enqueue('2');
    queue.enqueue('3');

    expect(getAddress).toHaveBeenCalledTimes(2);
    expect(getAddress).toHaveBeenCalledWith('1');
    expect(getAddress).toHaveBeenCalledWith('2');
  });

  it('waits the configured interval after a job finishes before starting the next one', async () => {
    const first = createDeferred<{ status: 'fetched'; address: string }>();
    getAddress.mockReturnValueOnce(first.promise);
    getAddress.mockReturnValue(neverResolves());
    const queue = new PrefetchQueue(store, fetcher);

    queue.enqueue('1');
    queue.enqueue('2');
    queue.enqueue('3');
    expect(getAddress).toHaveBeenCalledTimes(2);

    first.resolve({ status: 'fetched', address: 'x' });
    await vi.advanceTimersByTimeAsync(0);
    expect(getAddress).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(400);
    expect(getAddress).toHaveBeenCalledTimes(3);
    expect(getAddress).toHaveBeenLastCalledWith('3');
  });

  it('does not issue requests while prefetching is disabled', () => {
    store.setAddressPrefetchEnabled(false);
    getAddress.mockReturnValue(neverResolves());
    const queue = new PrefetchQueue(store, fetcher);

    queue.enqueue('1');

    expect(getAddress).not.toHaveBeenCalled();
  });

  it('still enqueues while disabled, and resumes processing once re-enabled', () => {
    store.setAddressPrefetchEnabled(false);
    getAddress.mockReturnValue(neverResolves());
    const queue = new PrefetchQueue(store, fetcher);

    queue.enqueue('1');
    expect(getAddress).not.toHaveBeenCalled();

    store.setAddressPrefetchEnabled(true);
    expect(getAddress).toHaveBeenCalledWith('1');
  });
});
