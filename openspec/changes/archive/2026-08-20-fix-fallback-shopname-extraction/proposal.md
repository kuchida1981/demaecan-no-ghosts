## Why

On shop-listing cards that don't use the `article[aria-labelledby^="shoplist-"]` markup (the "fallback" detection path in `DemaecanListingAdapter`), `extractShopName` takes the entire shop-menu-page link's `textContent`. On these cards the link wraps the photo, badges, rating, delivery time, and price alongside the name, so the extracted "shop name" ends up as a garbled concatenation (e.g. `クーポンあり吉野家　環状通美園店4.534分`), which then leaks into the detail popover and the icon's `aria-label` (GitHub issue #20). A second, distinct fallback-card shape was also found: demae-can's paid "featured placement" promotional cards, which show a *product* name as the bold headline with the shop name demoted to a small line above it — on these, naively picking "the first title-like line" only works by coincidence of layout order and cannot be trusted to reliably yield the shop name in general.

## What Changes

- Fallback-path shop name extraction stops using the link's raw `textContent`. Instead it excludes the sub-element containing the card's featured photo (reusing the existing photo-boundary logic already used to resolve the card root), then looks for "title-like" elements in what remains: elements with a direct, non-whitespace text node and no nested `<img>` (this structurally excludes rating/time/shipping rows, which nest their text in `<span>`s, and badge overlays, which live inside the excluded photo sub-element).
- If exactly one title-like element is found, it's used as the shop name (fixes issue #20's garbled-name case).
- If two or more title-like elements are found, the card is treated as ambiguous — most likely one of demae-can's paid product-focused placement cards, where the extra title-like element is a product/menu-item name rather than the shop name — and the fallback path **excludes it entirely** from shop-card detection (`getShopCards`/`matchesShopCard` no longer match it), rather than guessing which candidate is the shop name. No info icon or popover is injected on such cards.
- The `article[aria-labelledby^="shoplist-"]` detection path is unchanged; it isn't affected by this bug (out of scope for this change — see design.md).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shop-detail-overlay`:
  - "Icon injection on shop cards": the fallback-path card definition gains an exclusion — a link-based card whose remaining (non-photo) content contains two or more title-like text elements is not treated as a shop card.
  - New requirement for accurate shop name extraction on fallback-path cards, replacing reliance on raw anchor `textContent`.

## Impact

- `src/adapters/ListingAdapter.ts`: `extractShopName`, `getLinkBasedShopCards`, `isLinkCardRoot`, `findLinkCardRoot` (or a shared helper they call) change.
- `src/adapters/ListingAdapter.test.ts`: new test cases for the garbled-name fallback card and the product-focused/paid-placement fallback card.
- `src/managers/CardOverlayManager.ts`: no code change expected, but its behavior changes indirectly — product-focused cards will no longer receive an info icon/popover, and fallback shop cards will show a correct shop name.
