## Why

The judgment-visibility filter panel (ゴースト／実店舗／未評価 checkboxes, plus the address-display toggle) is meant for shop-listing pages, but it is mounted unconditionally on every page, including a shop's own page (`/shop/menu/{shopId}`, `/shopDetail/{shopId}/{areaId}`), where it has nothing to filter and just clutters the page (issue #27). It also doesn't track SPA (client-side) navigation, so switching between a listing and a shop page via the site's router leaves the panel's visibility stuck at whatever it was on the first page load.

## What Changes

- `FilterManager` mounts its panel only when the current URL is not a shop page (listing pages, by exclusion), and unmounts it when navigating to a shop page — mirroring the SPA-tracking mount/unmount pattern already used by `ShopPageManager`.
- `FilterManager` subscribes to `onRouteChange` (from `src/route-watcher.ts`) so the panel's visibility follows client-side navigation without a page reload.
- Pages that are neither a listing page nor a shop page (e.g. cart, order history) are out of scope for this change and keep today's behavior (panel shown), since the site's shop-listing adapter (`DemaecanListingAdapter.match`) doesn't currently distinguish them from listing pages either.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `ghost-shop-filter`: The "Filter toggle control" requirement is narrowed from "visible on shop-listing pages" (previously also true in practice on shop pages, which was a bug) to explicitly exclude the shop's own page, and gains SPA-navigation tracking so the panel mounts/unmounts as the user navigates between a shop page and any other page without a reload.

## Impact

- `src/managers/FilterManager.ts`: `init()` changes from an unconditional one-time mount to a route-aware sync (mount/unmount) using `DemaecanShopPageAdapter.match` and `onRouteChange`.
- `src/main.ts`: no change expected (still calls `filterManager.init()` once at startup).
- No changes to `src/adapters/ListingAdapter.ts` or `src/adapters/ShopPageAdapter.ts` — reuses `DemaecanShopPageAdapter.match` as-is.
