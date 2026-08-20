import { ShopPageAdapter } from '../types';
import { extractShopIdFromShopPageUrl } from '../logic';

/**
 * Adapter for a shop's own page (`/shop/menu/{shopId}` or
 * `/shopDetail/{shopId}/{areaId}`), where the shop name is the page's h1.
 */
export const DemaecanShopPageAdapter: ShopPageAdapter = {
  match: (url: string) => extractShopIdFromShopPageUrl(url) !== null,
  extractShopId: (url: string) => extractShopIdFromShopPageUrl(url),
  getShopName: (): string | null => {
    const text = document.querySelector('h1')?.textContent;
    return text ? text.trim() : null;
  }
};
