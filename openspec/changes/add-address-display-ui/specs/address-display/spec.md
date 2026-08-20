## ADDED Requirements

### Requirement: Address label under the shop name
For every shop-listing card matching `article[aria-labelledby^="shoplist-"]`, the system SHALL insert an address label element directly after the card's shop-name element (identified via the card's `aria-labelledby` value). The label SHALL display the shop's cached address, truncated to a single line with an ellipsis when it does not fit the card's width. Cards without an identifiable shop-name element (e.g. carousel/link-based fallback cards) SHALL NOT receive an address label.

#### Scenario: Address label appears for a card with a cached address
- **WHEN** a shop-listing card matching the `aria-labelledby` pattern is decorated and a cached address already exists for its shopId
- **THEN** an address label showing that address is inserted immediately after the shop-name element

#### Scenario: Address label starts empty and fills in once the address resolves
- **WHEN** a shop-listing card is decorated and no cached address exists yet for its shopId
- **THEN** the address label is inserted empty (no placeholder text), and is updated to show the address once it becomes available in the store (e.g. once the prefetch queue resolves it)

#### Scenario: Long addresses are truncated to one line
- **WHEN** an address label's text does not fit within the card's width on one line
- **THEN** the overflowing text is truncated with an ellipsis rather than wrapping or expanding the card

#### Scenario: Carousel cards do not receive an address label
- **WHEN** a shop card is detected via the link-based fallback path (no `aria-labelledby` shop-name element)
- **THEN** no address label is inserted for that card

### Requirement: Address display toggle
The system SHALL provide a checkbox, alongside the existing judgment-visibility checkboxes in the filter panel, that shows or hides every address label on the page. This checkbox SHALL read and write the same persistent flag used to gate address prefetching (`addressPrefetchEnabled`), so that turning address display off also stops the prefetch queue, and turning it on resumes both.

#### Scenario: Unchecking the toggle hides all address labels
- **WHEN** a user unchecks the address-display checkbox
- **THEN** every address label currently on the page becomes hidden, and no new address labels are prefetched until the checkbox is checked again

#### Scenario: Checking the toggle shows address labels again
- **WHEN** a user checks the address-display checkbox after it was off
- **THEN** address labels for shops with a cached address become visible again, and prefetching resumes for shops still uncached

#### Scenario: Checkbox reflects the current flag on load
- **WHEN** a shop-listing page is loaded
- **THEN** the address-display checkbox's initial checked state matches the persisted `addressPrefetchEnabled` flag (checked by default)

### Requirement: Hover list of shops sharing the same address
Hovering (on hover-capable pointers) or clicking (on all devices) a card's address label SHALL reveal a tooltip listing the other shops - excluding the card's own shop - whose cached address normalizes to the same value as this shop's address. Each listed shop SHALL be shown by its cached name, falling back to its shopId when no cached name exists, and SHALL link to that shop's own menu page in a new browser tab. If no other shop shares the normalized address, no tooltip SHALL be shown.

#### Scenario: Tooltip lists other shops at the same normalized address
- **WHEN** a user hovers or clicks an address label whose normalized address matches one or more other cached shops
- **THEN** a tooltip appears listing those other shops (excluding the hovered shop itself) by name

#### Scenario: No tooltip when no other shop shares the address
- **WHEN** a user hovers or clicks an address label whose normalized address matches no other cached shop
- **THEN** no tooltip is shown

#### Scenario: Listed shop falls back to its shopId when unnamed
- **WHEN** the tooltip lists a shop whose cached record has no name
- **THEN** that entry displays the shopId instead of a name

#### Scenario: Listed shop links to its own menu page in a new tab
- **WHEN** a user activates a shop entry inside the tooltip
- **THEN** that shop's own menu page opens in a new browser tab

#### Scenario: Tooltip opens in whichever direction fits the viewport
- **WHEN** a tooltip is revealed for an address label positioned near the bottom edge of the viewport
- **THEN** the tooltip opens upward instead of downward so it remains fully visible

#### Scenario: Tooltip opens downward when there is room
- **WHEN** a tooltip is revealed for an address label with enough space below it in the viewport
- **THEN** the tooltip opens downward
