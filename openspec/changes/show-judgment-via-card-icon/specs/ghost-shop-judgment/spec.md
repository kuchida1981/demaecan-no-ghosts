## MODIFIED Requirements

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
