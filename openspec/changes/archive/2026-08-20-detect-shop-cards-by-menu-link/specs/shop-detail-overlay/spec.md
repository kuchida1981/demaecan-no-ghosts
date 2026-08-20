## MODIFIED Requirements

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
