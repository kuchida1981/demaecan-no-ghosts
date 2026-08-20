export type ShopId = string;

export type Judgment = 'ghost' | 'not-ghost';

export interface ShopRecord {
  address?: string;
  addressFetchedAt?: number;
  judgment?: Judgment;
  judgedAt?: number;
}

export type ShopRecords = Record<ShopId, ShopRecord>;

export interface ListingAdapter {
  match: (url: string) => boolean;
  getListingContainer: () => HTMLElement | null;
  getShopCards: (container: ParentNode) => HTMLElement[];
  matchesShopCard: (el: Element) => boolean;
  extractShopId: (card: HTMLElement) => ShopId | null;
  extractShopName: (card: HTMLElement) => string | null;
}

export interface ShopPageAdapter {
  match: (url: string) => boolean;
  extractShopId: (url: string) => ShopId | null;
  getShopName: () => string | null;
}
