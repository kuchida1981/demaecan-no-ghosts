# ghost-shop-filter Specification

## Purpose
TBD - created by archiving change add-ghost-shop-detector. Update Purpose after archive.
## Requirements
### Requirement: Filter toggle control
The system SHALL provide three independent, persistent checkbox controls, visible on shop-listing pages, for showing or hiding shop cards by judgment category: "ghost", "not-ghost" (実店舗), and "unjudged" (未評価). Each checkbox's ON/OFF state SHALL be persisted independently using the userscript's browser storage and restored on subsequent page loads. When no persisted state exists (first run, or the stored value is missing/unparsable), all three checkboxes SHALL default to checked (visible).

#### Scenario: Three checkboxes are visible on listing pages
- **WHEN** a user views a shop-listing page (top page or category/genre page)
- **THEN** three filter checkboxes, labeled for ghost, not-ghost, and unjudged, are visible on the page

#### Scenario: Checkbox states persist across page loads
- **WHEN** a user sets any of the three checkboxes to ON or OFF and later loads or reloads a shop-listing page
- **THEN** each checkbox reflects its previously set state

#### Scenario: Default state is all checked when no state is persisted
- **WHEN** a user views a shop-listing page for the first time, or the persisted filter state is missing or unparsable
- **THEN** all three checkboxes are checked and all shop cards are visible regardless of judgment

### Requirement: Hiding shop cards based on judgment visibility checkboxes
WHEN a shop card's judgment category checkbox is unchecked, THEN that shop card SHALL be hidden from the listing. A shop card's judgment category SHALL be "ghost" for a stored "ghost" judgment, "not-ghost" for a stored "not-ghost" judgment, and "unjudged" for no stored judgment.

#### Scenario: Ghost-judged cards hidden when the ghost checkbox is unchecked
- **WHEN** the "ghost" checkbox is unchecked
- **THEN** every shop card whose shopId has a stored "ghost" judgment is hidden from the listing

#### Scenario: Not-ghost cards hidden when the not-ghost checkbox is unchecked
- **WHEN** the "not-ghost" checkbox is unchecked
- **THEN** every shop card whose shopId has a stored "not-ghost" judgment is hidden from the listing

#### Scenario: Unjudged cards hidden when the unjudged checkbox is unchecked
- **WHEN** the "unjudged" checkbox is unchecked
- **THEN** every shop card whose shopId has no stored judgment is hidden from the listing

#### Scenario: Cards remain visible when their category checkbox is checked
- **WHEN** a shop card's judgment category checkbox is checked
- **THEN** that shop card is visible in the listing, independent of the state of the other two checkboxes

### Requirement: Restoring hidden shops when a checkbox is checked
WHEN a previously unchecked judgment category checkbox is checked, THEN all shop cards belonging to that judgment category SHALL become visible again, regardless of the state of the other two checkboxes.

#### Scenario: Checking a checkbox restores its category's hidden cards
- **WHEN** the "ghost" checkbox is switched from OFF to ON
- **THEN** any shop cards that were hidden due to a "ghost" judgment become visible again

#### Scenario: Other categories' visibility is unaffected
- **WHEN** the "ghost" checkbox is switched from OFF to ON while the "not-ghost" checkbox remains OFF
- **THEN** not-ghost-judged shop cards remain hidden

### Requirement: Filter applies to dynamically changing cards
The filter SHALL apply consistently, without requiring a page reload, both to shop cards added to the page after initial load and to cards whose judgment changes while the page is open.

#### Scenario: Newly loaded card is hidden immediately if its category checkbox is unchecked
- **WHEN** the "ghost" checkbox is unchecked and additional shop cards are added to the page via a load-more action
- **THEN** any newly added card whose shopId has a stored "ghost" judgment is hidden immediately, without a page reload

#### Scenario: Judging a visible card hides it immediately if its new category checkbox is unchecked
- **WHEN** the "ghost" checkbox is unchecked and a user marks a currently visible shop card as "ghost"
- **THEN** that card is hidden immediately, without a page reload

