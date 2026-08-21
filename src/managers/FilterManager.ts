import { Store } from '../store';
import { ShopId, ShopPageAdapter, VisibleJudgments } from '../types';
import { shouldHideCard } from '../logic';
import { injectStyles } from '../ui/styles';
import { onRouteChange } from '../route-watcher';

const HIDDEN_CLASS = 'ghosts-hidden';

interface Registration {
  shopId: ShopId;
  card: HTMLElement;
}

const JUDGMENT_CHECKBOX_LABELS: { key: keyof VisibleJudgments; text: string }[] = [
  { key: 'ghost', text: 'ゴースト' },
  { key: 'notGhost', text: '実店舗' },
  { key: 'unjudged', text: '未評価' }
];

/**
 * Owns the judgment-visibility filter checkboxes and hides/shows registered
 * shop cards according to their stored judgment and the checkboxes' state.
 */
export class FilterManager {
  private store: Store;
  private adapter: ShopPageAdapter;
  private registrations: Registration[];
  private checkboxes: Partial<Record<keyof VisibleJudgments, HTMLInputElement>>;
  private addressCheckbox: HTMLInputElement | undefined;
  private panel: HTMLElement | null;
  private mounted: boolean;
  private unsubscribeRouteWatcher: (() => void) | null;

  constructor(store: Store, adapter: ShopPageAdapter) {
    this.store = store;
    this.adapter = adapter;
    this.registrations = [];
    this.checkboxes = {};
    this.panel = null;
    this.mounted = false;
    this.unsubscribeRouteWatcher = null;
    this.store.subscribe(() => { this._applyAll(); });
  }

  init = (): void => {
    injectStyles();
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

  /**
   * Registers a shop card so its visibility tracks the filter and the shop's
   * judgment. Applies the current state immediately.
   */
  registerCard = (shopId: ShopId, card: HTMLElement): void => {
    this.registrations.push({ shopId, card });
    this._applyCard(shopId, card);
  };

  private _sync = (url: string): void => {
    const shouldShow = !this.adapter.match(url);
    if (shouldShow === this.mounted) return;

    if (shouldShow) {
      this._mountPanel();
    } else {
      this._removePanel();
    }
    this.mounted = shouldShow;
  };

  private _mountPanel = (): void => {
    const panel = document.createElement('div');
    panel.className = 'ghosts-filter-panel';

    JUDGMENT_CHECKBOX_LABELS.forEach(({ key, text }) => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.store.getState().visibleJudgments[key];
      checkbox.addEventListener('change', () => {
        this.store.toggleJudgmentVisibility(key, checkbox.checked);
      });
      this.checkboxes[key] = checkbox;

      const span = document.createElement('span');
      span.textContent = text;

      label.append(checkbox, span);
      panel.append(label);
    });

    const addressLabel = document.createElement('label');
    const addressCheckbox = document.createElement('input');
    addressCheckbox.type = 'checkbox';
    addressCheckbox.checked = this.store.getState().addressPrefetchEnabled;
    addressCheckbox.addEventListener('change', () => {
      this.store.setAddressPrefetchEnabled(addressCheckbox.checked);
    });
    this.addressCheckbox = addressCheckbox;

    const addressSpan = document.createElement('span');
    addressSpan.textContent = '住所表示';

    addressLabel.append(addressCheckbox, addressSpan);
    panel.append(addressLabel);

    document.body.appendChild(panel);
    this.panel = panel;
  };

  private _removePanel = (): void => {
    this.panel?.remove();
    this.panel = null;
    this.checkboxes = {};
    this.addressCheckbox = undefined;
  };

  private _applyAll = (): void => {
    const visibleJudgments = this.store.getState().visibleJudgments;
    JUDGMENT_CHECKBOX_LABELS.forEach(({ key }) => {
      const checkbox = this.checkboxes[key];
      if (checkbox) {
        checkbox.checked = visibleJudgments[key];
      }
    });
    this.registrations.forEach(({ shopId, card }) => { this._applyCard(shopId, card); });

    if (this.addressCheckbox) {
      this.addressCheckbox.checked = this.store.getState().addressPrefetchEnabled;
    }
  };

  private _applyCard = (shopId: ShopId, card: HTMLElement): void => {
    const hide = shouldHideCard(this.store.getShopRecord(shopId), this.store.getState().visibleJudgments);
    card.classList.toggle(HIDDEN_CLASS, hide);
  };
}
