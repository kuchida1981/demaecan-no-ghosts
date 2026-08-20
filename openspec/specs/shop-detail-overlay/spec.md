# shop-detail-overlay Specification

## Purpose
TBD - created by archiving change add-ghost-shop-detector. Update Purpose after archive.
## Requirements
### Requirement: Icon injection on shop cards
The system SHALL inject an info icon into every shop card rendered on shop-listing pages (top page, category/genre pages), including cards that are added to the page after initial load (e.g. via a "もっと見る" load-more action or a carousel section such as "過去に注文したお店"). A shop card is any element that either matches `article[aria-labelledby^="shoplist-"]`, or contains a link to a shop's menu page (`/shop/menu/{shopId}`) together with an image, resolved to the closest such containing element that is not already covered by the `article[aria-labelledby^="shoplist-"]` match.

#### Scenario: Icon appears on initially rendered cards
- **WHEN** a shop-listing page finishes its initial render
- **THEN** every shop card present in the DOM has an info icon injected into it

#### Scenario: Icon appears on dynamically loaded cards
- **WHEN** additional shop cards are added to the page after the user triggers a load-more action
- **THEN** the newly added cards also have an info icon injected into them, without requiring a page reload

#### Scenario: Icon appears on carousel-style cards with different markup
- **WHEN** a shop-listing page renders a carousel section (e.g. "過去に注文したお店") whose cards are not `article[aria-labelledby^="shoplist-"]` elements but do contain a shop menu-page link and an image
- **THEN** each such card also has an info icon injected into it

#### Scenario: A card's internal link is not double-counted
- **WHEN** a shop card matching `article[aria-labelledby^="shoplist-"]` contains a shop menu-page link inside it
- **THEN** that link does not cause a second, separate card to be detected for the same shop

### Requirement: Detail popover reveal
The info icon SHALL reveal a popover containing the shop name, address, a Google Maps link, and a Google search link. The popover SHALL be revealed via pointer hover on devices that support hover, and via click/tap on all devices. Hover revealing SHALL be scoped to the info icon itself: hovering over any other part of the shop card (e.g. the photo or shop name) SHALL NOT reveal the popover.

#### Scenario: Hover reveals popover on pointer devices
- **WHEN** a user with a hover-capable pointer moves the cursor over a shop card's info icon
- **THEN** the popover opens showing the shop name, address, Google Maps link, and Google search link for that shop

#### Scenario: Hovering elsewhere on the card does not reveal the popover
- **WHEN** a user with a hover-capable pointer moves the cursor over a shop card, but not over its info icon
- **THEN** the popover does not open

#### Scenario: Click reveals popover on touch devices
- **WHEN** a user taps a shop card's info icon on a touch device
- **THEN** the popover opens showing the same shop name, address, Google Maps link, and Google search link

#### Scenario: Map and search links open in a new window
- **WHEN** the popover is displayed with a resolved address
- **THEN** the Google Maps link target is a Google Maps search URL built from the shop's address, and the Google search link target is a Google search URL built from the shop's name, and both links open in a new browser tab/window

### Requirement: On-demand address fetch with cache
The system SHALL fetch address data for a shop from `/shopDetail/{shopId}` only the first time its popover is opened, and SHALL reuse the cached result for that shop on subsequent popover opens without issuing another network request.

#### Scenario: First open triggers a fetch
- **WHEN** a shop's popover is opened for the first time and no cached address exists for that shopId
- **THEN** the system requests `/shopDetail/{shopId}`, parses the address from the response, displays it in the popover, and stores it in the persistent cache keyed by shopId

#### Scenario: Subsequent open uses cache
- **WHEN** a shop's popover is opened and a cached address already exists for that shopId
- **THEN** the system displays the cached address immediately without issuing a network request

### Requirement: Manual refetch
The popover SHALL provide a manual refetch action that re-requests `/shopDetail/{shopId}` and overwrites the cached address for that shop, regardless of whether a cached value already exists.

#### Scenario: User triggers refetch
- **WHEN** a user activates the refetch action in an open popover
- **THEN** the system requests `/shopDetail/{shopId}` again, and on success replaces the cached and displayed address with the newly fetched value

### Requirement: Fetch failure handling
WHEN the address fetch fails (network error) or the shop's address cannot be located in the response, THEN the system SHALL show an error/empty state within the popover instead of leaving it blank or breaking the surrounding page.

#### Scenario: Fetch failure shows error state
- **WHEN** a request to `/shopDetail/{shopId}` fails or its response does not contain a parseable address
- **THEN** the popover displays an error/empty state for the address, and the rest of the shop-listing page continues to function normally

