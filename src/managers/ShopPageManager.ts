import { ShopId, ShopPageAdapter } from '../types';
import { JudgmentManager } from './JudgmentManager';
import { onRouteChange } from '../route-watcher';

const PANEL_CLASS = 'ghosts-shop-page-panel';
const PANEL_TITLE = 'ゴースト店舗判定';

/**
 * Keeps the shop-page judgment panel in sync with SPA (client-side)
 * navigation: mounts it when the current URL matches a shop page, removes
 * it when navigating away, and rebuilds it when the viewed shopId changes.
 */
export class ShopPageManager {
  private adapter: ShopPageAdapter;
  private judgmentManager: JudgmentManager;
  private panel: HTMLElement | null;
  private currentShopId: ShopId | null;
  private unsubscribeRouteWatcher: (() => void) | null;

  constructor(adapter: ShopPageAdapter, judgmentManager: JudgmentManager) {
    this.adapter = adapter;
    this.judgmentManager = judgmentManager;
    this.panel = null;
    this.currentShopId = null;
    this.unsubscribeRouteWatcher = null;
  }

  init = (): void => {
    this._sync(window.location.href);
    this.unsubscribeRouteWatcher = onRouteChange(this._sync);
  };

  /**
   * Stops watching for route changes. Not used in production (the manager
   * lives for the page's lifetime) but keeps tests isolated from each other.
   */
  destroy = (): void => {
    this.unsubscribeRouteWatcher?.();
    this.unsubscribeRouteWatcher = null;
  };

  private _sync = (url: string): void => {
    const shopId = this.adapter.match(url) ? this.adapter.extractShopId(url) : null;

    if (shopId === this.currentShopId) return;

    this._removePanel();
    this.currentShopId = shopId;
    if (shopId) {
      this._mountPanel(shopId);
    }
  };

  private _mountPanel = (shopId: ShopId): void => {
    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;

    const title = document.createElement('p');
    title.className = `${PANEL_CLASS}__title`;
    title.textContent = PANEL_TITLE;

    const badge = this.judgmentManager.mountBadge(shopId);
    const controls = this.judgmentManager.createControls(shopId);

    panel.append(title, badge, controls);
    document.body.appendChild(panel);
    this.panel = panel;
  };

  private _removePanel = (): void => {
    this.panel?.remove();
    this.panel = null;
  };
}
