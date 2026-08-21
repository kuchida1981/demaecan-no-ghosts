## MODIFIED Requirements

### Requirement: Filter toggle control
The system SHALL provide three independent, persistent checkbox controls, visible on shop-listing pages, for showing or hiding shop cards by judgment category: "ghost", "not-ghost" (実店舗), and "unjudged" (未評価). Each checkbox's ON/OFF state SHALL be persisted independently using the userscript's browser storage and restored on subsequent page loads. When no persisted state exists (first run, or the stored value is missing/unparsable), all three checkboxes SHALL default to checked (visible). The filter panel containing these checkboxes SHALL NOT be shown while the current page is a shop's own page (`/shop/menu/{shopId}` or `/shopDetail/{shopId}/{areaId}`), and SHALL mount or unmount as needed when the user navigates via the site's client-side (SPA) routing between a shop page and any other page, without requiring a reload.

#### Scenario: Three checkboxes are visible on listing pages
- **WHEN** a user views a shop-listing page (top page or category/genre page)
- **THEN** three filter checkboxes, labeled for ghost, not-ghost, and unjudged, are visible on the page

#### Scenario: Checkbox states persist across page loads
- **WHEN** a user sets any of the three checkboxes to ON or OFF and later loads or reloads a shop-listing page
- **THEN** each checkbox reflects its previously set state

#### Scenario: Default state is all checked when no state is persisted
- **WHEN** a user views a shop-listing page for the first time, or the persisted filter state is missing or unparsable
- **THEN** all three checkboxes are checked and all shop cards are visible regardless of judgment

#### Scenario: Filter panel is not shown on a shop's own page
- **WHEN** a user views a shop's own page (`/shop/menu/{shopId}` or `/shopDetail/{shopId}/{areaId}`)
- **THEN** the filter panel is not present on the page

#### Scenario: Filter panel unmounts when navigating from a listing page to a shop page via SPA routing
- **WHEN** the filter panel is mounted on a listing page and the user navigates to a shop's own page via the site's client-side router (no full page reload)
- **THEN** the filter panel is removed from the page without requiring a reload

#### Scenario: Filter panel remounts when navigating from a shop page back to a listing page via SPA routing
- **WHEN** the filter panel is unmounted on a shop's own page and the user navigates back to a shop-listing page via the site's client-side router (no full page reload)
- **THEN** the filter panel is mounted again, with each checkbox reflecting its persisted state
