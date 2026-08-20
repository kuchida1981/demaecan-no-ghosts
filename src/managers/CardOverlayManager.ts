import { ListingAdapter, ShopId } from '../types';
import { ShopDetailFetcher, AddressResult } from './ShopDetailFetcher';
import { JudgmentManager } from './JudgmentManager';
import { buildGoogleMapsUrl, buildGoogleSearchUrl } from '../logic';
import { injectStyles } from '../ui/styles';

const DECORATED_ATTR = 'data-ghosts-decorated';

interface PopoverRefs {
  addressEl: HTMLElement;
  linksEl: HTMLElement;
  mapLink: HTMLAnchorElement;
}

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
    const { icon, popover, refs } = this._buildPopover(shopId, shopName);

    card.append(icon, popover);
    this._wireEvents(card, icon, popover, shopId, refs);

    this.onDecorate?.(shopId, card);
  };

  private _ensurePositioned = (card: HTMLElement): void => {
    const position = window.getComputedStyle(card).position;
    if (!position || position === 'static') {
      card.style.position = 'relative';
    }
  };

  private _buildPopover = (
    shopId: ShopId,
    shopName: string
  ): { icon: HTMLButtonElement; popover: HTMLElement; refs: PopoverRefs } => {
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

    const addressEl = document.createElement('p');
    addressEl.className = 'ghosts-popover__address';

    const linksEl = document.createElement('p');
    linksEl.className = 'ghosts-popover__links';
    linksEl.style.display = 'none';

    const mapLink = document.createElement('a');
    mapLink.textContent = '地図';
    mapLink.target = '_blank';
    mapLink.rel = 'noopener noreferrer';

    const searchLink = document.createElement('a');
    searchLink.textContent = '検索';
    searchLink.target = '_blank';
    searchLink.rel = 'noopener noreferrer';
    searchLink.href = buildGoogleSearchUrl(shopName);

    linksEl.append(mapLink, searchLink);

    const refs: PopoverRefs = { addressEl, linksEl, mapLink };

    const refetchBtn = document.createElement('button');
    refetchBtn.type = 'button';
    refetchBtn.className = 'ghosts-popover__refetch';
    refetchBtn.textContent = '住所を再取得';
    refetchBtn.addEventListener('click', () => { this._loadAddress(shopId, refs, true); });

    const controls = this.judgmentManager.createControls(shopId);

    popover.append(nameEl, addressEl, linksEl, refetchBtn, controls);

    return { icon, popover, refs };
  };

  private _wireEvents = (
    card: HTMLElement,
    icon: HTMLButtonElement,
    popover: HTMLElement,
    shopId: ShopId,
    refs: PopoverRefs
  ): void => {
    const open = (): void => {
      if (popover.classList.contains('ghosts-popover--open')) return;
      popover.classList.add('ghosts-popover--open');
      this._loadAddress(shopId, refs, false);
    };
    const close = (): void => {
      popover.classList.remove('ghosts-popover--open');
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
      icon.addEventListener('mouseleave', close);
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

  private _loadAddress = (shopId: ShopId, refs: PopoverRefs, forceRefetch: boolean): void => {
    refs.addressEl.textContent = '読み込み中...';
    refs.linksEl.style.display = 'none';

    const promise = forceRefetch ? this.fetcher.refetch(shopId) : this.fetcher.getAddress(shopId);
    void promise.then(result => { this._renderAddressResult(refs, result); });
  };

  private _renderAddressResult = (refs: PopoverRefs, result: AddressResult): void => {
    if (result.status === 'error') {
      refs.addressEl.textContent = '住所を取得できませんでした';
      refs.linksEl.style.display = 'none';
      return;
    }
    refs.addressEl.textContent = result.address;
    refs.mapLink.href = buildGoogleMapsUrl(result.address);
    refs.linksEl.style.display = '';
  };
}
