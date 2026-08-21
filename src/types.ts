export type ShopId = string;

export type Judgment = 'ghost' | 'not-ghost';

export interface ShopRecord {
  name?: string;
  address?: string;
  addressFetchedAt?: number;
  judgment?: Judgment;
  judgedAt?: number;
}

export type ShopRecords = Record<ShopId, ShopRecord>;

export interface VisibleJudgments {
  ghost: boolean;
  notGhost: boolean;
  unjudged: boolean;
}

export interface ListingAdapter {
  match: (url: string) => boolean;
  getListingContainer: () => HTMLElement | null;
  getShopCards: (container: ParentNode) => HTMLElement[];
  matchesShopCard: (el: Element) => boolean;
  extractShopId: (card: HTMLElement) => ShopId | null;
  extractShopName: (card: HTMLElement) => string | null;
  extractShopNameElement: (card: HTMLElement) => HTMLElement | null;
}

export interface ShopPageAdapter {
  match: (url: string) => boolean;
  extractShopId: (url: string) => ShopId | null;
  getShopName: () => string | null;
}
