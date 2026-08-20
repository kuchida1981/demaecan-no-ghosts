import { ListingAdapter, ShopId } from '../types';
import { ShopDetailFetcher } from './ShopDetailFetcher';
import { JudgmentManager } from './JudgmentManager';
import { buildAddressBlock } from './AddressBlock';
import { injectStyles } from '../ui/styles';

const DECORATED_ATTR = 'data-ghosts-decorated';
const HOVER_CLOSE_DELAY_MS = 250;

interface Registration {
  card: HTMLElement;
  popover: HTMLElement;
  close: () => void;
}

function supportsHover(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(hover: hover)').matches;
  } catch {
    return false;
  }
}

/**
 * Decorates shop-listing cards with an info icon that reveals a popover
 * (shop name, address, map/search links, refetch, judgment controls), and
 * keeps decorating cards added later (e.g. via a "load more" action).
 */
export class CardOverlayManager {
  private adapter: ListingAdapter;
  private fetcher: ShopDetailFetcher;
  private judgmentManager: JudgmentManager;
  private onDecorate?: (shopId: ShopId, card: HTMLElement) => void;
  private registrations: Registration[];
  private hoverEnabled: boolean;

  constructor(
    adapter: ListingAdapter,
    fetcher: ShopDetailFetcher,
    judgmentManager: JudgmentManager,
    onDecorate?: (shopId: ShopId, card: HTMLElement) => void
  ) {
    this.adapter = adapter;
    this.fetcher = fetcher;
    this.judgmentManager = judgmentManager;
    this.onDecorate = onDecorate;
    this.registrations = [];
    this.hoverEnabled = supportsHover();
  }

  init = (): void => {
    injectStyles();
    const container = this.adapter.getListingContainer();
    if (!container) return;

    this.adapter.getShopCards(container).forEach(this.decorateCard);

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          this._collectCards(node).forEach(this.decorateCard);
        });
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    document.addEventListener('click', this._handleOutsideClick);
  };

  private _collectCards = (node: HTMLElement): HTMLElement[] => {
    const descendants = this.adapter.getShopCards(node);
    return this.adapter.matchesShopCard(node) ? [node, ...descendants] : descendants;
  };

  decorateCard = (card: HTMLElement): void => {
    if (card.hasAttribute(DECORATED_ATTR)) return;
    const shopId = this.adapter.extractShopId(card);
    if (!shopId) return;
    card.setAttribute(DECORATED_ATTR, 'true');

    this._ensurePositioned(card);

    const shopName = this.adapter.extractShopName(card) ?? '';
    const { icon, popover, load } = this._buildPopover(shopId, shopName);

    card.append(icon, popover);
    this._wireEvents(card, icon, popover, load);

    this.onDecorate?.(shopId, card);
  };

  private _ensurePositioned = (card: HTMLElement): void => {
    const position = window.getComputedStyle(card).position;
    if (!position || position === 'static') {
      // Setting z-index alongside position makes the card its own stacking
      // context, so the icon/popover/badge's very high z-index (needed to
      // win inside the card) stays contained here instead of leaking out to
      // compete with the host page's own chrome (e.g. a sticky header) - see
      // issue #19.
      card.style.position = 'relative';
      card.style.zIndex = '0';
    }
  };

  private _buildPopover = (
    shopId: ShopId,
    shopName: string
  ): { icon: HTMLButtonElement; popover: HTMLElement; load: (forceRefetch: boolean) => void } => {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'ghosts-icon-btn';
    icon.setAttribute('aria-label', `${shopName}の詳細情報を表示`);
    this.judgmentManager.mountIcon(shopId, icon);

    const popover = document.createElement('div');
    popover.className = 'ghosts-popover';
    popover.addEventListener('click', event => { event.stopPropagation(); });

    const nameEl = document.createElement('p');
    nameEl.className = 'ghosts-popover__shop-name';
    nameEl.textContent = shopName;

    const { addressEl, linksEl, refetchBtn, load } = buildAddressBlock(shopId, shopName, this.fetcher);

    const controls = this.judgmentManager.createControls(shopId);

    popover.append(nameEl, addressEl, linksEl, refetchBtn, controls);

    return { icon, popover, load };
  };

  private _wireEvents = (
    card: HTMLElement,
    icon: HTMLButtonElement,
    popover: HTMLElement,
    load: (forceRefetch: boolean) => void
  ): void => {
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    const clearCloseTimer = (): void => {
      if (closeTimer === undefined) return;
      clearTimeout(closeTimer);
      closeTimer = undefined;
    };
    const open = (): void => {
      clearCloseTimer();
      if (popover.classList.contains('ghosts-popover--open')) return;
      popover.classList.add('ghosts-popover--open');
      load(false);
    };
    const close = (): void => {
      clearCloseTimer();
      popover.classList.remove('ghosts-popover--open');
    };
    // Leaving the icon (or popover) doesn't close immediately: it's scheduled
    // with a short delay so that moving the cursor from one to the other -
    // however imprecisely - doesn't close the popover before it's reached.
    const scheduleClose = (): void => {
      clearCloseTimer();
      closeTimer = setTimeout(close, HOVER_CLOSE_DELAY_MS);
    };

    icon.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (popover.classList.contains('ghosts-popover--open')) {
        close();
      } else {
        open();
      }
    });

    if (this.hoverEnabled) {
      icon.addEventListener('mouseenter', open);
      icon.addEventListener('mouseleave', scheduleClose);
      popover.addEventListener('mouseenter', clearCloseTimer);
      popover.addEventListener('mouseleave', scheduleClose);
    }

    this.registrations.push({ card, popover, close });
  };

  private _handleOutsideClick = (event: MouseEvent): void => {
    const target = event.target as Node;
    this.registrations.forEach(({ card, popover, close }) => {
      if (popover.classList.contains('ghosts-popover--open') && !card.contains(target)) {
        close();
      }
    });
  };
}
