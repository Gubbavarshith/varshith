# RESUME: QUARTER TURN redesign (updated 2026-09-24)

Tell Claude: **"continue the redesign, read RESUME.md"**.

## State
The redesign is built and runs: `npm run dev`. Types, lint, the guard test (`npm test`) and `npx next build` all pass.
- Plan: `info/spec.md`, with overrides and your decisions in `info/amendments.md` (the amendments win).
- Save point on GitHub: `97cd150` (github.com/Gubbavarshith/varshith). Work after it is not committed yet.

## The manifest (Sheet 02, after the quarter turn)
- 8 builds, in `app/_data/work.ts`: Toolspark, aiimageprompts, StartupMaps, UIZoo, AI Usage, GamesHub, SVG Vault, and SastrasAI last as "coming soon".
- A real-looking browser (`app/_home/Browser.tsx`) has every build open in a tab. It starts on a New Tab page (my start page, with every build as a shortcut). Each page is the build's real hero from `public/previews/<name>-preview.html` (images in `public/previews/img/`), cut to the first screen at runtime (`app/_home/Preview.tsx`). SastrasAI shows a browser error page, ERR_STILL_SHIPPING.
- With motion on, the sheet pins and scroll opens each build like a real browser (`app/_motion/deck.ts`, driven from `buildManifest` in `sheets-a.ts`): the address is selected and retyped, the tab highlight moves over, a loading line and spinner run, and the page slides in. It snaps per stop, and clicking a tab jumps there. Under SHIPPING, the current build's name is set to the same width ("SHIPPING / TOOLSPARK").
- With reduced motion, the tabs switch pages on click (`BrowserSwitch.tsx`) and all the builds are listed under the browser.
- **Add a build:** generate its preview with the same prompt (it saves `<name>-preview.html` into a `_varshith-preview` folder), copy it into `public/previews/`, and add an entry to `work.ts`.

## The hero portrait (built 2026-09-24)
- `app/_home/Portrait.tsx`, images in `public/hero/me-day.png` (sunglasses, light theme) and `me-night.png` (4–5 days without sleep, dark theme). The theme switch swaps them.
- Sits centred behind VARSHITH (head above the name), fades out on scroll (`buildV` in `sheets-a.ts`). The thought cloud cycles 3 jokes per theme (edit `THOUGHTS` in Portrait.tsx).
- Phones: smaller, between the labels and the lede, right of the column.

## Open
- Domains not confirmed yet: AI Usage and GamesHub have none, and UIZoo and SVG Vault have no link until you confirm they're live.
- Deploy.
