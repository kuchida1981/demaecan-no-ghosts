## MODIFIED Requirements

### Requirement: Detail popover reveal
The info icon SHALL reveal a popover containing the shop name, address, a Google Maps link, and a Google search link. The popover SHALL be revealed via pointer hover on devices that support hover, and via click/tap on all devices. Hover revealing SHALL be scoped to the info icon itself: hovering over any other part of the shop card (e.g. the photo or shop name) SHALL NOT reveal the popover. Once revealed via hover, the popover SHALL remain open while the user moves the pointer from the info icon into the popover, so that its contents (links, buttons) can be reached and operated with the mouse.

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
