## Why

Issue #19: the info icon (and its popover/badge) injected onto shop-listing cards is drawn with `z-index: 2147483000`. Because the card it's attached to only receives `position: relative` (no `z-index`), the card never becomes a CSS stacking context of its own, so that enormous z-index escapes the card and is compared directly against demae-can's own page chrome (its sticky header uses `z-index: 30`). When a card scrolls to a screen position behind the sticky header, the header should visually cover it — instead the injected icon punches through and renders on top of demae-can's global header.

## What Changes

- `CardOverlayManager._ensurePositioned` additionally sets `z-index: 0` on a card it positions (alongside the existing `position: relative`), so the card becomes its own stacking context and contains the icon/popover/badge's high z-index within it.
- No changes to the `2147483000` z-index values themselves in `src/ui/styles.ts` — they stay large so the icon/popover/badge always win *within* the card's own contents, but that value no longer leaks past the card boundary into demae-can's page-level stacking order.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shop-detail-overlay`: adds a requirement that injected overlay elements (info icon, popover, badge) must never render above demae-can's own page-level UI (e.g. its sticky header) when the card they belong to is scrolled behind it.

## Impact

- `src/managers/CardOverlayManager.ts` (`_ensurePositioned`) — implementation change.
- `src/ui/styles.ts` (`.ghosts-icon-btn`, `.ghosts-popover`, `.ghosts-badge`) — no value changes, but the fix's correctness depends on these staying scoped to a card that now establishes its own stacking context.
- Out of scope: `.ghosts-filter-panel` / `.ghosts-shop-page-panel`, which are `position: fixed` and not attached to a card, so they aren't affected by this bug.
