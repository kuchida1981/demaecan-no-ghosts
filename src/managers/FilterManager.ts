import { Store } from '../store';
import { ShopId } from '../types';
import { shouldHideCard } from '../logic';
import { injectStyles } from '../ui/styles';

const HIDDEN_CLASS = 'ghosts-hidden';

interface Registration {
  shopId: ShopId;
  card: HTMLElement;
}

/**
 * Owns the ghost-shop filter toggle and hides/shows registered shop cards
 * according to their stored judgment and the toggle's current state.
 */
export class FilterManager {
  private store: Store;
  private registrations: Registration[];
  private checkbox: HTMLInputElement | null;

  constructor(store: Store) {
    this.store = store;
    this.registrations = [];
    this.checkbox = null;
    this.store.subscribe(() => { this._applyAll(); });
  }

  init = (): void => {
    injectStyles();
    this._mountPanel();
  };

  /**
   * Registers a shop card so its visibility tracks the filter and the shop's
   * judgment. Applies the current state immediately.
   */
  registerCard = (shopId: ShopId, card: HTMLElement): void => {
    this.registrations.push({ shopId, card });
    this._applyCard(shopId, card);
  };

  private _mountPanel = (): void => {
    const panel = document.createElement('div');
    panel.className = 'ghosts-filter-panel';

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.store.getState().filterEnabled;
    checkbox.addEventListener('change', () => {
      this.store.setFilterEnabled(checkbox.checked);
    });
    this.checkbox = checkbox;

    const text = document.createElement('span');
    text.textContent = 'ゴースト店舗を非表示';

    label.append(checkbox, text);
    panel.append(label);
    document.body.appendChild(panel);
  };

  private _applyAll = (): void => {
    if (this.checkbox) {
      this.checkbox.checked = this.store.getState().filterEnabled;
    }
    this.registrations.forEach(({ shopId, card }) => { this._applyCard(shopId, card); });
  };

  private _applyCard = (shopId: ShopId, card: HTMLElement): void => {
    const hide = shouldHideCard(this.store.getShopRecord(shopId), this.store.getState().filterEnabled);
    card.classList.toggle(HIDDEN_CLASS, hide);
  };
}
