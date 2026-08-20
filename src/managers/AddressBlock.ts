import { ShopId } from '../types';
import { ShopDetailFetcher, AddressResult } from './ShopDetailFetcher';
import { buildGoogleMapsUrl, buildGoogleSearchUrl } from '../logic';

/**
 * A shop's address display, Google Maps/search links, and manual refetch
 * action. Shared between the shop-listing card popover and the shop-page
 * panel, which differ only in when they call `load()`.
 */
export interface AddressBlock {
  addressEl: HTMLElement;
  linksEl: HTMLElement;
  refetchBtn: HTMLButtonElement;
  load: (forceRefetch: boolean) => void;
}

export function buildAddressBlock(
  shopId: ShopId,
  shopName: string,
  fetcher: ShopDetailFetcher
): AddressBlock {
  const addressEl = document.createElement('p');
  addressEl.className = 'ghosts-popover__address';

  const linksEl = document.createElement('p');
  linksEl.className = 'ghosts-popover__links';
  linksEl.style.display = 'none';

  const mapLink = document.createElement('a');
  mapLink.textContent = '地図';
  mapLink.target = '_blank';
  mapLink.rel = 'noopener noreferrer';

  const searchLink = document.createElement('a');
  searchLink.textContent = '検索';
  searchLink.target = '_blank';
  searchLink.rel = 'noopener noreferrer';
  searchLink.href = buildGoogleSearchUrl(shopName);

  linksEl.append(mapLink, searchLink);

  const renderResult = (result: AddressResult): void => {
    if (result.status === 'error') {
      addressEl.textContent = '住所を取得できませんでした';
      linksEl.style.display = 'none';
      return;
    }
    addressEl.textContent = result.address;
    mapLink.href = buildGoogleMapsUrl(result.address);
    linksEl.style.display = '';
  };

  const load = (forceRefetch: boolean): void => {
    addressEl.textContent = '読み込み中...';
    linksEl.style.display = 'none';
    const promise = forceRefetch ? fetcher.refetch(shopId) : fetcher.getAddress(shopId);
    void promise.then(renderResult);
  };

  const refetchBtn = document.createElement('button');
  refetchBtn.type = 'button';
  refetchBtn.className = 'ghosts-popover__refetch';
  refetchBtn.textContent = '住所を再取得';
  refetchBtn.addEventListener('click', () => { load(true); });

  return { addressEl, linksEl, refetchBtn, load };
}
