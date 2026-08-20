## ADDED Requirements

### Requirement: Filter toggle control
The system SHALL provide a persistent ON/OFF toggle control, visible on shop-listing pages, for hiding ghost-judged shops. The toggle's ON/OFF state SHALL be persisted using the userscript's browser storage and restored on subsequent page loads.

#### Scenario: Toggle is visible on listing pages
- **WHEN** a user views a shop-listing page (top page or category/genre page)
- **THEN** the filter toggle control is visible on the page

#### Scenario: Toggle state persists across page loads
- **WHEN** a user sets the toggle to ON (or OFF) and later loads or reloads a shop-listing page
- **THEN** the toggle reflects the previously set state

### Requirement: Hiding ghost-judged shops when filter is ON
WHEN the filter toggle is ON, THEN shop cards whose shopId has a stored "ghost" judgment SHALL be hidden from the listing. Cards with a "not-ghost" judgment or no judgment SHALL remain visible.

#### Scenario: Ghost-judged cards hidden when toggle is on
- **WHEN** the filter toggle is ON
- **THEN** every shop card whose shopId has a stored "ghost" judgment is hidden from the listing

#### Scenario: Not-ghost and unjudged cards remain visible when toggle is on
- **WHEN** the filter toggle is ON
- **THEN** shop cards whose shopId has a "not-ghost" judgment or no stored judgment remain visible

### Requirement: Restoring hidden shops when filter is OFF
WHEN the filter toggle is OFF, THEN all shop cards SHALL be visible regardless of their stored judgment.

#### Scenario: Toggle off restores hidden cards
- **WHEN** the filter toggle is switched from ON to OFF
- **THEN** any shop cards that were hidden due to a "ghost" judgment become visible again

### Requirement: Filter applies to dynamically changing cards
The filter SHALL apply consistently, without requiring a page reload, both to shop cards added to the page after initial load and to cards whose judgment changes while the page is open.

#### Scenario: Newly loaded ghost-judged card is hidden immediately
- **WHEN** the filter toggle is ON and additional shop cards are added to the page via a load-more action
- **THEN** any newly added card whose shopId has a stored "ghost" judgment is hidden immediately, without a page reload

#### Scenario: Judging a visible card as ghost hides it immediately
- **WHEN** the filter toggle is ON and a user marks a currently visible shop card as "ghost"
- **THEN** that card is hidden immediately, without a page reload
