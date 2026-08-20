import { Store } from './store';
import { DemaecanListingAdapter } from './adapters/ListingAdapter';
import { DemaecanShopPageAdapter } from './adapters/ShopPageAdapter';
import { ShopDetailFetcher } from './managers/ShopDetailFetcher';
import { JudgmentManager } from './managers/JudgmentManager';
import { CardOverlayManager } from './managers/CardOverlayManager';
import { FilterManager } from './managers/FilterManager';
import { injectStyles } from './ui/styles';

class App {
  private store: Store;
  private fetcher: ShopDetailFetcher;
  private judgmentManager: JudgmentManager;
  private filterManager: FilterManager;
  private cardOverlayManager: CardOverlayManager;

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
  }

  init = (): void => {
    injectStyles();
    this.filterManager.init();
    this.cardOverlayManager.init();
    this._initShopPage();
  };

  private _initShopPage = (): void => {
    if (!DemaecanShopPageAdapter.match(window.location.href)) return;
    const shopId = DemaecanShopPageAdapter.extractShopId(window.location.href);
    if (!shopId) return;

    const panel = document.createElement('div');
    panel.className = 'ghosts-shop-page-panel';

    const title = document.createElement('p');
    title.className = 'ghosts-shop-page-panel__title';
    title.textContent = 'ゴースト店舗判定';

    const badge = this.judgmentManager.mountBadge(shopId);
    const controls = this.judgmentManager.createControls(shopId);

    panel.append(title, badge, controls);
    document.body.appendChild(panel);
  };
}

const app = new App();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app.init);
} else {
  app.init();
}
