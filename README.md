# Le Tri Lam — cylindrical portfolio

A monochrome, responsive portfolio built with React, TypeScript, Vite, CSS, and SVG. No external fonts, image assets, animation library, or 3D engine. All three wheels share one component and interaction hook.

## Run

Requires Node.js 22.12+ (or a newer supported release) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

Deploy `dist/` to any static host. Vite uses relative asset paths, so repository subpaths are supported. The app needs no backend, environment variables, or runtime network requests.

## Customize

Edit **`src/data/portfolio.ts`**:

- `name`, `subtitle`: identity.
- `about`: editable introductions and content blocks. Set `placeholder: false` after replacing draft content.
- `contact`: replace `null` values with your email address, full HTTPS GitHub/LinkedIn profile URLs, and city/country. Unset values show an honest unavailable state. Configured profile items open in a new tab; email offers a mail link and copy action.
- `projects`: add/remove objects freely; numbering and wheel limits follow the array. Each supports `description`, `technologies`, `status`, `repositoryUrl`, `demoUrl`, and `extendedDescription`. Keep unavailable URLs `null`; set `placeholder: false` for actual projects. Use unique, stable `id` values.

The initial profile copy and project descriptions/technologies are explicitly labeled examples, not claims about the owner. No personal contact information is prefilled.

Geometry and responsive rules live in `src/styles/wheels.css` and `src/components/Wheel.tsx`. Shared typography and detail views live in `src/styles/global.css`.

## Controls

- Scroll over one wheel or drag vertically: select and snap, bounded at both ends.
- Click any visible entry: select it and open details (or a configured external profile).
- Tab: move between wheels. Arrow Up/Down, Page Up/Down, Home/End: select within the focused wheel. Enter/Space: open.
- Escape or Close: dismiss details and restore focus and wheel selections.
- Mobile: use the three section controls or swipe horizontally. Vertical swipes rotate the visible wheel. Switching sections preserves each selection.
- System reduced-motion preferences disable entrance transitions and smooth interpolation.

## Validate

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

The Playwright suite runs against a production build served locally. Install its Chromium once with `npx playwright install chromium`, or set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge. Screenshots and traces for failing cases go to ignored `test-results/`. Clipboard copy requires HTTPS or localhost and permission from the browser; a failed copy leaves the selectable address and email link available.
