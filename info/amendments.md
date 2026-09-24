# Orchestrator amendments to spec.md (these override the spec where they conflict)

Repo: C:/Users/User/OneDrive/Desktop/tool/varshith

## Installed already (do NOT run npm install)
gsap 3.15, lenis 1.3.26, three 0.186 + @types/three, opentype.js, manifold-3d (verified: `const w = await Module(); w.setup(); const {CrossSection, Manifold} = w;` works in Node 22).
Fonts verified in next/font/google: Newsreader (opsz 6-72, wght 200-800, latin-ext), Noto_Sans_Telugu (subset "telugu"), Martian_Mono (wdth 75-112.5).
Imports: `gsap`, `gsap/ScrollTrigger`, `gsap/SplitText`, `gsap/ScrambleTextPlugin`, `gsap/DrawSVGPlugin`, `gsap/CustomEase`, `import Lenis from "lenis"`, `three/webgpu`, `three/tsl`.
Next 16.3.6 has breaking changes vs your training data: read `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` (and any other relevant doc) before touching layout/fonts/dynamic imports. `LayoutProps<"/">` is a global type already used in layout.tsx.

## Owner decisions from Varshith (final, override spec)
- NOTHING about ads anywhere on the public site. Remove WaitAds entirely: no manifest row (renumber rows 01-11), no WaitAds card in #ai (keep 2 cards: SastrasAI, Hermes), no "No ads on this page. Row 07..." footnote, no "wait state"/"ads" wit, no ads mention in copy, metadata, colophon or shell output.
- Telugu spelling వర్షిత్ and the varṣa (rain) etymology are confirmed.
- StartupMaps domain confirmed: startupmaps.in, link https://startupmaps.in in the manifest.
- Side word stays SHIPPING.

## Cuts (do not build)
- The `?tune=1` range-input panel. Keep `TUNE` as a plain exported const object in sheets-a.ts.
- The Sheet 06 font-editor readout chip and crosshair cursor. Nodes still render (Glyphs `nodes`), no readout.

## Freedoms
- engine.ts: if per-object uniforms via `onObjectUpdate` are awkward, use one material per slot (8 solid + 8 edge + 8 shadow materials sharing node graphs). Must work on BOTH WebGPU and WebGL2 backends of WebGPURenderer.
- Anything in the spec that is impossible as written: do the closest thing that preserves the visual intent and write what you changed in your final report.

## Cross-file contract additions
- `app/_motion/sheets-b.ts` exports `buildAI, buildSH, buildT, buildGlyphs, buildI`, each `(ctx: BuildCtx) => void`, `BuildCtx` imported from `./sheets-a`.
- `app/_motion/sheets-a.ts` exports `BuildCtx`, `TUNE`, `buildIntro, buildV, buildTurn, buildManifest, buildVar, buildPeeks`.
- Shell navigates to sheets by dispatching `window.dispatchEvent(new CustomEvent("tqt:goto", { detail: id }))`; runtime.ts listens and calls `scrollToSheet`.
- globals.css must include Lenis base CSS (`html.lenis, html.lenis body{height:auto}` `.lenis:not(.lenis-autoToggle).lenis-stopped{overflow:clip}` `.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}` `.lenis.lenis-smooth iframe{pointer-events:none}`) and must NOT set `scroll-behavior:smooth` on html when `.lenis` is active.

## Parallel-work rules (several agents write to this repo at once)
- Only create/edit the files your owner letter owns in spec §9. Never touch another owner's file. If you need an interface change, code against the spec interface and describe the needed change in your final report.
- Do NOT run `next build`, `next dev`, `npm install`, or anything that writes `.next/`. Do not git commit.
- Typecheck with `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "<your file paths>"` so other agents' in-progress files don't block you. Lint with `npx eslint <your files>`.
- Copy: no em dashes in visible copy. No private info (pricing, KYC, MSME, tax, equity, coupons, cold-call stats).
