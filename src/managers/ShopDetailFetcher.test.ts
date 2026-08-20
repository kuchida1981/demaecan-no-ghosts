import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { ShopDetailFetcher } from './ShopDetailFetcher';

const DETAIL_HTML =
  '<html><body><section><h2>住所</h2><div><p>北海道札幌市豊平区中の島1条5丁目4番1号</p></div></section></body></html>';

function mockFetchOnce(response: Partial<Response> & { text?: () => Promise<string> }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      text: async () => DETAIL_HTML,
      ...response
    })
  );
}

describe('ShopDetailFetcher', () => {
  let store: Store;

  beforeEach(() => {
    setupGMStorageMock();
    store = new Store();
  });

  it('fetches and caches the address on first lookup', async () => {
    mockFetchOnce({});
    const fetcher = new ShopDetailFetcher(store);

    const result = await fetcher.getAddress('3451329');

    expect(result).toEqual({ status: 'fetched', address: '北海道札幌市豊平区中の島1条5丁目4番1号' });
    expect(fetch).toHaveBeenCalledWith('/shopDetail/3451329');
    expect(store.getShopRecord('3451329')?.address).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
  });

  it('returns the cached address without fetching again', async () => {
    mockFetchOnce({});
    const fetcher = new ShopDetailFetcher(store);

    await fetcher.getAddress('3451329');
    const result = await fetcher.getAddress('3451329');

    expect(result).toEqual({ status: 'cached', address: '北海道札幌市豊平区中の島1条5丁目4番1号' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent lookups for the same shop into a single request', async () => {
    mockFetchOnce({});
    const fetcher = new ShopDetailFetcher(store);

    const [a, b] = await Promise.all([fetcher.getAddress('3451329'), fetcher.getAddress('3451329')]);

    expect(a).toEqual(b);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refetches and overwrites an existing cached address', async () => {
    mockFetchOnce({});
    const fetcher = new ShopDetailFetcher(store);
    await fetcher.getAddress('3451329');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          '<html><body><section><h2>住所</h2><div><p>新しい住所</p></div></section></body></html>'
      })
    );
    const result = await fetcher.refetch('3451329');

    expect(result).toEqual({ status: 'fetched', address: '新しい住所' });
    expect(store.getShopRecord('3451329')?.address).toBe('新しい住所');
  });

  it('returns an error status when the HTTP response is not ok', async () => {
    mockFetchOnce({ ok: false });
    const fetcher = new ShopDetailFetcher(store);

    const result = await fetcher.getAddress('3451329');
    expect(result).toEqual({ status: 'error' });
    expect(store.getShopRecord('3451329')).toBeUndefined();
  });

  it('returns an error status when the address cannot be parsed from the response', async () => {
    mockFetchOnce({ text: async () => '<html><body>no address here</body></html>' });
    const fetcher = new ShopDetailFetcher(store);

    const result = await fetcher.getAddress('3451329');
    expect(result).toEqual({ status: 'error' });
  });

  it('returns an error status when the network request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const fetcher = new ShopDetailFetcher(store);

    const result = await fetcher.getAddress('3451329');
    expect(result).toEqual({ status: 'error' });
  });
});
