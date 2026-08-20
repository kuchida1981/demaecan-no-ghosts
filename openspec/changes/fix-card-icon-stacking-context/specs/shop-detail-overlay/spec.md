## ADDED Requirements

### Requirement: Overlay elements stay scoped within their card's stacking order
Injected overlay elements (info icon, popover, judgment badge) SHALL never render above demae-can's own page-level UI (e.g. a sticky/fixed header or navigation) when the shop card they belong to is scrolled to a screen position behind that page-level UI. When the system sets `position: relative` on a shop card to give it a positioning context (because the card had no non-static position of its own), it SHALL also give that card its own CSS stacking context (e.g. by setting an explicit `z-index`), so that the overlay's own high z-index is contained within the card and cannot be compared against elements outside it.

#### Scenario: Card scrolled behind a sticky header does not show its icon on top
- **WHEN** a shop card that received `position: relative` from the system is scrolled to a screen position behind demae-can's sticky header
- **THEN** the header renders above the card and its injected info icon, and no part of the icon, popover, or badge is visible on top of the header

#### Scenario: Overlay elements still render above the card's own content
- **WHEN** a shop card's info icon, popover, or badge is displayed
- **THEN** it still renders above all other content within that same card, unaffected by the card now having its own stacking context

#### Scenario: A card that already establishes its own stacking context is left as-is
- **WHEN** a shop card already has a non-static `position` set by demae-can's own markup (e.g. a carousel card using `position: relative` with its own `z-index`)
- **THEN** the system does not override that card's existing `position` or `z-index`
