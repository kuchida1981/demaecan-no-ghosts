## MODIFIED Requirements

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
