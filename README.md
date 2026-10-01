# Taqniat website

Redesign of taqniat.ae as a 3D-first, single-page site. Design direction and reasoning are in [docs/DESIGN.md](docs/DESIGN.md).

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # static build in dist/
npm run preview   # serve the build
```

The output in `dist/` is static and can be hosted anywhere.

## How it's put together

- `index.html` holds all the content. Everything reads and works without JavaScript or WebGL.
- `src/main.js` wires up the page and lazy-loads the 3D scenes after first paint.
- `src/three/hero.js` is the exploded architecture stack in the hero.
- `src/three/architecture.js` is the interactive system board. Its layout and connections come from `src/data/architecture.js`; the text for each node is in `index.html`.
- `src/motion.js` holds every scroll and intro animation. All of it is skipped under `prefers-reduced-motion`.
- `src/ui/interface.js` covers nav, tabs, industries, plate tilt, magnetic buttons and the contact form.
- `src/lib/device.js` picks a render tier (`high`, `low`, `none`) from screen size, CPU, memory and Save-Data. Add `?tier=low` or `?tier=none` to the URL to test the lower tiers.

## Fallbacks

`public/posters/` holds still frames of both 3D scenes. They show while Three.js loads, on devices without WebGL2, and when Save-Data is on. If you change a scene, regenerate them: run `npm run build && npm run preview`, open the page with `?poster` (it hides the UI and renders one still frame), and capture the hero at 1600x1000 and 390x750 (2x), and the architecture stage at 1440 and 390 wide (2x).

## Before launch

The live site couldn't be reached while this was built, so content comes from public company profiles. These need checking with Taqniat:

- **Case studies** in the Work section are representative placeholders written from Taqniat's public technology profile. Replace them with real, approved projects.
- **Industries** list is assumed. Confirm the sectors.
- **Contact email** `info@taqniat.ae` in `src/ui/interface.js` is a guess. The form opens the visitor's email app; swap in a real endpoint if there is one.
- **Logo and brand colours.** The mark in the nav and favicon is a placeholder stack glyph. Drop in the real logo, and adjust `--accent` in `src/styles/main.css` and `PALETTE` in `src/three/stage.js` if the brand has its own colour.
- **Certifications and partners** aren't shown because none could be verified. Add a section if they exist.
- **Arabic version.** Only the wordmark is in Arabic right now.
- **SEO.** If the old site has other URLs, set up redirects to the new anchors.
