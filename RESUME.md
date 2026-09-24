# RESUME: QUARTER TURN redesign (paused 2026-09-23, power cut)

Tell Claude: **"continue the redesign, read RESUME.md"**.

## What this is
A full redesign of this site. Your name is 8 3D letter blocks cut from your own font (Toolsplex Display Black). From the front they read VARSHITH. Scrolling turns them 90°, and from the side they read SHIPPING.
- Stack: three.js WebGPU + TSL, GSAP (ScrollTrigger, SplitText), Lenis.
- Full plan: `info/spec.md`. Overrides and your decisions: `info/amendments.md` (the amendments win).

## Your decisions (final)
- No ads anywhere on the site. WaitAds is removed completely.
- Telugu వర్షిత్ and the *varṣa* (rain) meaning are confirmed.
- StartupMaps domain: startupmaps.in.
- Side word: SHIPPING.

## Progress (spec §9 file owners)
| Owner | Files | Status |
|---|---|---|
| A: type pipeline | `scripts/type/*`, `app/_data/word.ts`, `app/_data/glyphs.json`, `public/type/solids.bin`, `app/_fonts/*.woff2`, package.json scripts | DONE (`npm run type:build`, `npm test`) |
| C: page + CSS | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/home.css`, `app/_ui/Glyphs.tsx`, `app/_ui/Clock.tsx`, `app/_data/work.ts`, `app/_data/site.ts`, guides page + guide.css, `Inspect.tsx` deleted | DONE |
| E: later sheets | `app/_motion/sheets-b.ts`, `app/_home/Shell.tsx`, `app/_home/Weight.tsx` | DONE |
| B: GPU stage | `app/_stage/Stage.tsx`, `app/_stage/engine.ts`, `app/_stage/CSSWord.tsx` | INTERRUPTED: check it, finish it |
| D: motion runtime | `app/_motion/store.ts`, `layouts.ts`, `runtime.ts`, `Motion.tsx`, `sheets-a.ts`, `app/_ui/MiniIndex.tsx` | INTERRUPTED: check it, finish it |
| Integrator | all files | NOT STARTED |

## Steps to finish
1. Read `info/spec.md` and `info/amendments.md`.
2. Finish owners B and D against spec §6.2/§6.3 (B) and §7/§8 (D). Code against the interfaces the finished A/C/E files already use.
3. Integrate, then run each check until it passes:
   - `npm run type:build`, `npm test`
   - `npx tsc --noEmit`, `npx eslint app scripts`
   - `npx next build`
4. `npx next start -p 3210`, then take Playwright screenshots of every sheet in light, dark, mobile (390px) and reduced motion. Also check that `/guides/jev-claude` loads no three.js.
5. Check that no scroll position ever shows S-H-I-T on its own (slots 3-6). The guard test covers the states; also scrub the pins.

## Notes
- Next 16.3.6 has breaking changes. Read `node_modules/next/dist/docs/` before touching fonts, layout or dynamic imports.
- Deps are already installed: gsap, lenis, three, @types/three, opentype.js, manifold-3d.
- Font source: `../custom-font-v1.0/ToolsplexDisplay-Black.ttf`.
- Delete this file when the redesign ships.
