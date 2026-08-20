## ADDED Requirements

### Requirement: Address display on shop page panel
The shop-page judgment panel (shown on a shop's own menu page `/shop/menu/{shopId}` or detail page `/shopDetail/{shopId}`) SHALL display the shop's address, a Google Maps link, a Google search link, and a manual refetch action, using the shopId of the currently viewed shop and the shop's own name (from the page's `<h1>`) for the search link query. This uses the same address block as the shop-listing card popover (same fetch/cache/refetch behavior, same visual presentation), rendered inline in the panel rather than revealed on hover/click.

#### Scenario: Panel shows address, map link, and search link
- **WHEN** the shop-page judgment panel is mounted for a shopId
- **THEN** the panel displays that shop's address once resolved, a Google Maps link built from the address, and a Google search link built from the shop's name

#### Scenario: Panel loads address immediately without waiting for user interaction
- **WHEN** the shop-page judgment panel is mounted for a shopId
- **THEN** the system begins resolving the address for that shopId immediately, without requiring the user to click or hover anything

#### Scenario: Panel shows the same address and links on both shop page URL forms
- **WHEN** the shop-page judgment panel is mounted while viewing either the shop's menu page (`/shop/menu/{shopId}`) or its detail page (`/shopDetail/{shopId}`)
- **THEN** the panel displays the same address, Google Maps link, and Google search link behavior in both cases

#### Scenario: Panel provides a manual refetch action
- **WHEN** a user activates the refetch action in the shop-page judgment panel
- **THEN** the system re-requests `/shopDetail/{shopId}` and, on success, replaces the cached and displayed address with the newly fetched value, the same as the card popover's refetch action

#### Scenario: Panel updates its address block when navigating between shop pages
- **WHEN** a user navigates via client-side routing from one shop's own page to a different shop's own page while the panel is shown
- **THEN** the panel's address block is rebuilt for the newly viewed shopId

## MODIFIED Requirements

### Requirement: On-demand address fetch with cache
The system SHALL fetch address data for a shop from `/shopDetail/{shopId}` only the first time it is needed for that shop — whether because a shop card's popover is opened, or because the shop-page judgment panel is mounted for that shopId — and SHALL reuse the cached result for that shop on subsequent lookups (popover opens or panel mounts) without issuing another network request.

#### Scenario: First open triggers a fetch
- **WHEN** a shop's popover is opened for the first time and no cached address exists for that shopId
- **THEN** the system requests `/shopDetail/{shopId}`, parses the address from the response, displays it in the popover, and stores it in the persistent cache keyed by shopId

#### Scenario: Subsequent open uses cache
- **WHEN** a shop's popover is opened and a cached address already exists for that shopId
- **THEN** the system displays the cached address immediately without issuing a network request

#### Scenario: Panel mount triggers a fetch when uncached
- **WHEN** the shop-page judgment panel is mounted for a shopId and no cached address exists for it
- **THEN** the system requests `/shopDetail/{shopId}`, parses the address from the response, displays it in the panel, and stores it in the persistent cache keyed by shopId

#### Scenario: Panel mount uses cache
- **WHEN** the shop-page judgment panel is mounted for a shopId and a cached address already exists for it
- **THEN** the panel displays the cached address immediately without issuing a network request

### Requirement: Manual refetch
Both the card popover and the shop-page judgment panel SHALL provide a manual refetch action that re-requests `/shopDetail/{shopId}` and overwrites the cached address for that shop, regardless of whether a cached value already exists.

#### Scenario: User triggers refetch from the card popover
- **WHEN** a user activates the refetch action in an open shop card popover
- **THEN** the system requests `/shopDetail/{shopId}` again, and on success replaces the cached and displayed address with the newly fetched value

#### Scenario: User triggers refetch from the shop page panel
- **WHEN** a user activates the refetch action in the shop-page judgment panel
- **THEN** the system requests `/shopDetail/{shopId}` again, and on success replaces the cached and displayed address with the newly fetched value

### Requirement: Fetch failure handling
WHEN the address fetch fails (network error) or the shop's address cannot be located in the response, THEN the system SHALL show an error/empty state within the popover or panel (whichever triggered the fetch) instead of leaving it blank or breaking the surrounding page.

#### Scenario: Fetch failure shows error state in the card popover
- **WHEN** a request to `/shopDetail/{shopId}` triggered by opening a card popover fails or its response does not contain a parseable address
- **THEN** the popover displays an error/empty state for the address, and the rest of the shop-listing page continues to function normally

#### Scenario: Fetch failure shows error state in the shop page panel
- **WHEN** a request to `/shopDetail/{shopId}` triggered by mounting the shop-page judgment panel fails or its response does not contain a parseable address
- **THEN** the panel displays an error/empty state for the address, and the rest of the shop page continues to function normally
