## 1. Shared title-candidate helper

- [ ] 1.1 In `src/adapters/ListingAdapter.ts`, add a helper that, given a fallback card's shop-menu-page anchor, finds the smallest descendant subtree containing a `FEATURED_IMG_SELECTOR` match and excludes it from further search.
- [ ] 1.2 Add a helper that, given the remaining (non-excluded) nodes, returns the list of "title candidate" elements: those with a direct, non-whitespace child `Text` node and no descendant `<img>`, in DOM order.

## 2. Wire candidate detection into card detection and name extraction

- [ ] 2.1 Update `getLinkBasedShopCards` to only include a resolved card root when its title-candidate count is exactly 1.
- [ ] 2.2 Update `isLinkCardRoot` to apply the same exactly-1-candidate rule, so `matchesShopCard` agrees with `getShopCards` for cards added later via the `MutationObserver` path.
- [ ] 2.3 Update `extractShopName` so that for fallback-path cards, it returns the single title candidate's trimmed text instead of the anchor's raw `textContent`. (The `article[aria-labelledby^="shoplist-"]` path is unchanged.)

## 3. Tests

- [ ] 3.1 Add a test reproducing the garbled-name fallback card from issue #20 (photo + badge + shop name + rating + delivery time + shipping fee all inside one link) and assert the extracted shop name is just the shop name.
- [ ] 3.2 Add a test reproducing the paid product-placement card (photo + badges + shop-name line + product-name line + price all inside one link) and assert `getShopCards`/`matchesShopCard` do NOT detect it as a shop card.
- [ ] 3.3 Verify existing fallback-card tests in `src/adapters/ListingAdapter.test.ts` still pass unmodified (single-candidate cases), updating only if the new helper changes their expected structure.
- [ ] 3.4 Run the full test suite (`npm test` or equivalent) and confirm no regressions in `CardOverlayManager.test.ts` or other adapter-dependent tests.

## 4. Cleanup

- [ ] 4.1 Update the `ListingAdapter.ts` file-level/function doc comments to describe the new title-candidate exclusion rule, since they currently describe the old "photo boundary" logic only in terms of card-root resolution.
