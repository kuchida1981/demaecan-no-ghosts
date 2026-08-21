import { ListingAdapter, ShopId } from '../types';
import { Store } from '../store';
import { normalizeAddress, buildShopMenuUrl } from '../logic';

const HIDDEN_CLASS = 'ghosts-address-label--hidden';
const TOOLTIP_OPEN_CLASS = 'ghosts-address-tooltip--open';
const HOVER_CLOSE_DELAY_MS = 250;

function supportsHover(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(hover: hover)').matches;
  } catch {
    return false;
  }
}

interface Registration {
  shopId: ShopId;
  label: HTMLElement;
  closeTooltip: () => void;
}

/**
 * Inserts an always-on address label right after a shop-listing card's own
 * shop-name element (aria-labelledby cards only), keeps it in sync with the
 * store (address arriving later via prefetch, and the address-display
 * toggle), and reveals a hover/click tooltip listing other shops sharing
 * the same normalized address.
 */
export class AddressLabelManager {
  private adapter: ListingAdapter;
  private store: Store;
  private registrations: Registration[];

  constructor(adapter: ListingAdapter, store: Store) {
    this.adapter = adapter;
    this.store = store;
    this.registrations = [];
    this.store.subscribe(() => { this._renderAll(); });
  }

  /**
   * Inserts an address label after the card's shop-name element, if one can
   * be identified (aria-labelledby cards only - link-based fallback cards
   * are skipped).
   */
  decorateCard = (shopId: ShopId, card: HTMLElement): void => {
    const nameEl = this.adapter.extractShopNameElement(card);
    if (!nameEl) return;

    const label = document.createElement('p');
    label.className = 'ghosts-address-label';
    nameEl.insertAdjacentElement('afterend', label);

    const closeTooltip = this._wireTooltip(shopId, label);
    this.registrations.push({ shopId, label, closeTooltip });
    this._renderLabel(shopId, label);
  };

  private _renderAll = (): void => {
    const enabled = this.store.getState().addressPrefetchEnabled;
    this.registrations.forEach(({ shopId, label, closeTooltip }) => {
      this._renderLabel(shopId, label);
      if (!enabled) closeTooltip();
    });
  };

  private _renderLabel = (shopId: ShopId, label: HTMLElement): void => {
    label.textContent = this.store.getShopRecord(shopId)?.address ?? '';
    label.classList.toggle(HIDDEN_CLASS, !this.store.getState().addressPrefetchEnabled);
  };

  /**
   * Mounts the tooltip directly under `document.body` (as a fixed-position
   * element positioned via JS) rather than inside the card. Each shop card
   * has its own stacking context (see issue #19), so a tooltip absolutely
   * positioned inside a card can't escape that card's bounds - it would be
   * covered by an adjacent card's own content when it overflows past the
   * card's edge. Living at the body level and using viewport coordinates
   * sidesteps that entirely.
   */
  private _wireTooltip = (shopId: ShopId, label: HTMLElement): (() => void) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'ghosts-address-tooltip';
    document.body.appendChild(tooltip);

    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const clearCloseTimer = (): void => {
      if (closeTimer === undefined) return;
      clearTimeout(closeTimer);
      closeTimer = undefined;
    };

    const open = (): void => {
      clearCloseTimer();
      const address = this.store.getShopRecord(shopId)?.address;
      if (!address) return;

      const others = this.store
        .getShopIdsByNormalizedAddress(normalizeAddress(address))
        .filter(otherId => otherId !== shopId);
      if (others.length === 0) return;

      tooltip.replaceChildren(
        ...others.map(otherId => {
          // A real <a> here would nest inside demae-can's own card-covering
          // <a> (the shop-name element sits inside it), which is invalid
          // HTML with unreliable click behavior. A button that opens the
          // same target/rel-safe way avoids the nesting entirely.
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ghosts-address-tooltip__link';
          button.textContent = this.store.getShopRecord(otherId)?.name ?? otherId;
          button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            window.open(buildShopMenuUrl(otherId), '_blank', 'noopener,noreferrer');
          });
          return button;
        })
      );

      tooltip.classList.add(TOOLTIP_OPEN_CLASS);
      this._positionTooltip(label, tooltip);
    };

    const close = (): void => {
      clearCloseTimer();
      tooltip.classList.remove(TOOLTIP_OPEN_CLASS);
    };

    const scheduleClose = (): void => {
      clearCloseTimer();
      closeTimer = setTimeout(close, HOVER_CLOSE_DELAY_MS);
    };

    label.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (tooltip.classList.contains(TOOLTIP_OPEN_CLASS)) {
        close();
      } else {
        open();
      }
    });

    if (supportsHover()) {
      label.addEventListener('mouseenter', open);
      label.addEventListener('mouseleave', scheduleClose);
      tooltip.addEventListener('mouseenter', clearCloseTimer);
      tooltip.addEventListener('mouseleave', scheduleClose);
    }

    // A fixed-position tooltip doesn't track the label while scrolling, so
    // just close it rather than let it drift away from its label.
    window.addEventListener(
      'scroll',
      () => {
        if (tooltip.classList.contains(TOOLTIP_OPEN_CLASS)) close();
      },
      { passive: true, capture: true }
    );

    return close;
  };

  /**
   * Positions the (already-open, so measurable) fixed tooltip against the
   * label's viewport coordinates, opening upward if there isn't enough room
   * below in the viewport.
   */
  private _positionTooltip = (label: HTMLElement, tooltip: HTMLElement): void => {
    const labelRect = label.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    tooltip.style.left = `${labelRect.left}px`;
    if (labelRect.bottom + tooltipRect.height > window.innerHeight) {
      tooltip.style.top = `${Math.max(0, labelRect.top - tooltipRect.height)}px`;
    } else {
      tooltip.style.top = `${labelRect.bottom}px`;
    }
  };
}
