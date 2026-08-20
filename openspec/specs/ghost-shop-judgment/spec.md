# ghost-shop-judgment Specification

## Purpose
TBD - created by archiving change add-ghost-shop-detector. Update Purpose after archive.
## Requirements
### Requirement: Judgment input from card popover
The shop card's detail popover SHALL provide controls for the user to mark the shop as "ghost" (ゴーストレストラン／デリバリー専用ブランド), mark it as "not-ghost" (実店舗と確認できた), or clear an existing judgment back to unknown.

#### Scenario: Mark shop as ghost from the card popover
- **WHEN** a user activates the "ghost" control in an open shop card popover
- **THEN** the system stores a "ghost" judgment for that shopId

#### Scenario: Mark shop as not-ghost from the card popover
- **WHEN** a user activates the "not-ghost" control in an open shop card popover
- **THEN** the system stores a "not-ghost" judgment for that shopId

#### Scenario: Clear judgment from the card popover
- **WHEN** a user activates the "clear judgment" control in an open shop card popover for a shop that currently has a stored judgment
- **THEN** the system removes the stored judgment for that shopId, returning it to the unknown state

### Requirement: Judgment input from shop page
On a shop's own page — either the menu page (`/shop/menu/{shopId}`) or the detail page (`/shopDetail/{shopId}/{areaId}`) — the system SHALL provide the same judgment controls (mark ghost / mark not-ghost / clear) as the card popover, operating on the shopId of the currently viewed shop. Because the shop-listing page navigates to the shop page via client-side (SPA) routing without a full page reload, the system SHALL detect such navigation and show or remove the judgment controls accordingly, without requiring the user to reload the page.

#### Scenario: Mark shop as ghost from the shop menu page
- **WHEN** a user activates the "ghost" control while viewing a shop's menu page
- **THEN** the system stores a "ghost" judgment for that page's shopId

#### Scenario: Mark shop as ghost from the shop detail page
- **WHEN** a user activates the "ghost" control while viewing a shop's detail page
- **THEN** the system stores a "ghost" judgment for that page's shopId

#### Scenario: Judgment controls appear after SPA navigation into a shop page
- **WHEN** a user navigates from a shop-listing page to a shop's own page via client-side routing (e.g. clicking a shop card)
- **THEN** the judgment controls for that page's shopId are shown without requiring a page reload

#### Scenario: Judgment controls are removed after SPA navigation away from a shop page
- **WHEN** a user navigates away from a shop's own page (e.g. back to a shop-listing page) via client-side routing while the judgment controls are shown
- **THEN** the judgment controls are removed from the page

#### Scenario: Judgment controls update when navigating between two shop pages
- **WHEN** a user navigates via client-side routing directly from one shop's own page to a different shop's own page while the judgment controls are shown
- **THEN** the judgment controls are updated to operate on the newly viewed shop's shopId

### Requirement: Persisted judgment storage
Judgment results SHALL be persisted keyed by shopId using the userscript's browser storage (`GM_setValue`/`GM_getValue`) so that they remain available after page reloads and browser restarts.

#### Scenario: Judgment survives reload
- **WHEN** a shop has been judged and the page is reloaded or revisited later
- **THEN** the previously stored judgment for that shopId is still available and reflected in the UI

### Requirement: Card badge reflects stored judgment
Every shop card's info icon SHALL reflect its stored judgment: displaying a ghost glyph (👻) when judged ghost, a shop glyph (🏠) when judged not-ghost, and the default info glyph (`i`) when unjudged. Shop-listing cards SHALL NOT display a separate text badge for the judgment; the info icon is the sole on-card indicator of judgment state.

#### Scenario: Ghost glyph shown on the info icon
- **WHEN** a shop card's shopId has a stored "ghost" judgment
- **THEN** the card's info icon displays the ghost glyph (👻)

#### Scenario: Not-ghost glyph shown on the info icon
- **WHEN** a shop card's shopId has a stored "not-ghost" judgment
- **THEN** the card's info icon displays the shop glyph (🏠)

#### Scenario: Default glyph for unknown shops
- **WHEN** a shop card's shopId has no stored judgment
- **THEN** the card's info icon displays the default info glyph (`i`)

#### Scenario: Icon glyph updates when the judgment changes
- **WHEN** a shop's judgment is set, changed, or cleared while its card is on the page
- **THEN** the card's info icon glyph updates to reflect the new judgment without requiring a page reload

