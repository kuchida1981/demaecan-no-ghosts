## Context

`CardOverlayManager.decorateCard` injects an info icon (`.ghosts-icon-btn`), its popover (`.ghosts-popover`), and a judgment badge (`.ghosts-badge`) into every shop card on demae-can's listing pages. All three use `z-index: 2147483000` (`src/ui/styles.ts`) to guarantee they paint above the card's own content. `_ensurePositioned` (`src/managers/CardOverlayManager.ts`) gives the card `position: relative` only if it isn't already positioned, so the icon (an absolutely-positioned descendant) has a containing block.

Verified against a captured copy of demae-can's real listing markup (`toppage.html`, analyzed with jsdom): the primary card type (`article[aria-labelledby^="shoplist-"]`, all 115 cards on the sampled page) has no `position`/`z-index`/`transform`/`filter`/`opacity`/`isolation` of its own, and neither does any ancestor up through `<main>`. Per the CSS stacking-context rules, `position: relative` alone (without an explicit `z-index`) does **not** create a new stacking context. So the icon's `z-index: 2147483000` is compared directly against elements in the *page's* stacking context — including demae-can's own `<header>`, which is `position: sticky; z-index: 30`. Once a card scrolls to a screen position behind the sticky header, the header (z-index 30) should cover it, but the icon (z-index 2,147,483,000) wins the comparison and renders on top — reproducing issue #19's screenshot.

(Note: a subset of demae-can's own carousel cards, e.g. "過去に注文したお店", already wrap their content in an element with `relative z-0 overflow-hidden` set by demae-can itself. Those cards already form their own stacking context and are not affected by this bug — which is itself evidence for the fix direction below, since it mirrors a pattern demae-can already relies on.)

## Goals / Non-Goals

**Goals:**
- Stop injected overlay elements from ever rendering above demae-can's own page-level UI (sticky header now; any other current/future fixed/sticky chrome with a "normal" z-index by extension).
- Keep the fix independent of demae-can's actual header z-index value, so it doesn't silently break again if demae-can changes that number.
- Preserve current behavior of the icon/popover/badge always winning over other content *inside* the same card.

**Non-Goals:**
- Not touching `.ghosts-filter-panel` / `.ghosts-shop-page-panel` (`position: fixed`, not card-attached — unaffected by this bug).
- Not reducing the literal `2147483000` values in `src/ui/styles.ts`.
- Not changing icon/popover/badge visual design or interaction behavior.

## Decisions

**Decision: contain the overlay's z-index by giving the card its own stacking context (`position: relative; z-index: 0`), rather than lowering the overlay's z-index below a hardcoded "safe" number.**

Two approaches were considered:

- **A — Lower the overlay's z-index** (e.g. to something below demae-can's header, like `10`): simplest one-line-ish change, but the "safe" ceiling is an assumption about demae-can's current markup. If demae-can raises its header's z-index (or ships a modal/dropdown with a higher one) above that hardcoded value in the future, the same bug reappears elsewhere with no local signal that it broke.
- **B — Give the card a stacking context** by setting `z-index: 0` alongside the existing `position: relative` in `_ensurePositioned`: the card itself now participates in the page's stacking order at `z-index: 0`, comfortably below virtually any deliberately-elevated chrome z-index a site would use (headers/nav/modals are essentially never `z-index: 0` or negative). Everything painted inside the card — including the overlay's `2147483000` — is now scoped *within* that card's local stacking context and can never be compared against elements outside it. This requires no assumption about demae-can's specific z-index values at all.

Chose **B**. It also matches what demae-can's own carousel-card markup already does (`relative z-0`), suggesting it's a robust, idiomatic way to sandbox an overlay within a card on this kind of page.

**Decision: only set `z-index` when `_ensurePositioned` is the one assigning `position: relative`.**

If a card already has a non-static `position` from demae-can's own CSS, it may already establish its own stacking context (as seen with the carousel cards, which also carry `z-0`) or intentionally not have one for a reason we can't infer. `_ensurePositioned` should not overwrite a `z-index` demae-can set. Concretely: only set `card.style.zIndex = '0'` in the same branch where `card.style.position` is being set to `'relative'` (i.e., cards that arrive with `position: static`). This keeps the change minimal and scoped to the case that's actually broken today (plain `article` cards with no positioning at all).

## Risks / Trade-offs

- [Risk] A demae-can card that is `position: static` today might, on some page or future markup, rely on painting *above* a positioned sibling via a large implicit z-index. Containing it at `z-index: 0` could change that.
  → Mitigation: this only applies to elements `CardOverlayManager` already treats as shop cards (a narrow, well-defined set matched by `SHOP_CARD_SELECTOR` or the link-based fallback heuristic), and giving a `static` element `z-index: 0` doesn't change its paint order relative to same-context siblings that are also default-stacked — it only stops descendants inside it from escaping. Low risk in practice.
- [Risk] `z-index: 0` on the card, combined with the overlay's own new local stacking context, changes nothing about the popover's ability to render outside the card's box if the card (or an ancestor) has `overflow: hidden`. This isn't introduced by this change — it already existed — but is worth flagging as a separate, not-yet-observed potential issue for future investigation.
  → Mitigation: out of scope here since issue #19 is specifically about the header-overlap symptom, not popover clipping; not covered by this change.

## Migration Plan

Single, backward-compatible code change in `CardOverlayManager._ensurePositioned`. No data migration, no flag needed — ship directly. Rollback is a plain revert if any regression surfaces.
