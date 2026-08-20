# Demaecan No Ghosts

[日本語版はこちら](README.ja.md)

A [Tampermonkey](https://www.tampermonkey.net/) userscript for [demae-can.com](https://demae-can.com/) that surfaces a shop's address on listing cards and lets you mark and filter out "ghost restaurants" (delivery-only brands operating under a storefront-like listing).

## Features

- **Info icon on shop cards** — every shop card on listing pages (including the "過去に注文したお店" / previously-ordered carousel) gets an info icon in its top-right corner. Click or hover it to reveal a popover with the shop's name, address (fetched on demand), a Google Maps link, a Google search link, and a button to re-fetch the address.
- **Ghost / not-ghost judgment** — mark a shop as ghost (👻) or not-ghost (🏠) from the popover or from the shop's own page. The judgment is saved and reflected as the info icon's glyph everywhere that shop appears.
- **Filter toggle** — a toggle in the bottom-right corner hides shops judged as "ghost" from the listing.
- **Shop page panel** — visiting a shop's own page (`/shop/menu/{shopId}` or `/shopDetail/{shopId}/{areaId}`) shows a judgment panel in the bottom-left corner, kept in sync as you navigate the site.

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Open the userscript URL below; Tampermonkey will offer to install it:

   ```
   https://raw.githubusercontent.com/kuchida1981/demaecan-no-ghosts/stable/demaecan-no-ghosts.user.js
   ```

The script auto-updates from the same URL. If you want to try in-development changes, use the `unstable` branch instead:

```
https://raw.githubusercontent.com/kuchida1981/demaecan-no-ghosts/unstable/demaecan-no-ghosts.user.js
```

## Development

```bash
npm install       # install dependencies
npm test          # run tests (vitest) with coverage
npm run lint       # lint with eslint
npm run check-types # type-check with tsc
npm run build      # build dist/demaecan-no-ghosts.user.js
```

This project uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) to plan and track changes; see the `openspec/` directory.

## License

[ISC](https://opensource.org/licenses/ISC)
