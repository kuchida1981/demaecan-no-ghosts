## Context

`src/adapters/ListingAdapter.ts` detects shop cards on demae-can.com listing pages via two paths:

1. `article[aria-labelledby^="shoplist-"]` (the "normal" path) — unaffected by this change.
2. A fallback path (`getLinkBasedShopCards` / `findLinkCardRoot` / `isLinkCardRoot`) for cards with other markup, resolved by walking up from a `/shop/menu/{id}` link to the nearest ancestor containing the card's featured photo (see `FEATURED_IMG_SELECTOR`).

`extractShopName` currently returns the fallback card's shop-menu link's raw `textContent`. Two real-world card shapes break this (issue #20):

- **Garbled shop card**: the link wraps the photo, a badge ("クーポンあり"), the shop name, star rating, delivery time, and shipping fee — all in one `<a>`, so `textContent` concatenates all of it.
- **Paid product-placement card**: demae-can's promotional/sale placement for a shop's specific menu item. The link wraps the photo, badges, a *shop name* line, a *product name* line (styled as the bold headline), and a price — `textContent` concatenates shop name and product name together, and even a "pick the right one" fix would need to distinguish two structurally similar title-like lines.

Class names on this site are Tailwind utility classes only (no stable hooks), so the fix can't key off specific class names — it has to use structural shape.

## Goals / Non-Goals

**Goals:**
- Extract a clean shop name for fallback-path cards that only contain a single, unambiguous name-like element.
- Never inject an info icon/popover using a fabricated or misattributed name (e.g. a product name instead of the shop name).
- Keep the fix resilient to Tailwind class churn by relying only on DOM shape (text-node/element structure), not class names.

**Non-Goals:**
- Fixing/hardening the `article[aria-labelledby^="shoplist-"]` path (not currently broken; deferred — see Open Questions).
- Extracting a shop name from paid product-placement cards at all. These are excluded from shop-card detection entirely rather than partially supported.
- Deduplicating icons when the same shop appears both as a normal card and as a product-placement card elsewhere on the page (out of scope; the product-placement card simply won't get its own icon).

## Decisions

### Boundary: exclude the photo-containing subtree before looking for title text

Reuse the existing `FEATURED_IMG_SELECTOR` concept (an `<img>` not served from `static-assets/images/`, i.e. the shop/dish photo rather than a decorative icon). Within the fallback card's shop-menu link, find the smallest descendant subtree that contains such an image, and exclude that entire subtree from title search. This one exclusion removes both the badge overlay (`クーポンあり`/`セール中`/`お店価格`, which sits inside the same photo-wrapper block) and the photo itself, in one step, without needing a separate "is this a badge" check.

**Alternative considered**: match badge text/spans directly (e.g. by their overlay-positioning classes). Rejected — those classes are exactly the kind of unstable Tailwind utility class this fix needs to avoid depending on.

### Candidate detection: direct text node + no nested `<img>`

Within what's left after the photo-subtree exclusion, an element is a "title candidate" if it has at least one direct child `Text` node with non-whitespace content, and contains no descendant `<img>`. This distinguishes:
- Title-like lines (shop name, product name) — text sits directly in the element.
- Metric rows (rating, delivery time, price) — their text sits inside nested `<span>` children (and rating/time also nest an `<img>`), so the row element itself has no *direct* text node child.

**Alternative considered**: use `element.textContent` non-emptiness. Rejected — every ancestor up to the anchor itself has non-empty `textContent` (it's cumulative), so this doesn't distinguish anything; it's exactly what today's buggy `extractShopName` effectively does at the anchor level.

### Candidate count decides the outcome — no order-dependent guessing

- **Exactly one candidate** → treat as a normal fallback shop card; use its text as the shop name.
- **Zero or two-or-more candidates** → do not treat the element as a shop card at all (`getShopCards` and `matchesShopCard`/`isLinkCardRoot` must agree on this — both need to run the same candidate-counting logic, since `CardOverlayManager` uses `getShopCards` on initial load and `matchesShopCard` via its `MutationObserver` callback for cards added later).

**Alternative considered**: when there are two candidates, assume the shop name is always the first one in DOM order (true in both samples gathered so far, where the shop name is a small "eyebrow" line above the bold product-name headline). Rejected as the primary strategy — it's an unproven layout assumption about demae-can's markup, and guessing wrong would silently mislabel a product as a shop (or vice versa) in the popover, which is worse than not decorating the card at all. See Risks for the cost of this choice.

## Risks / Trade-offs

- **[Risk]** A future fallback card shape wraps the shop name in an extra element (e.g. `<p><span>name</span></p>`), giving zero candidates → the card silently gets no icon at all, rather than a wrong one.
  → **Mitigation**: accepted trade-off. Silently under-decorating (no icon) is preferable to silently mis-decorating (wrong shop name shown as fact) for a tool whose purpose is trustworthy ghost/real-store judgment. Revisit if real-world reports show shops going undetected.
- **[Risk]** A shop that appears on some page *only* via paid product-placement cards (never via a normal card) gets no icon anywhere on that page.
  → **Mitigation**: accepted for this change; the same shop is expected to also appear via normal listing cards elsewhere (search results, its own category page). Flagged in the proposal as a known limitation, not solved here.
- **[Risk]** `getShopCards` (initial scan) and `matchesShopCard`/`isLinkCardRoot` (mutation-observed cards) must apply identical candidate-counting logic, or cards could be decorated inconsistently depending on whether they were present at load time or added later.
  → **Mitigation**: implement the candidate-detection logic once as a shared helper and have both code paths call it, mirroring how `findLinkCardRoot` is already shared today.

## Migration Plan

Pure code change within `src/adapters/ListingAdapter.ts` (plus tests); no data migration, no persisted-state format change. Ships in the next userscript release like any other fix.

## Open Questions

- Should the `article[aria-labelledby^="shoplist-"]` path also be hardened to prefer `#shoplist-{id}-shopname` text over anchor `textContent`, as a safety net against future markup drift? Deferred out of this change's scope per the proposal; worth a follow-up issue if it's wanted.
- Is there a real-world fallback card shape with three or more title-like candidates, or a shop-name/product-name ordering that contradicts what's been observed so far? Not yet seen; the candidate-count rule treats "two or more" uniformly, so this shouldn't require design changes, but more samples would increase confidence.
