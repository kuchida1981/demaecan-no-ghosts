import { describe, it, expect, beforeEach } from 'vitest';
import { DemaecanShopPageAdapter } from './ShopPageAdapter';

describe('DemaecanShopPageAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('matches shop menu page URLs', () => {
    expect(DemaecanShopPageAdapter.match('https://demae-can.com/shop/menu/3207834')).toBe(true);
  });

  it('matches shop detail page URLs', () => {
    expect(DemaecanShopPageAdapter.match('https://demae-can.com/shopDetail/3207834/01101060009')).toBe(true);
  });

  it('does not match non shop-page URLs', () => {
    expect(DemaecanShopPageAdapter.match('https://demae-can.com/')).toBe(false);
  });

  it('extracts the shopId from a shop menu URL', () => {
    expect(DemaecanShopPageAdapter.extractShopId('https://demae-can.com/shop/menu/3207834')).toBe('3207834');
  });

  it('extracts the shopId from a shop detail URL', () => {
    expect(
      DemaecanShopPageAdapter.extractShopId('https://demae-can.com/shopDetail/3207834/01101060009')
    ).toBe('3207834');
  });

  it('reads the shop name from the page h1', () => {
    document.body.innerHTML = '<h1>暖龍平岸店</h1>';
    expect(DemaecanShopPageAdapter.getShopName()).toBe('暖龍平岸店');
  });

  it('returns null when there is no h1', () => {
    expect(DemaecanShopPageAdapter.getShopName()).toBeNull();
  });
});
