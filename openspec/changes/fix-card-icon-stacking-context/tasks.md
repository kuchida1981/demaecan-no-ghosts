## 1. Implementation

- [x] 1.1 In `src/managers/CardOverlayManager.ts`, update `_ensurePositioned` so that when the card's computed `position` is `static` (i.e. the branch that currently sets `card.style.position = 'relative'`), it also sets `card.style.zIndex = '0'`, establishing a stacking context on the card. Leave cards that already have a non-static `position` untouched.

## 2. Tests

- [x] 2.1 In `src/managers/CardOverlayManager.test.ts`, add a test asserting that a `static`-positioned card decorated by `decorateCard` ends up with both `position: relative` and `z-index: 0`.
- [x] 2.2 Add a test asserting that a card which already has a non-static `position` (and/or its own `z-index`) is left with its original `position`/`z-index` unchanged after decoration.
- [x] 2.3 Run the existing test suite (`npm test` or equivalent) to confirm no regressions.

## 3. Manual verification

- [x] 3.1 Load the extension against a real demae-can listing page (top page or genre page), scroll so a shop card passes behind the sticky header, and confirm the info icon/badge no longer renders on top of the header.
- [x] 3.2 Confirm the info icon, popover, and judgment badge still render above the card's own content (photo, badges, text) as before.
