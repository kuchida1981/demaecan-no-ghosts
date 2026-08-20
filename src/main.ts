import { Store } from './store';
import { DemaecanListingAdapter } from './adapters/ListingAdapter';
import { DemaecanShopPageAdapter } from './adapters/ShopPageAdapter';
import { ShopDetailFetcher } from './managers/ShopDetailFetcher';
import { JudgmentManager } from './managers/JudgmentManager';
import { CardOverlayManager } from './managers/CardOverlayManager';
import { FilterManager } from './managers/FilterManager';
import { ShopPageManager } from './managers/ShopPageManager';
import { injectStyles } from './ui/styles';

class App {
  private store: Store;
  private fetcher: ShopDetailFetcher;
  private judgmentManager: JudgmentManager;
  private filterManager: FilterManager;
  private cardOverlayManager: CardOverlayManager;
  private shopPageManager: ShopPageManager;

  constructor() {
    this.store = new Store();
    this.fetcher = new ShopDetailFetcher(this.store);
    this.judgmentManager = new JudgmentManager(this.store);
    this.filterManager = new FilterManager(this.store);
    this.cardOverlayManager = new CardOverlayManager(
      DemaecanListingAdapter,
      this.fetcher,
      this.judgmentManager,
      (shopId, card) => { this.filterManager.registerCard(shopId, card); }
    );
    this.shopPageManager = new ShopPageManager(DemaecanShopPageAdapter, this.judgmentManager, this.fetcher);
  }

  init = (): void => {
    injectStyles();
    this.filterManager.init();
    this.cardOverlayManager.init();
    this.shopPageManager.init();
  };
}

const app = new App();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app.init);
} else {
  app.init();
}
