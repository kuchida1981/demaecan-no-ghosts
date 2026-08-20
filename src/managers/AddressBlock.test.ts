import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { ShopDetailFetcher } from './ShopDetailFetcher';
import { buildAddressBlock } from './AddressBlock';

const DETAIL_HTML =
  '<html><body><section><h2>住所</h2><div><p>北海道札幌市豊平区中の島1条5丁目4番1号</p></div></section></body></html>';

function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('buildAddressBlock', () => {
  let store: Store;
  let fetcher: ShopDetailFetcher;

  beforeEach(() => {
    setupGMStorageMock();
    store = new Store();
    fetcher = new ShopDetailFetcher(store);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: async () => DETAIL_HTML })
    );
  });

  it('sets the search link href from the shop name immediately', () => {
    const { linksEl } = buildAddressBlock('123', '銀のさら', fetcher);
    const searchLink = linksEl.querySelectorAll<HTMLAnchorElement>('a')[1];
    const url = new URL(searchLink.href);
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('q')).toBe('銀のさら');
  });

  it('shows a loading state and hides links while resolving', () => {
    const { addressEl, linksEl, load } = buildAddressBlock('123', '銀のさら', fetcher);

    load(false);

    expect(addressEl.textContent).toBe('読み込み中...');
    expect(linksEl.style.display).toBe('none');
  });

  it('displays the resolved address and map link on success', async () => {
    const { addressEl, linksEl, load } = buildAddressBlock('123', '銀のさら', fetcher);

    load(false);
    await flushMicrotasks();

    expect(addressEl.textContent).toBe('北海道札幌市豊平区中の島1条5丁目4番1号');
    expect(linksEl.style.display).toBe('');
    const mapLink = linksEl.querySelectorAll<HTMLAnchorElement>('a')[0];
    expect(mapLink.href).toContain('google.com/maps');
  });

  it('uses the cache on a second load, issuing only one fetch', async () => {
    const { load } = buildAddressBlock('123', '銀のさら', fetcher);

    load(false);
    await flushMicrotasks();
    load(false);
    await flushMicrotasks();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when the refetch button is clicked', async () => {
    const { load, refetchBtn } = buildAddressBlock('123', '銀のさら', fetcher);

    load(false);
    await flushMicrotasks();
    expect(fetch).toHaveBeenCalledTimes(1);

    refetchBtn.click();
    await flushMicrotasks();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shows an error message and hides links when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { addressEl, linksEl, load } = buildAddressBlock('123', '銀のさら', fetcher);

    load(false);
    await flushMicrotasks();

    expect(addressEl.textContent).toBe('住所を取得できませんでした');
    expect(linksEl.style.display).toBe('none');
  });
});
