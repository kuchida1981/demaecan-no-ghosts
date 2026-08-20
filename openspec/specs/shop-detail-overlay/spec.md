# shop-detail-overlay Specification

## Purpose
TBD - created by archiving change add-ghost-shop-detector. Update Purpose after archive.
## Requirements
### Requirement: Icon injection on shop cards
The system SHALL inject an info icon into every shop card rendered on shop-listing pages (top page, category/genre pages), including cards that are added to the page after initial load (e.g. via a "もっと見る" load-more action or a carousel section such as "過去に注文したお店"). A shop card is any element that either matches `article[aria-labelledby^="shoplist-"]`, or contains a link to a shop's menu page (`/shop/menu/{shopId}`) together with an image, resolved to the closest such containing element that is not already covered by the `article[aria-labelledby^="shoplist-"]` match — **except** that a link-based card whose content (outside the sub-element containing its featured photo) contains two or more title-like text elements (an element with a direct, non-whitespace text node and no nested image) SHALL NOT be treated as a shop card, since the shop name cannot be reliably distinguished from other title-like text (e.g. a promoted product/menu-item name) on such cards.

#### Scenario: Icon appears on initially rendered cards
- **WHEN** a shop-listing page finishes its initial render
- **THEN** every shop card present in the DOM has an info icon injected into it

#### Scenario: Icon appears on dynamically loaded cards
- **WHEN** additional shop cards are added to the page after the user triggers a load-more action
- **THEN** the newly added cards also have an info icon injected into them, without requiring a page reload

#### Scenario: Icon appears on carousel-style cards with different markup
- **WHEN** a shop-listing page renders a carousel section (e.g. "過去に注文したお店") whose cards are not `article[aria-labelledby^="shoplist-"]` elements but do contain a shop menu-page link and an image, and exactly one title-like text element outside the photo
- **THEN** each such card also has an info icon injected into it

#### Scenario: A card's internal link is not double-counted
- **WHEN** a shop card matching `article[aria-labelledby^="shoplist-"]` contains a shop menu-page link inside it
- **THEN** that link does not cause a second, separate card to be detected for the same shop

#### Scenario: Icon does not appear on a paid product-placement card
- **WHEN** a link-based card contains, outside its featured-photo sub-element, two or more title-like text elements (e.g. a shop-name line and a separate bold product/menu-item-name line, such as demae-can's paid featured-placement promotional cards)
- **THEN** no info icon is injected into that card, and it is not counted as a shop card

### Requirement: Detail popover reveal
The info icon SHALL reveal a popover containing the shop name, address, a Google Maps link, and a Google search link. The shop name displayed SHALL be the shop's own name, not a concatenation of surrounding card text (badges, rating, delivery time, price, or, for link-based cards, other title-like text). For a link-based (fallback-path) card, the shop name SHALL be derived from the single title-like text element found outside the card's featured-photo sub-element (an element with a direct, non-whitespace text node and no nested image), never from the raw text of the entire shop-menu-page link. The popover SHALL be revealed via pointer hover on devices that support hover, and via click/tap on all devices. Hover revealing SHALL be scoped to the info icon itself: hovering over any other part of the shop card (e.g. the photo or shop name) SHALL NOT reveal the popover. Once revealed via hover, the popover SHALL remain open while the user moves the pointer from the info icon into the popover, so that its contents (links, buttons) can be reached and operated with the mouse.

#### Scenario: Hover reveals popover on pointer devices
- **WHEN** a user with a hover-capable pointer moves the cursor over a shop card's info icon
- **THEN** the popover opens showing the shop name, address, Google Maps link, and Google search link for that shop

#### Scenario: Hovering elsewhere on the card does not reveal the popover
- **WHEN** a user with a hover-capable pointer moves the cursor over a shop card, but not over its info icon
- **THEN** the popover does not open

#### Scenario: Moving the cursor from the icon into the popover keeps it open
- **WHEN** a popover has been revealed by hovering the info icon, and the user moves the cursor from the icon directly into the popover
- **THEN** the popover remains open, allowing its links and buttons to be operated

#### Scenario: Click reveals popover on touch devices
- **WHEN** a user taps a shop card's info icon on a touch device
- **THEN** the popover opens showing the same shop name, address, Google Maps link, and Google search link

#### Scenario: Map and search links open in a new window
- **WHEN** the popover is displayed with a resolved address
- **THEN** the Google Maps link target is a Google Maps search URL built from the shop's address, and the Google search link target is a Google search URL built from the shop's name, and both links open in a new browser tab/window

#### Scenario: Popover shows a clean shop name on a fallback-path card
- **WHEN** a link-based shop card wraps its photo, a badge, the shop name, a star rating, and a delivery time all inside the same shop-menu-page link, with exactly one title-like text element outside the photo
- **THEN** the popover's shop name shows only the shop name, without the badge text, rating, or delivery time appended to it

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

