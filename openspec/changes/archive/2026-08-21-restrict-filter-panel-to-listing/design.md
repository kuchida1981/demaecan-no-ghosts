## Context

`FilterManager.init()` (`src/managers/FilterManager.ts`) currently calls `_mountPanel()` once, unconditionally, appending the filter panel to `document.body` for the lifetime of the page. `App.init` (`src/main.ts`) calls this once at startup regardless of which URL the userscript loaded on.

demae-can.com is an SPA: navigating from a listing page to a shop's own page (`/shop/menu/{shopId}` or `/shopDetail/{shopId}/{areaId}`) happens via client-side routing, without a full page reload. `ShopPageManager` (`src/managers/ShopPageManager.ts`) already solves the equivalent problem for the *shop-page* panel: it calls `_sync(url)` on init and again on every `onRouteChange` (`src/route-watcher.ts`) event, comparing the resolved `shopId` to the currently-mounted one and mounting/unmounting as needed.

`DemaecanShopPageAdapter.match(url)` (`src/adapters/ShopPageAdapter.ts`) reliably identifies a shop's own page. `DemaecanListingAdapter.match` (`src/adapters/ListingAdapter.ts`) always returns `true` and isn't a real listing-page test — it was never meant to gate page-level mounting, only to select `getListingContainer`/`getShopCards` within whatever page it's given. Making a real positive listing-page matcher would mean maintaining a separate list of listing URL patterns (top page, category pages, genre pages, search results, ...) with a real chance of missing one and silently regressing the original bug in a new form.

## Goals / Non-Goals

**Goals:**
- Filter panel is not mounted while the current page is a shop's own page.
- Filter panel mounts/unmounts correctly as the user navigates via the SPA router, without a reload, mirroring `ShopPageManager`'s existing pattern.
- Panel state (`visibleJudgments`, `addressPrefetchEnabled`) survives unmount/remount, since it already lives in `Store`, not on the DOM.

**Non-Goals:**
- Precisely classifying every non-shop-page URL (cart, order history, account pages, ...) as "listing" vs. "other." This change only distinguishes "shop page" from "everything else," matching the issue's proposed scope. Pages that are neither a listing nor a shop page keep showing the panel, same as today.
- Changing `DemaecanListingAdapter.match`'s behavior or its callers (`CardOverlayManager`, `AddressLabelManager`), which don't depend on it being a real page-level test.

## Decisions

**Negative condition (`!DemaecanShopPageAdapter.match(url)`) instead of a positive listing matcher.** The shop-page matcher is a precise, already-correct URL test with two known patterns. A positive listing matcher would need to enumerate listing URL shapes, which isn't necessary for this change's actual goal (hide on shop pages) and risks under-matching. Trade-off: pages that are neither listing nor shop page (cart, order history) still show the panel — accepted as out of scope (see Non-Goals), consistent with `DemaecanListingAdapter.match` already treating everything as a listing.

**Route-tracking lives inside `FilterManager`, not `main.ts`.** `ShopPageManager` already establishes this pattern: the manager owns its own `onRouteChange` subscription and mount/unmount lifecycle, so `App.init` just calls `init()` once and doesn't need to know about routing. Keeping `FilterManager` consistent with that pattern (rather than, say, having `main.ts` poll the URL and call `filterManager.show()/hide()`) avoids introducing a second routing-awareness mechanism.

**Mount/unmount the whole panel, not just hide it via CSS.** Matches the existing `_mountPanel`/`document.body.appendChild` approach and `ShopPageManager`'s `_mountPanel`/`_removePanel` pattern. Simpler than adding a visibility toggle, and avoids a hidden-but-present panel still receiving events.

**Re-create checkbox DOM elements on every mount rather than caching them.** Consistent with the existing `_mountPanel` implementation, which already creates fresh `<input>` elements per call. Their `checked` state is initialized from `Store.getState()` at mount time, so no state is lost by not caching. Simpler than adding element-caching logic to a manager that mounts at most a handful of times per navigation session.

## Risks / Trade-offs

- **[Risk]** Rapid navigation between listing and shop pages could theoretically cause redundant mount/unmount churn. → **Mitigation**: same risk already exists (and is accepted) in `ShopPageManager`; the `_sync` pattern only acts when the mount state actually needs to change, and route-watcher's polling fallback is throttled to 1s.
- **[Risk]** Non-listing, non-shop pages (cart, order history) still show the panel, which may look like an incomplete fix relative to the issue title. → **Mitigation**: explicitly called out as out of scope in the proposal; can be a follow-up issue if it turns out to matter in practice.

## Open Questions

None — the negative-condition scoping and out-of-scope boundary were confirmed during exploration (see issue #27 discussion).
