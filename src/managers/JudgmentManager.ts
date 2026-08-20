import { Store } from '../store';
import { Judgment, ShopId } from '../types';
import { getBadgeLabel } from '../logic';

interface ControlRefs {
  shopId: ShopId;
  ghostBtn: HTMLButtonElement;
  notGhostBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
}

/**
 * Owns reads/writes of shop judgments and keeps every mounted badge and
 * judgment-control widget in sync with the Store.
 */
export class JudgmentManager {
  private store: Store;
  private badges: Map<ShopId, HTMLElement[]>;
  private controls: Map<ShopId, ControlRefs[]>;

  constructor(store: Store) {
    this.store = store;
    this.badges = new Map();
    this.controls = new Map();
    this.store.subscribe(() => { this._renderAll(); });
  }

  judge = (shopId: ShopId, judgment: Judgment): void => {
    this.store.updateShopRecord(shopId, { judgment, judgedAt: Date.now() });
  };

  clearJudgment = (shopId: ShopId): void => {
    this.store.clearShopJudgment(shopId);
  };

  /**
   * Creates (or reuses) a badge element for a shop and keeps it in sync with
   * the shop's stored judgment.
   */
  mountBadge = (shopId: ShopId): HTMLElement => {
    const badge = document.createElement('span');
    badge.className = 'ghosts-badge';
    this._registerList(this.badges, shopId, badge);
    this._renderBadge(badge, shopId);
    return badge;
  };

  /**
   * Creates a judgment control widget (ghost / not-ghost / clear) for a shop.
   */
  createControls = (shopId: ShopId): HTMLElement => {
    const wrapper = document.createElement('div');
    wrapper.className = 'ghosts-popover__judgment';

    const ghostBtn = document.createElement('button');
    ghostBtn.type = 'button';
    ghostBtn.className = 'ghosts-judge-btn ghosts-judge-btn--ghost';
    ghostBtn.textContent = 'ゴースト';
    ghostBtn.addEventListener('click', () => { this.judge(shopId, 'ghost'); });

    const notGhostBtn = document.createElement('button');
    notGhostBtn.type = 'button';
    notGhostBtn.className = 'ghosts-judge-btn ghosts-judge-btn--not-ghost';
    notGhostBtn.textContent = '実店舗';
    notGhostBtn.addEventListener('click', () => { this.judge(shopId, 'not-ghost'); });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ghosts-judge-btn ghosts-judge-btn--clear';
    clearBtn.textContent = '解除';
    clearBtn.addEventListener('click', () => { this.clearJudgment(shopId); });

    wrapper.append(ghostBtn, notGhostBtn, clearBtn);

    const refs: ControlRefs = { shopId, ghostBtn, notGhostBtn, clearBtn };
    this._registerList(this.controls, shopId, refs);
    this._renderControls(refs);

    return wrapper;
  };

  private _registerList = <T>(map: Map<ShopId, T[]>, shopId: ShopId, value: T): void => {
    const list = map.get(shopId) ?? [];
    list.push(value);
    map.set(shopId, list);
  };

  private _renderAll = (): void => {
    for (const [shopId, badges] of this.badges) {
      badges.forEach(badge => { this._renderBadge(badge, shopId); });
    }
    for (const refsList of this.controls.values()) {
      refsList.forEach(refs => { this._renderControls(refs); });
    }
  };

  private _renderBadge = (badge: HTMLElement, shopId: ShopId): void => {
    const judgment = this.store.getShopRecord(shopId)?.judgment;
    const label = getBadgeLabel(judgment);
    badge.textContent = label;
    badge.style.display = label ? '' : 'none';
    badge.classList.toggle('ghosts-badge--ghost', judgment === 'ghost');
    badge.classList.toggle('ghosts-badge--not-ghost', judgment === 'not-ghost');
  };

  private _renderControls = (refs: ControlRefs): void => {
    const judgment = this.store.getShopRecord(refs.shopId)?.judgment;
    refs.ghostBtn.classList.toggle('is-active', judgment === 'ghost');
    refs.ghostBtn.setAttribute('aria-pressed', String(judgment === 'ghost'));
    refs.notGhostBtn.classList.toggle('is-active', judgment === 'not-ghost');
    refs.notGhostBtn.setAttribute('aria-pressed', String(judgment === 'not-ghost'));
  };
}
