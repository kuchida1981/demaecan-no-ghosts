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
On a shop's own page (`/shop/menu/{shopId}`), the system SHALL provide the same judgment controls (mark ghost / mark not-ghost / clear) as the card popover, operating on the shopId of the currently viewed shop.

#### Scenario: Mark shop as ghost from the shop page
- **WHEN** a user activates the "ghost" control while viewing a shop's own page
- **THEN** the system stores a "ghost" judgment for that page's shopId

### Requirement: Persisted judgment storage
Judgment results SHALL be persisted keyed by shopId using the userscript's browser storage (`GM_setValue`/`GM_getValue`) so that they remain available after page reloads and browser restarts.

#### Scenario: Judgment survives reload
- **WHEN** a shop has been judged and the page is reloaded or revisited later
- **THEN** the previously stored judgment for that shopId is still available and reflected in the UI

### Requirement: Card badge reflects stored judgment
Every shop card SHALL display a badge that reflects its stored judgment: a "ghost" badge when judged ghost, a "not-ghost" badge when judged not-ghost, and no badge when unjudged.

#### Scenario: Ghost badge shown
- **WHEN** a shop card's shopId has a stored "ghost" judgment
- **THEN** the card displays a "ghost" badge

#### Scenario: Not-ghost badge shown
- **WHEN** a shop card's shopId has a stored "not-ghost" judgment
- **THEN** the card displays a "not-ghost" badge

#### Scenario: No badge for unknown shops
- **WHEN** a shop card's shopId has no stored judgment
- **THEN** the card displays neither the "ghost" nor the "not-ghost" badge

