## 1. FilterManager route-tracking

- [ ] 1.1 Add a `ShopPageAdapter` constructor parameter to `FilterManager` (mirroring `ShopPageManager`'s constructor)
- [ ] 1.2 Replace `init()`'s unconditional `_mountPanel()` call with a `_sync(url)` method that mounts the panel only when `!adapter.match(url)`, and unmounts it otherwise
- [ ] 1.3 Call `_sync(window.location.href)` immediately in `init()`, then subscribe to `onRouteChange(this._sync)` (from `src/route-watcher.ts`) and keep the unsubscribe handle
- [ ] 1.4 Guard `_sync` against redundant work: only mount/unmount when the shop-page match state actually changed since the last sync
- [ ] 1.5 Ensure checkboxes are rebuilt from current `Store` state on every mount (already true of `_mountPanel`, verify it still holds)

## 2. Wiring

- [ ] 2.1 Update `src/main.ts` to pass `DemaecanShopPageAdapter` into `new FilterManager(...)`

## 3. Tests

- [ ] 3.1 Update `src/managers/FilterManager.test.ts` construction calls to pass a test `ShopPageAdapter` (mirroring the pattern in `src/managers/ShopPageManager.test.ts`)
- [ ] 3.2 Add test: panel is not mounted on `init()` when the current URL matches a shop page
- [ ] 3.3 Add test: panel mounts after SPA navigation away from a shop page (e.g. `/shop/menu/123` → `/`)
- [ ] 3.4 Add test: panel unmounts after SPA navigation into a shop page (e.g. `/` → `/shop/menu/123`)
- [ ] 3.5 Add test: navigating between two shop pages (shopId changes, still a shop page) does not remount the panel or reset checkbox state
- [ ] 3.6 Add test: checkbox state set before navigating away and back is still reflected after the panel remounts

## 4. Verification

- [ ] 4.1 Run `npm run check-types`
- [ ] 4.2 Run `npm run lint`
- [ ] 4.3 Run `npm test`
- [ ] 4.4 Manually verify via `npm run build` + loading the userscript that the panel is hidden on a real shop page and visible on the top/category pages, including after in-app SPA navigation between them
