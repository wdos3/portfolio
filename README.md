# Le Tri Lam — cylindrical portfolio

A monochrome, responsive portfolio built with React, TypeScript, Vite, CSS, and SVG. ABOUT — WORK — CONTACT share one wheel component and gesture hook. Work is the central focus. No external fonts, imagery, animation library, router dependency, or 3D engine.

Opening an entry straightens and widens its own wheel. The other wheels move toward the edges and fade. Details live inside the expanded wheel, with no modal, backdrop, or separate page. Returning reverses the transformation and restores the existing wheel selections.

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
- `about`: Profile, Education, Experience, Skills, and Résumé / CV. Edit introductions and content blocks; set `placeholder: false` after replacing draft content. For the CV entry, add your actual document to `public/`, set `url` to its relative public path (for example `./Le-Tri-Lam-CV.pdf`), and adjust `fileName`. A configured CV gets a real download link. The shipped value is `null` because no document was supplied.
- `work`: the three category selectors — Software Projects (`software`), AI / ML Research (`research`), and Experiments (`experiments`).
- `projects`: add/remove objects freely. Set `category` to one of those three IDs; the category list updates automatically. Each item supports `description`, `problem`, `contributions`, `technologies`, `challenges`, `results`, `status`, `repositoryUrl`, `demoUrl`, and `extendedDescription`. Keep unavailable facts/results/URLs `null` and unknown contribution/challenge lists empty. Set `placeholder: false` for actual work. Stable, unique `id` values form the shareable URLs, so preserve them after sharing.
- `contact`: replace `null` values with your email address, full HTTPS GitHub/LinkedIn profile URLs, and optional city/country. You may remove Location from the array. Unset values show an honest unavailable state. Profiles have an external link inside their expanded view; email offers a mail link and copy action.

The initial profile copy and project descriptions/technologies are explicitly labeled examples, not claims about the owner. No personal contact information is prefilled.

Each entry has an `icon` key corresponding to the thin SVG icons in `src/components/Icon.tsx`. Projects may omit it to use the folder icon. Entry names are always displayed alongside the icons and also label the controls for screen readers. The foreground entry is brighter and uses a heavier label; distant segments compress their icon and label together as they turn away. No item numbering is displayed. Software Projects starts in front of WORK; the other wheels start with their second entry when available. Small screens initially show WORK and provide labeled section controls.

Geometry lives in `src/components/wheelGeometry.ts`; responsive rules live in `src/styles/wheels.css`. Each `WheelSegment` contains its separator and native button. The two angular boundaries determine four projected rail intersections, and one projective transform carries the entire segment, including the icon and label. Content is centered with padding in the unprojected cell; per-cell clipping is an additional containment safeguard. A ResizeObserver supplies viewport dimensions without layout reads during rotation. ABOUT, WORK, and CONTACT remain stationary topics within the upper cylinder face, outside the rotating segments. A reserved upper region keeps rotating entries clear of the topics. Only the rails morph during expansion, so separators cannot lag behind a drag. The retained detail content fades out during the reverse transition. Shared typography and detail views live in `src/styles/global.css`.

## Visual hierarchy experiment

`src/styles/typography-experiment.css` contains the isolated typography-first treatment. Its root tokens control text tones, inactive opacity, selected label emphasis, outline contrast and widths, interaction brightness, and the small selection ticks. Wheel geometry, input handling, data, and URLs are shared with the existing implementation.

To restore the previous appearance, remove only `import './styles/typography-experiment.css';` from `src/main.tsx` and rebuild. The base styles remain intact; no unrelated changes need to be reverted. The extra geometry variables and rotation attribute are passive styling hooks. Small selection ticks mark the stationary focal plane and disappear during expansion; reduced-motion preferences disable the experiment's transitions.

## Direct links

Hash URLs work on static hosts and under repository subpaths without rewrite rules:

- `/#/about/profile`
- `/#/work/software`
- `/#/work/software/chess-web-app`
- `/#/work/experiments/audio-ml-experiments`
- `/#/contact/email`

Every project provides a Copy project link action. Reloading, opening a link directly, and browser Back/Forward reconstruct the expanded view. Unknown or mismatched IDs show an unavailable-entry message with a return link. Links retain the site's existing hosting audience; a private deployment still requires access.

## Controls

- Scroll over one wheel or drag vertically: select and snap, bounded at both ends. Dragging follows the pointer directly, stops any settling animation when grabbed, and snaps on release. Reversing at an end responds immediately.
- Click or tap any labeled entry: select it and expand its wheel in one action.
- Tab: move between wheels. Arrow Up/Down, Page Up/Down, Home/End: select within the focused wheel. Enter/Space: open.
- Escape or Back to wheels: reverse the expansion and restore focus and wheel selections. The scrollable details area is keyboard focusable, and Tab reaches links and actions normally.
- Mobile: use the three section controls or swipe horizontally. Each gesture locks to its initial direction so diagonal movements cannot rotate a wheel and change sections together. Switching sections preserves each selection.
- System reduced-motion preferences disable entrance transitions and smooth interpolation.
- The visible interaction hint disappears after the first rotation, press, or activation in the current visit. Keyboard and screen-reader instructions remain available.

## Validate

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

The Playwright suite runs against a production build served locally. Install its Chromium once with `npx playwright install chromium`, or set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge. Screenshots and traces for failing cases go to ignored `test-results/`. Clipboard copy requires HTTPS or localhost and permission from the browser; a failed copy leaves the selectable address and email link available.
