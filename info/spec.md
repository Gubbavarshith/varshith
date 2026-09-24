# QUARTER TURN: build spec for the Gubba Varshith site

Repo: `C:/Users/User/OneDrive/Desktop/tool/varshith` (Next.js 16.3.6 App Router, React 19.2, plain CSS). Installed: gsap 3.15 (all plugins), lenis 1.3.26, three 0.186 (`three/webgpu`, `three/tsl`). Node 22.23 is present. It strips TypeScript types without a flag, so the `.mjs` scripts can import erasable-only `.ts` files directly.

---

## 0. What changed from the judged concept

I checked every fix below against his real TTF, `C:/Users/User/OneDrive/Desktop/tool/custom-font-v1.0/ToolsplexDisplay-Black.ttf`, with a throwaway parser.

1. **The S-H-I-T problem is now a data rule with a test.** Slots 3–6 of VARSHITH spell S-H-I-T. §5 defines a formal `isolatesRun()` guard, a state table and the transition orders. `node --test` fails the build if any state, transition step, hover peek or mini-index state isolates that run. The first version of the concept would have failed in three places:
   - The left-to-right Quarter Turn stagger showed a frame where V, A and R are 3D blocks while "SHITH" sits flat and readable.
   - The backspace-style exit showed "VARSHIT".
   - A peek on R or on the last H isolated the run.

   The fixes:
   - The turn is a **wave that starts at the I** (slot 5).
   - Letters exit by **forward-delete** (S first) and never by backspace.
   - Peeks are allowed only on slots 0, 1, 3, 4, 5 and 6.
2. **The sand numeral morphs are cut** (53, 131, 390+, the PIPE flow, the GUIDE number). All three judges called them the generic particle trope. Particles remain only as the **rain in** at load and the **drain out** at the end, which are the bookends of the varṣa idea. The numbers are set as DOM type in his own font.
3. **The SDF weight instrument is cut.** A CSS stroke drawn over the letters replaces it: it erodes the letters or thickens them and rounds the corners. It is the same on every tier and costs no GPU work.
4. **Sheet 06 outlines and the A…I pipeline are server-rendered SVG** built from the font's own contours, not a GPU line layer. This gives crisp 1px hairlines, DrawSVG for the draw-on, and no extra shader.
5. **The GPU stage runs only on `/`**, in `app/page.tsx`. `/guides` and `/guides/[slug]` load zero three.js.
6. **DOM decides layout, and the GPU follows it.** Every position the word takes comes from a server-rendered SVG "still" of the same glyphs. In reduced-motion and no-JS modes that still is the visual. In motion mode it is a hidden anchor the word snaps to. The same markup serves every tier.
7. **The intro is LCP-safe.** The lede is never hidden. Decorative intro motion is CSS-only and starts at first paint. JavaScript only runs the rain.
8. **Grafts from the other concepts, kept to one device.**
   - A flat floor **cast shadow** under the solids. It only appears while the word is pitched. Its light side swaps with the theme (idea from [1] via judge 3). It makes the mid-turn screenshot read as solid objects.
   - A tiny deterministic **shell** in the SH chapter: `ls`, `open 001`, `cd t` (idea from [0] via judges 2 and 3).
   - One line of WaitAds wit in the manifest (from [3]).
9. **Grafts I rejected.**
   - The Rip from [1]: it would be a second dominant device.
   - The progress log and hero prompt from [0]: kitchen sink.
   - Caveman mode from [3]: kitchen sink.
   - Sand emblems per manifest row: the particle trope again.
   - A new theme wipe: the brief says to keep the circle reveal.

---

## 1. Concept

**Name:** QUARTER TURN: a type specimen of Gubba Varshith.

**One-liner:** His name is set in the typeface he built, as eight solid letters. From the front they read VARSHITH. Turned a quarter, they read SHIPPING. The site is a specimen booklet, and its chapters are the words hidden inside his name.

**Signature moment, Sheet 02 "The Quarter Turn":**
- Eight exact intersection solids stand in a row on specimen paper. Each is the front glyph extruded along Z, intersected with the side glyph extruded along X, both cut from `ToolsplexDisplay-Black.ttf`.
- As you scroll, a turning wave starts at the I and runs outward. Each solid spins 90° about its own vertical axis.
- The row breathes apart from 650 to 830 units so no two blocks collide. The view pitches down 16°, which shows stone top faces, cobalt side faces, 1px hairline edges and flat floor shadows. This is the screenshot frame.
- The row then levels, closes back up, and every face snaps to one flat cobalt. It reads **SHIPPING**.
- The sixth solid was an I the whole time. A hairline leader draws to it: "The I is an I from both sides."
- This is geometrically exact. Every capital in his font fills every scanline from 0 to 700.

**Bookends:** On load, type "rains" into an empty type case, from *varṣa*, rain. At the end, the letters drain off the page as rain. Only the I is left, and it becomes a blinking text caret.

---

## 2. Verified font facts (single source: the TTF)

| Fact | Value |
|---|---|
| Glyphs / characters | 72 / 71 (`.notdef` + 71) |
| Charset | ` !+,-./0123456789:?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz` |
| UPM, cap height, hhea ascent/descent | 1000, 700, 820 / −180 |
| Advance of every capital and digit | 650 |
| Capital ink box | x 45..605, y 0..700 (560 × 700) |
| Off-curve points (whole font) | 0 |
| On-curve nodes in VARSHITH | 96 (V7 A14 R14 S14 H12 I14 T9 H12) |
| Stems and bars | 170 units. Bars at y 0–170, 265–435, 530–700. Chamfers are 90 units at 45° |
| WOFF2 size | 1,764 bytes |
| Full scanline coverage (0..700) | V A R S H I T P N G B U L D all pass. Both words work as side words |
| Slot 5 | `VARSHITH[5] = SHIPPING[5] = BUILDING[5] = "I"` |
| The I glyph | 180° rotationally symmetric (chamfers at top-right and bottom-left). It is **not** mirror-symmetric, so a mirrored side face is detectable |

`scripts/type/build.mjs` re-asserts all of this and writes `facts` into `app/_data/glyphs.json`. The page reads its numbers from there.

---

## 3. Design tokens

### 3.1 `app/globals.css` `:root` (replaces the current tokens)

```css
:root {
  color-scheme: light dark;

  /* paper and ink. Light: specimen paper. Dark: night monsoon, bone type on warm black */
  --paper:     light-dark(#F1EEE6, #0F0F0D);
  --paper-hi:  light-dark(#F8F6F0, #161614);   /* guide sheets, cards */
  --paper-2:   light-dark(#E7E3D8, #1C1C19);   /* inset panels, code */
  --ink:       light-dark(#121212, #ECE9E0);   /* 16.9:1 / 16.4:1 */
  --ink-2:     light-dark(#55534C, #A3A097);   /* secondary text, 6.6:1 / 7.3:1 */
  --ink-3:     light-dark(#8C897F, #6C6A63);   /* NON-TEXT only: crop marks, metric lines */
  --rule:      light-dark(#D2CEC2, #2A2925);   /* 1px hairlines */
  --signal:    light-dark(#2340FF, #7D8BFF);   /* cobalt, 5.6:1 / 6.4:1, text-safe */
  --on-signal: light-dark(#F8F6F0, #0F0F0D);
  --signal-wash: light-dark(#DDE1FF, #1B2150);
  --stone:     light-dark(#BDB8AA, #3B3A35);   /* top/bottom faces */
  --cast:      light-dark(#D9D4C7, #1F1E1B);   /* floor shadow */
  --edge:      light-dark(rgb(18 18 18 / .55), rgb(236 233 224 / .45));

  /* legacy aliases: app/guides/guide.css and GuideList consume these names */
  --canvas: var(--paper);
  --sheet: var(--paper-hi);
  --sunk: var(--paper-2);
  --graphite: var(--ink-2);
  --hair: var(--rule);
  --select: var(--signal);
  --select-ink: var(--signal);
  --select-solid: var(--signal);
  --on-select-solid: var(--on-signal);
  --select-wash: var(--signal-wash);

  /* fonts (variables come from next/font in layout.tsx) */
  --f-display: var(--font-toolsplex), Impact, "Arial Black", sans-serif;
  --f-text: var(--font-news), Georgia, serif;
  --f-mono: var(--font-martian), ui-monospace, monospace;
  --f-telugu: var(--font-telugu), sans-serif;
  --f-sans: var(--f-text);      /* legacy */
  --f-dot: var(--f-display);    /* legacy: guide covers and part numbers now set in Toolsplex */

  /* type scale */
  --fs-run: 11px;  --fs-label: 12px;  --fs-mono: 14px;
  --fs-body: 18px; --fs-lede: 24px;   --fs-pull: 32px;
  --fs-h2: clamp(40px, 6vw, 92px);
  --fs-num: clamp(120px, 22vw, 360px);          /* Toolsplex numerals: 53, 131, 390+, 001 */
  --fs-display: min(calc(88vw / 5.2), 51svh);   /* hero word: 5.2em = 8 advances of 650 */

  /* space and grid */
  --margin: 4vw;
  --gutter: clamp(16px, 1.7vw, 24px);
  --header: 56px;
  --gut: clamp(12px, 2.2vw, 32px);  --pad: clamp(20px, 4vw, 64px);
  --gap: clamp(28px, 4vw, 56px);    --max: 1600px;

  /* easing */
  --ease: cubic-bezier(.2, .7, .2, 1);        /* legacy + UI */
  --ease-snap: cubic-bezier(.7, 0, .2, 1);    /* theme circle reveal (560ms), turns */
  --ease-out: cubic-bezier(.16, 1, .3, 1);    /* expo-like reveals */
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
@media (max-width: 640px) { :root { --fs-body: 17px; --fs-lede: 19px; --fs-pull: 24px; } }
```

Colour rules:
- There are no gradients anywhere. The only shading is the three flat face tones and the flat cast colour.
- `--signal` is the only accent. Show one accent per viewport.
- Guide accents from `guides.ts` (`#ff5a1f`, ink `#c2410c` / `#ff7a45`) appear only in Sheet 05 and on guide pages. `#c2410c` is 4.46:1 on `--paper`, so on paper use it only at ≥ 24px. It passes on `--paper-hi`.
- Product brand colours appear only as 12px swatches in the manifest: Toolspark `#3B58E2` `#FFE066`, Waitflow `#ff3383`.
- `::selection` uses `--signal` / `--on-signal`. Focus rings are `2px solid var(--signal)` with a 3px offset.

### 3.2 Fonts (in `app/layout.tsx`)

```ts
import localFont from "next/font/local";
import { Martian_Mono, Newsreader, Noto_Sans_Telugu } from "next/font/google";

const display = localFont({
  src: "./_fonts/ToolsplexDisplay-Black.woff2", weight: "900", style: "normal",
  variable: "--font-toolsplex", display: "block", preload: true,   // 1,764 bytes; block avoids a width-shifting fallback
  fallback: ["Impact", "Arial Black", "sans-serif"], adjustFontFallback: false,
});
const text = Newsreader({ subsets: ["latin", "latin-ext"], axes: ["opsz"], style: ["normal", "italic"], variable: "--font-news" }); // latin-ext carries the ṣ in varṣa
const mono = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian" });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: "500", variable: "--font-telugu", preload: false });
```

Mona Sans and Doto are retired.

| Role | Face | Setting |
|---|---|---|
| The name, numerals, guide numbers and covers, mini index, V mark, glyph grid, `.sec-title` | Toolsplex Display Black | 900, tracking 0. Only the 71 characters. Never below 12px |
| H2 | Newsreader | wght 320, `font-optical-sizing: auto`, `--fs-h2`, line-height .98, tracking −.02em |
| Lede | Newsreader | 400, 24/1.35 |
| Body | Newsreader | 400, 18/1.55, measure 62ch |
| Etymology, captions, pull lines | Newsreader italic | 20px |
| Running heads, labels | Martian Mono | 11–12px, uppercase, `font-stretch: 75%`, tracking .06em |
| Code, manifest, shell, readouts, buttons | Martian Mono | 13–14px, `font-stretch: 87.5–100%`, wght 400–500 |
| వర్షిత్ only | Noto Sans Telugu | 500 |

### 3.3 Grid

- 12 columns: `grid-template-columns: repeat(12, minmax(0,1fr)); column-gap: var(--gutter); padding-inline: var(--margin)`.
- Header is 56px and sticky, with a `--paper` background.
- Mobile (≤ 640px) in motion mode: the word is a fixed vertical column at the left, so home `main` gets `padding-left: 24vw`.

### 3.4 GSAP eases (named in `runtime.ts`)

| Name | Ease | Use |
|---|---|---|
| `turn` | `power2.inOut` | Letter turns, spacing breathe, pitch |
| `reveal` | `expo.out` | SplitText reveals |
| `snap` | `power3.out` | Registration snap, peeks-in |
| `peek` | `back.out(1.6)` | Peek spring-back |
| Layout moves | `power1.inOut` | — |
| Rain gravity | t² | Applied in the shader |

---

## 4. Page structure and copy

All copy is server-rendered in `app/page.tsx`. Copy contains no em dashes, and every number is real. `data-m="…"` attributes are the motion hooks: the DOM builder must emit exactly these, and the motion builders select only by them.

Glyph stills use `<Glyphs>` (§9, `app/_ui/Glyphs.tsx`). A still is the visual in reduced-motion and no-JS modes. In motion mode it is a measured anchor with `visibility:hidden` (`display:none` on mobile).

### 4.1 Header (`app/layout.tsx`, all pages)

```
<a class="skip" href="#main">Skip to content</a>
<header class="top" data-m="header">
  <a class="vmark" href="/#v" aria-label="Gubba Varshith, home"><span aria-hidden>V</span></a>   Toolsplex 18px; rotates 180° (reads Λ) while scrolling up
  <MiniIndex/>        nav "Chapters": V A R S H I T H in Toolsplex 12px, each a link
  <nav class="nav"><Link href="/guides">Guides</Link></nav>
  <ThemeToggle/>      unchanged component (circle view-transition kept)
  <p class="folio" data-m="folio" aria-hidden>Sheet 01/07</p>   home only, hidden < 900px
</header>
```

Mini-index link targets and aria-labels, by slot:

| Slot | Target | aria-label |
|---|---|---|
| 0 V | `#v` | "V: rain" |
| 1 A | `#ai` | "A: AI in the middle" |
| 2 R | `#var` | "VAR: declared" |
| 3 S | `#sh` | "S: shell" |
| 4 H | `#sh` | "H: shell" |
| 5 I | `#i` | "I: cursor" |
| 6 T | `#t` | "T: type" |
| 7 H | `#i` | "H: home" |

Off the homepage, these are `/#…` links.

### 4.2 `#v`: Sheet 01 · V: Rain (hero, 100svh, not pinned)

```
<section id="v" aria-labelledby="name">
  <p class="spec-label" data-m="spec" aria-hidden>FAMILY Gubba · STYLE Varshith · WEIGHT Black</p>
  <p class="etym" data-m="etym">var·shith (<span lang="te" class="te">వర్షిత్</span>). From Sanskrit <i>varṣa</i>: rain.</p>
  <h1 id="name" class="name" aria-label="Gubba Varshith">
    <span class="sr-only">Gubba </span>
    <span class="word" data-m="word"><span class="slot" data-slot="0">V</span><span class="slot" data-slot="1">a</span>…<span class="slot" data-slot="7">h</span></span>
  </h1>
  <svg class="case" data-m="case" viewBox="0 0 5200 700" preserveAspectRatio="none" aria-hidden>  crop marks: 4 corners × 8 cells,
       60-unit ticks at each cell's ink box (x 45/605 + 650·i, y 0/700), each <path pathLength="1">, vector-effect non-scaling-stroke </svg>
  <i class="case-line base" data-m="base" aria-hidden></i><i class="case-line cap" data-m="cap" aria-hidden></i>
  <p class="v-note" data-m="vnote" aria-hidden>V points down.</p>
  <p class="lede">I design and build small internet products with AI coding agents, from Mahbubnagar, Telangana. When a setup works, I write it up as a guide.</p>
  <div class="ctas"><a class="btn btn-solid" href="#sh" data-m="cta-guides">Read the guides</a>
                    <a class="btn" href="#turn" data-m="cta-turn">Turn the name</a></div>
  <p class="folio-b" aria-hidden>Toolsplex Display Black · 1,764 bytes · 0 curves</p>
  <p class="place">Mahbubnagar · <Clock/> IST</p>
</section>
```

**The word.** `.word` is `font: 900 var(--fs-display)/1 var(--f-display); text-transform: uppercase; white-space: nowrap`. Its text content is "Varshith". `.slot` is `display:inline-block; width:.65em; height:1em; line-height:1`, which puts each slot's baseline at `top + 0.82em`. The word is centred horizontally: `left: calc((100% - 5.2 * var(--fs-display)) / 2)`. The baseline sits at 64svh.

**Placement (desktop).**
- `spec-label`: above the V, left-aligned to it.
- `etym`: columns 8–12, above the word.
- `lede`: columns 1–5, 32px below the baseline.
- `ctas`: columns 9–12, same row as the lede.
- `v-note`: under the V.
- `folio-b`: bottom-left. `place`: bottom-right.
- The upper third of the page stays empty.

**Mobile (≤ 640px).** `.word` becomes a column: `display:flex; flex-direction:column; left:4vw; top:12svh; font-size:min(24.6vw, calc((88svh - 64px) / 6.6))`, with `.slot + .slot { margin-top: -.2em }` (0.8em pitch). Copy sits in the right 72vw. Crop marks and case lines are hidden.

### 4.3 `#turn`: Sheet 02 · VARSHITH ⟂ SHIPPING (pinned)

```
<section id="turn" aria-labelledby="turn-h">
  <p class="kicker" data-m="kicker">Sheet 02 · VARSHITH ⟂ SHIPPING</p>
  <h2 id="turn-h" class="h2" data-m="h2"><span data-m="h2a">Turn my name ninety degrees.</span> <span data-m="h2b">It says what I do.</span></h2>
  <div class="turn-anchor" data-m="anchor"><Glyphs text={FRONT} slots={[0,1,2,3,4,5,6,7]} className="anchor"/></div>   always hidden; width 72%, centred, cap centre at 46svh
  <div class="still"><CSSWord mode="still" rot={38} pitch={12}/>
       <p class="still-lines"><span class="ink">VARSHITH</span> <span class="sig">{SIDE}</span></p>
       <p class="cap-note">Same eight solids, front and side.</p></div>
  <p class="i-callout" data-m="icallout"><i class="leader" data-m="leader"></i>The I is an I from both sides.</p>   left: 68.75% of the anchor box (slot 5 centre = 3575/5200)
  <p class="caption" data-m="caption">Eight solids. Each one is a letter of my name intersected with a letter of {SIDE}, both cut from my own typeface.</p>
</section>
```

In motion mode, `h2b` is clipped (masked) until the swap. In reduced mode, both H2 lines show.

### 4.4 `#manifest`: The manifest (normal flow, part of Sheet 02)

The layout has two columns:
- **Left** (columns 1–4): `<div class="ship-anchor still" data-m="ship" style="position:sticky; top:calc(50svh - …)"><Glyphs text={SIDE} slots={[0..7]} tone="signal"/></div>`, 34vw wide.
- **Right** (columns 6–12): `<h2 class="h2-sm">The manifest.</h2>` followed by `<table class="mf">`.

The table has a `<thead>` with No. · Name · What it is · Where. Rows come from `app/_data/work.ts`, one `<tr class="mf-row" data-m="row">` per item. Each row carries a swatch `<span class="sw" style="--c:#…">` that slides out on hover (CSS, 150ms). The footnote below the table is mono 12px: "No ads on this page. Row 07 is the closest it gets."

`work.ts` content. `status` stays `null` until Varshith confirms each item; only non-null statuses render, as "live" or "building". Only the `href`s listed here get links.

| no | name | what | where |
|---|---|---|---|
| 01 | Toolspark | 53 free browser tools in 8 categories. Everything runs in your tab: no signup, no uploads, nothing leaves the page. | toolspark.xyz → https://toolspark.xyz · swatches #3B58E2 #FFE066 |
| 02 | aiimageprompts | Better Prompts, Better Art. A curated AI image prompt library with its own static-site generator. | aiimageprompts.xyz → https://www.aiimageprompts.xyz |
| 03 | Everytool | Free client-side calculators, converters and generators. Beta on 1 Aug 2025, live since 23 Aug 2025. | everytool.tech → https://everytool.tech |
| 04 | Waitflow | A no-code waitlist page builder for founders and agencies. | waitflow.xyz (text only) · swatch #ff3383 |
| 05 | StartupMaps | 390+ Hyderabad startups collected for a street-level map. A Micro SaaS hackathon is planned alongside it. | (no domain until confirmed) |
| 06 | SastrasAI | Multi-agent blogging with RAG, for solo bloggers who don't know what to write next. My 100xEngineers Cohort 7 capstone. | in progress |
| 07 | WaitAds | An India-only ad marketplace for the seconds Claude Code spends thinking. | waitads.in (text only) |
| 08 | UIZoo | UI showcases, living under Toolspark. | toolspark.xyz |
| 09 | DevDrop.ai | Open-source dev tools, explained one carousel at a time. | @devdrop.ai → https://www.instagram.com/devdrop.ai/ |
| 10 | Deallzap | Phone reviews and weekly tech news. | deallzap.com → https://deallzap.com |
| 11 | Hermes | A desktop agent on my PC that reads my Obsidian second brain. It uses local models where it can. | localhost |
| 12 | Toolsplex Display | The typeface on this page. 71 characters, 1,764 bytes, built with fontTools. | this page |

### 4.5 `#var`: Sheet 03 · VAR: Declared (pinned)

```
<section id="var" aria-labelledby="var-h">
  <p class="kicker" data-m="kicker">Sheet 03 · VAR</p>
  <div class="var-anchor still" data-m="anchor"><Glyphs text="VAR" slots={[0,1,2]} tone="signal"/></div>   columns 1–5, cap centre 40svh, em = 72vw/5.2
  <h2 id="var-h" class="h2" data-m="h2">The first three letters are a keyword.</h2>
  <p class="sub" data-m="sub">var. I write a lot of code, and these days an AI agent does most of the typing while I decide what gets declared.</p>
  <pre class="code" data-m="code"><code><span class="kw">var</span> tools    = 53;   // toolspark.xyz
<span class="kw">var</span> pages    = 131;  // aiimageprompts.xyz
<span class="kw">var</span> startups = 390;  // 390+, Hyderabad</code></pre>        each line wrapped in <span data-m="line">
  <dl class="nums" data-m="nums">                                           columns 7–12; stacked in one grid cell only under html.motion
    <div data-m="num"><dt class="num">53</dt><dd>Toolspark. 53 free browser tools in 8 categories. No signup, no uploads, nothing leaves the tab.</dd></div>
    <div data-m="num"><dt class="num">131</dt><dd>aiimageprompts.xyz. Google kept crawling a blank React shell, so I wrote a static-site generator for it: 131 prompt pages, 20 posts, clean sitemaps.</dd></div>
    <div data-m="num"><dt class="num">390+</dt><dd>StartupMaps. 390+ Hyderabad startups collected for a street-level map, and a hackathon planned to go with it.</dd></div>
  </dl>
</section>
```

`.kw` is `--signal`. `.num` is Toolsplex at `--fs-num`.

### 4.6 `#ai`: Sheet 04 · A…I: The middle (pinned)

```
<section id="ai" aria-labelledby="ai-h">
  <p class="kicker" data-m="kicker">Sheet 04 · A…I</p>
  <h2 id="ai-h" class="h2" data-m="h2">There's AI in the middle of my name.</h2>
  <p class="sub" data-m="sub">A, then R, S, H, then I. It sits in the middle of most of my work too.</p>
  <div class="ai-row">                                                     one row: A in column 2, pipe in columns 3–10, I in column 11
    <div class="still" data-m="anchor-a"><Glyphs text="A" slots={[1]} tone="signal"/></div>
    <figure class="pipe" data-m="pipe">
      <svg> hairline A→I at mid-cap (pathLength=1) + <Glyphs text="MKRDP" mode="outline" inline/> stations at 0.22 cap + <rect class="token" data-m="token"/></svg>
      <figcaption>MABS, the multi-agent blogging system inside SastrasAI</figcaption>
      <ol class="stations" data-m="stations"><li>Manager</li><li>Keyword analyzer</li><li>Research</li><li>Drafting</li><li>Publishing</li></ol>
    </figure>
    <div class="still" data-m="anchor-i"><Glyphs text="I" slots={[5]} tone="signal"/>
      <svg class="ring" data-m="ring" aria-hidden><circle pathLength="1"/></svg><span class="ring-l" data-m="ringlabel">localhost</span></div>
  </div>
  <div class="cards" data-m="cards">                                        stacked in one cell only under html.motion
    <article data-m="card"><h3>SastrasAI</h3><p>Five agents and RAG over your own sitemap, so a solo blogger knows what to write next. It started with my own college blog and the hours I lost picking topics. My capstone for 100xEngineers, Cohort 7.</p></article>
    <article data-m="card"><h3>Hermes</h3><p>A desktop agent on my PC that reads my Obsidian second brain. It uses local models where it can, through Ollama and LM Studio: <span data-m="models">Gemma, GPT-OSS, Qwen</span>.</p></article>
    <article data-m="card"><h3>WaitAds</h3><p>Ads for the seconds Claude Code spends thinking.</p></article>
  </div>
</section>
```

### 4.7 `#sh`: Sheet 05 · SH: Shell (pinned, the guides on the homepage)

```
<section id="sh" aria-labelledby="sh-h">
  <p class="kicker" data-m="kicker">Sheet 05 · SH</p>
  <div class="still sh-anchor" data-m="anchor"><Glyphs text="SH" slots={[3,4]}/><span class="caret" data-m="caret" aria-hidden></span></div>  columns 1–4, cap = 22svh
  <h2 id="sh-h" class="h2" data-m="h2">sh. Most of what I make starts in a terminal.</h2>
  <p class="sub" data-m="sub">Claude Code, Cursor and a few small models. When a setup works, I write it up with every prompt you need to copy.</p>
  <p class="sh-no" data-m="bignum" aria-hidden style={accentVars(latest)}>001</p>     Toolsplex --fs-num in var(--g-ink); columns 7–12
  <Shell guides={guides}/>                                                   SSR renders the default listing below
  <a class="more" href="/guides">All guides →</a>
</section>
```

Default Shell output, server-rendered and generated from `guides.ts`:

```
$ ls guides/
001  jev-claude/  Jev + Claude: the setup guide                         (whole row is <a href="/guides/jev-claude">)
     6 parts · 10 min · Claude Code, Jev, OpenRouter · Adapted from RoboNuggets
002  ▌ being written                                                    (dashed rule, number = guides.length + 1)
```

### 4.8 `#t`: Sheet 06 · T: Type (pinned) + `#glyphs` (flow)

```
<section id="t" aria-labelledby="t-h">
  <p class="kicker" data-m="kicker">Sheet 06 · T</p>
  <h2 id="t-h" class="h2" data-m="h2">T is for type. I made this one.</h2>
  <p class="sub" data-m="sub">Toolsplex Display Black, built in Python with fontTools. Stems and bars are 170 units, corners are cut at 45°, and there isn't a single curve in it.</p>
  <div class="t-stage" data-m="anchor">        position:absolute; left:14%; width:72%; top:26svh; --em: calc(72vw / 5.2)
    <Glyphs text={FRONT} slots={[0..7]} mode="outline" nodes metrics/>      visible in all modes; this is also the anchor
    <ol class="metric-labels" aria-hidden>{[0,170,265,435,530,700].map(m => <li style="--m:m">m</li>)}</ol>
                                               top: calc(.7 * var(--em) - var(--m) / 1000 * var(--em)); lines span 100vw via SVG overflow
    <p class="call call-v" data-m="callv">V points down. That's why it goes first.</p>
    <p class="call call-i" data-m="calli">The I is an I-beam. Turn it upside down and it's still an I.</p>
  </div>
  <dl class="facts" data-m="facts">UPM 1000 · Cap 700 · Cell 650 · 71 characters · 0 off-curve points · 1,764 bytes</dl>  (values from glyphs.json facts)
  <p class="count" data-m="count">VARSHITH = <span data-m="countn">96</span> points</p>
  <Weight/>       label "It only comes in Black. Drag to fake the rest." · specimen "Varshith ships." ·
                  footnote "A stroke drawn over the letters, not a real weight axis."
</section>
<section id="glyphs" aria-labelledby="glyphs-h"><h3 id="glyphs-h">All 71 characters</h3>  (grid rendered by <Weight/>'s GlyphGrid export)</section>
```

### 4.9 `#i`: Sheet 07 · I and H: Cursor, home (pinned)

```
<section id="i" aria-labelledby="i-h">
  <p class="kicker" data-m="kicker">Sheet 07 · I, H</p>
  <h2 id="i-h" class="typed" data-m="typed">I build small things for the internet and write down how.<span class="still inline-i"><Glyphs text="I" slots={[5]}/></span></h2>
       Newsreader 8vw (mobile 11vw), wght 320. The inline I is the reduced/no-JS caret; in motion the GPU I is the caret
  <p class="sub" data-m="sub">Gubba Varshith. Web developer and UI/UX designer, B.Tech CSE (Data Science). Mahbubnagar and Hyderabad, Telangana.</p>
  <ul class="links" data-m="links">{site.links}</ul>
  <p class="colophon" data-m="colophon">Set in Toolsplex Display Black (mine), Newsreader and Martian Mono. Built with Next.js 16, GSAP, Lenis and three.js on WebGPU, alongside Claude Code.</p>
  <p class="home-line" data-m="home">H is for home. It's <Clock/> in Mahbubnagar. <span class="still park" data-m="park"><Glyphs text="H" slots={[7]}/></span></p>   park H: 40px cap
</section>
```

### 4.10 Layout footer (all pages, restyled only)

`© {year} Gubba Varshith` · `site.links` · `Back to top ↑`.

`site.ts`:
- Description: "Gubba Varshith designs and builds small internet products with AI coding agents, from Mahbubnagar, Telangana. Step-by-step guides with prompts you can copy."
- links: `[{label:"Instagram @gubbavarshith", href:"https://www.instagram.com/gubbavarshith/"}, {label:"@devdrop.ai", href:"https://www.instagram.com/devdrop.ai/"}]`. **No email** until he supplies one.

Metadata:
- title.default: "Gubba Varshith · web developer and UI/UX designer"
- themeColor: `#F1EEE6` / `#0F0F0D`

---

## 5. The word model and the S-H-I-T guard (`app/_data/word.ts`)

This file has no imports and uses only erasable TypeScript syntax: no enums, no parameter properties. Next, `build.mjs` and the node test all import it.

```ts
export const FRONT = "VARSHITH";
export const SIDE = "SHIPPING";            // one-line swap to "BUILDING" (also keeps I at slot 5), then `npm run type:build`
export type SheetId = "v" | "turn" | "var" | "ai" | "sh" | "t" | "i";
export const SHEETS: { id: SheetId; no: string; title: string }[] = [
  { id: "v", no: "01", title: "Rain" }, { id: "turn", no: "02", title: "Quarter turn" }, { id: "var", no: "03", title: "Declared" },
  { id: "ai", no: "04", title: "The middle" }, { id: "sh", no: "05", title: "Shell" }, { id: "t", no: "06", title: "Type" }, { id: "i", no: "07", title: "Cursor, home" },
];
export const MINI_TARGET: SheetId[] = ["v", "ai", "var", "sh", "sh", "i", "t", "i"];   // per slot
export const MINI_LIT: Record<SheetId | "end", number[]> = {
  v: [0], turn: [0,1,2,3,4,5,6,7], var: [0,1,2], ai: [1,5], sh: [3,4], t: [6], i: [5,7], end: [0,1,2,3,4,5,6,7],
};
export const PEEKABLE = [0, 1, 3, 4, 5, 6];   // never 2 or 7: a turning neighbour isolates "SHITH" / "VARSHIT"
export const PEEK_END = [7];                  // only in the END state (the parked H turns to G)

export type Face = "front" | "side" | "turning";
export type Presence = "solid" | "ghost" | "hidden";
export type Tone = "ink" | "signal";
export type Vis = { face: Face; presence: Presence; tone: Tone; group: string };
export type Word = Vis[];                      // length 8

const W = (f: (i: number) => Partial<Vis>): Word =>
  Array.from({ length: 8 }, (_, i) => ({ face: "front", presence: "solid", tone: "ink", group: "word", ...f(i) }));
const only = (keep: number[], v: Partial<Vis>) => W((i) => (keep.includes(i) ? v : { presence: "hidden" }));

export const STATES = {
  REST:    W(() => ({})),
  SHIP:    W(() => ({ face: "side", tone: "signal" })),
  VAR:     W((i) => (i < 3 ? { tone: "signal", group: "var" } : { presence: "hidden" })),
  AI:      only([1, 5], { tone: "signal", group: "ai" }),
  SH:      only([3, 4], { group: "sh" }),
  OUTLINE: W(() => ({ presence: "ghost" })),
  END:     W((i) => (i === 5 ? { group: "caret" } : i === 7 ? { group: "park" } : { presence: "hidden" })),
} satisfies Record<string, Word>;
export type StateName = keyof typeof STATES;

export type Transition = { from: StateName; to: StateName; order: number[]; kind: "turn" | "step" | "together" | "drain" };
export const TRANSITIONS = {
  quarterTurn: { from: "REST", to: "SHIP", order: [5,4,6,3,7,2,1,0], kind: "turn" },   // wave from the I
  turnBack:    { from: "SHIP", to: "REST", order: [0,1,2,3,7,4,6,5], kind: "turn" },   // the I lands last
  toVar:       { from: "REST", to: "VAR",  order: [0,1,2,3,4,5,6,7], kind: "step" },   // tint V A R, then forward-delete S H I T H
  fromVar:     { from: "VAR",  to: "REST", order: [7,6,5,4,3,2,1,0], kind: "step" },
  toAI:        { from: "REST", to: "AI",   order: [6,3,4,2,0,7,1,5], kind: "step" },   // T leaves first
  fromAI:      { from: "AI",   to: "REST", order: [5,1,7,0,2,4,3,6], kind: "step" },   // T returns last
  toSH:        { from: "REST", to: "SH",   order: [6,5,0,1,2,7,3,4], kind: "step" },
  fromSH:      { from: "SH",   to: "REST", order: [4,3,7,2,1,0,5,6], kind: "step" },
  toOutline:   { from: "REST", to: "OUTLINE", order: [0,1,2,3,4,5,6,7], kind: "together" },
  fromOutline: { from: "OUTLINE", to: "REST", order: [0,1,2,3,4,5,6,7], kind: "together" },
  drain:       { from: "REST", to: "END",  order: [6,3,0,1,2,4,5,7], kind: "drain" },  // T, S first
} satisfies Record<string, Transition>;

const level = (v: Vis) =>
  v.presence === "hidden" ? 0 : v.presence === "ghost" || v.face === "turning" ? 1 : v.tone === "ink" ? 2 : 3;
const key = (v: Vis) => `${level(v)}|${v.group}`;

/** true = this frame reads S-H-I-T as its own unit. Must never be true. */
export function isolatesRun(w: Word): boolean {
  const run = [3, 4, 5, 6];
  if (!run.every((i) => w[i].face === "front" && level(w[i]) > 0)) return false;   // run broken or turned
  if (new Set(run.map((i) => key(w[i]))).size > 1) return false;                   // run not styled alike
  if (level(w[3]) < Math.max(...w.map(level))) return false;                       // run is de-emphasised
  return [2, 7].some((i) => key(w[i]) !== key(w[3]));                              // a neighbour breaks away
}

/** Every intermediate word of a transition: slots flip in `order`; the slot mid-flip is "turning"/ghost. */
export function stepsOf(t: Transition): Word[] { /* k = 0..8: order[0..k) at `to`, order[k] mid (face "turning" for kind "turn", presence "ghost" otherwise), rest at `from`; "together": from, all-ghost, to */ }
```

**Motion contract.** Every per-slot tween in a transition must have **equal duration** and start in `order` with monotonic start times. The `transition()` helper in `layouts.ts` (§9) is the only way the sheet code changes rot, tone, alpha or ghost. A slot may change position only between its own step start and the end of that transition. With equal durations and monotonic starts, the guard also holds for overlapping, continuous tweens: slot 5 leaves first in `quarterTurn` and lands last in `turnBack`, and T or S leads every exit.

**Rain.** The load rain fills all 8 letters bottom-up at once, with only a 0.05s left-to-right offset per letter. It never goes right-to-left.

**`scripts/type/guard.test.mjs`** (node:test) asserts:
1. `!isolatesRun(w)` for every `STATES` word, every `stepsOf(t)` word, every `MINI_LIT` set (lit slots signal, the rest ink), and every single-slot "turning" peek in `PEEKABLE`.
2. `PEEK_END` in END.
3. Each `order` is a permutation of 0..7.
4. `FRONT[5] === SIDE[5] === "I"`.
5. Both words use only the charset.
6. **Negative controls** return `true`: REST with slot 7 hidden ("VARSHIT"); REST with slot 2 hidden ("SHITH"); REST with slot 2 turning.

---

## 6. The GPU scene

### 6.1 Build-time geometry (`scripts/type/build.mjs`)

devDependencies: `opentype.js`, `manifold-3d`.

Inputs:
- `scripts/type/ToolsplexDisplay-Black.ttf` (a copy of `../custom-font-v1.0/…ttf`)
- `app/_data/word.ts`
- `app/_fonts/ToolsplexDisplay-Black.woff2`

Steps:
1. Parse the font. Assert: UPM 1000; 71 characters; every command is M, L or Z (no Q or C); FRONT and SIDE letters have advance 650 and bbox 45..605 × 0..700; every scanline y = 0.5..699.5 hits ink for each FRONT and SIDE glyph (even-odd point-in-polygon); `FRONT[5] === SIDE[5]`. Warn if the VARSHITH node count ≠ 96.
2. Write **`app/_data/glyphs.json`**:
   ```json
   { "upm":1000, "cap":700, "adv":650, "charset":" !+,…z",
     "glyphs": { "A": { "adv":650, "box":[45,0,605,700], "contours":[[x,y,x,y,…],…] }, … },
     "facts": { "glyphs":72, "chars":71, "offCurve":0, "woff2Bytes":1764, "nodes":{ "VARSHITH":96 }, "stem":170 } }
   ```
   Contours are y-up font units, with advance-left and baseline at the origin.
3. For each slot i, build the solid with manifold-3d:
   - `F = new CrossSection(front_i, "EvenOdd").extrude(560).translate([0,0,45])` (z 45..605).
   - `S = new CrossSection(side_i, "EvenOdd").extrude(560).rotate([0,-90,0]).translate([605,0,0])`, so that local z = side-glyph x and x ∈ 45..605.
   - `solid = F.intersect(S).translate([-325, 0, -325])`, centred on the vertical axis.
4. **Raster asserts** at 1 unit per pixel. Pixel XOR must be ≤ 0.3% of ink, or the build exits 1.
   - Front view (drop z) vs the front glyph.
   - Side view after three's `Ry(+90°)`, where (x,y,z) → (z,y,−x) and screen x = z + 325, vs the **unmirrored** side glyph. The I at slot 5 catches mirroring: its chamfers must be top-right and bottom-left.
   - If the side view is mirrored, flip the rotate sign and the translate, and re-assert.
5. Write **`public/type/solids.bin`** (little-endian, about 45KB):
   - `"TQT1"` (4 bytes), `u16 slots=8`, `u16 quant=4`, `char[8] FRONT`, `char[8] SIDE`.
   - Then per slot: `u16 vertCount, u16 triCount, i16[vertCount*3] (units×4), u16[triCount*3]`, padded to 4 bytes.
6. Print the triangle and byte totals. Outputs are **committed**; the script is not part of `next build`.

### 6.2 Runtime (`app/_stage/engine.ts`, loaded only on `/`, only in motion mode)

**Renderer:**
- `new WebGPURenderer({ canvas, alpha: true, antialias: tier !== "low" })`, then `await renderer.init()`.
- `toneMapping = NoToneMapping`, `outputColorSpace = SRGBColorSpace`, clear alpha 0. The page paper shows through, so theme changes need no clear colour.
- Backend = `renderer.backend.isWebGPUBackend ? "webgpu" : "webgl2"`. three falls back automatically.
- `renderer.setAnimationLoop(null)`: rendering is driven by `gsap.ticker` (§8.1).

**Canvas:** `<canvas class="stage" aria-hidden>`, `position:fixed; inset:0; z-index:0; pointer-events:none`. `main` is `position:relative; z-index:1`.

**Camera:** `OrthographicCamera(0, W, 0, -H, -10000, 10000)`, with W = `documentElement.clientWidth` and H = `innerHeight`. World units are CSS px, with y up: world y = −viewport y. Update it on resize.

**Colours:**
- Custom properties return unresolved `light-dark()` strings, so resolve each token through a hidden probe `<i style="color:var(--ink)">`: `new Color().setStyle(getComputedStyle(probe).color)` for ink, signal, stone, cast and edge (edge keeps its alpha).
- Re-read on the `data-theme` MutationObserver and on the `prefers-color-scheme` change. Apply instantly; the DOM circle reveal carries the transition, and the canvas is live inside `::view-transition-new`.
- Set `uLight.x = dark ? -0.6 : 0.6`.

**Scene graph, per slot i (0..7).** All objects share `userData.st = store.slots[i]` and have `frustumCulled = false`. The flat-shaded geometry is `toNonIndexed()` plus `computeVertexNormals()`.

| Object | Transform per frame | Material |
|---|---|---|
| `solid[i]` Mesh | `position.set(st.x + .325*st.s, -(st.y + st.lift), 0)`; `scale = st.s/1000`; `rotation.set(pitchRad, st.rot*DEG, 0, "XYZ")` (turn in the letter's own frame, then pitch) | `solidMat` (shared) |
| `edges[i]` LineSegments(`EdgesGeometry(indexedGeo, 20)`) | same as solid | `edgeMat` (shared) |
| `shadow[i]` Mesh (same geometry) | same position and scale; `rotation.set(pitchRad, 0, 0)`; rotY applied in the shader; `renderOrder = -1`; `visible = pitch > 0.5°` and tier ≠ low | `shadowMat` (shared) |

The parent `word` Group has `matrixAutoUpdate = false`. Its matrix is `T(0,-yb) · Shear(tan(slant)) · T(0,yb)` (via `Matrix4.makeShear(k,0,0,0,0,0)`), where yb = the mean baseline of the visible slots, so the speed italic leans about the baseline.

**TSL, solids (unlit, flat):**

```ts
const st = (f) => uniform(0).onObjectUpdate(({ object }) => f(object.userData.st));
const uFlat = st(s => s.flat), uTone = st(s => s.tone);
const uFill = st(s => (s.drain > 0 ? 0 : s.alpha * (1 - 0.94 * s.ghost) * blinkMask(s)));
const a = abs(normalLocal);
const face = select(a.y.greaterThanEqual(max(a.x, a.z).sub(0.01)), C.stone,        // top/bottom (45° chamfers tie-break to stone)
             select(a.z.greaterThanEqual(a.x), C.ink, C.signal));                   // front = ink, side = signal
solidMat.colorNode = mix(face, mix(C.ink, C.signal, uTone), uFlat);                 // uFlat=1: pure flat glyph silhouette
solidMat.opacityNode = uFill; solidMat.transparent = true; solidMat.depthWrite = true;

edgeMat.colorNode = C.edge.rgb;
edgeMat.opacityNode = st(s => s.alpha * Math.max(1 - s.flat, s.ghost) * edgeAlpha * (s.drain > 0 ? 0 : 1));

const uRot = st(s => s.rot * DEG);
shadowMat.positionNode = Fn(() => {
  const p = positionGeometry, c = cos(uRot), n = sin(uRot);
  const q = vec3(p.x.mul(c).add(p.z.mul(n)), p.y, p.z.mul(c).sub(p.x.mul(n)));      // Ry(rot)
  const k = q.y.div(uLight.y.negate());                                              // uLight = (±0.6, -1, 0.8): down, toward viewer
  return vec3(q.x.add(uLight.x.mul(k)), float(-1), q.z.add(uLight.z.mul(k)));         // flat on the baseline plane
})();
shadowMat.colorNode = C.cast;
shadowMat.opacityNode = st(s => s.alpha * (1 - s.ghost) * (s.drain > 0 ? 0 : 1));
shadowMat.depthWrite = false;
```

If `onObjectUpdate` misbehaves on a backend, fall back to one material per slot. The node graphs are identical, so the pipelines are cached.

**Rain and drain particles:** one `InstancedMesh(PlaneGeometry(1,1), rainMat, N)` with identity instance matrices and an instanced attribute `aT` (vec4: tx, ty in slot-local font units, slot, heightOrder 0..1).

Sampling (engine, at init, from `glyphs.json`):
- Take the ink area A of all 8 FRONT glyphs (even-odd polygon area).
- Target cell c = √(A/N).
- Use a jittered lattice (±0.2c): keep the points inside each glyph and binary-search c until the count is within 1% of N.
- `heightOrder = ty/700`.
- Set `uCell = c`.

Tier N:
- N = clamp(inkAreaPx / 9, 4096, tierMax), measured at the hero layout, giving a grain of about 3px.
- tierMax is 24,576 high, 16,384 mid and 8,192 low.

Uniforms:
- `uSlots = uniformArray(8 × vec4(x, -y, s/1000, drain))`, updated every frame from the store.
- `uRain`, `uSand`, `uH` (viewport height).

Position node:

```ts
rainMat.positionNode = Fn(() => {
  const S = uSlots.element(aT.z.toInt());
  const target = vec2(S.x.add(aT.x.mul(S.z)), S.y.add(aT.y.mul(S.z)));
  const r = hash(instanceIndex);
  const delay = aT.w.mul(0.5).add(aT.z.mul(0.02)).add(r.mul(0.06));        // lowest grains first, 0.05 s per letter L→R
  const t = clamp(uRain.sub(delay).div(0.3), 0, 1);
  const pos = mix(vec2(target.x, float(40).add(r.mul(uH).mul(0.35))), target, t.mul(t)).toVar();  // gravity t², from above the viewport
  const d = clamp(S.w.mul(1.35).sub(r.mul(0.35)), 0, 1);
  pos.y.subAssign(d.mul(d).mul(uH.add(300)));                                // drain: falls off the bottom
  const flying = max(float(1).sub(smoothstep(0.92, 1.0, t)), step(0.001, d));
  const size = uCell.mul(S.z).mul(1.08).mul(max(uSand, step(0.0001, S.w)));   // collapse when not visible
  const cxy = positionGeometry.xy;
  return vec3(pos.x.add(cxy.x.mul(size)), pos.y.add(cxy.y.mul(size).mul(mix(1, 6, flying))), 0);  // 6× streak in flight
})();
rainMat.colorNode = C.ink;    // opaque flat squares, no glow
```

`mesh.visible = uSand > 0 || any drain > 0`.

**Render on demand:**
- Each tick, hash the store: the slot fields, pitch, slant, rain, sand, blink phase `floor(t/0.53)%2`, the theme version and the size version.
- Render only when the hash changes or while rain or drain are active. Idle cost is zero.
- Skip rendering while `document.hidden`.
- Before the first render, wait until `store.slots[0].s > 0`.
- After the first frame, add `html.stage-gpu`.

**Tiers.** `Stage.tsx` probes before importing three: low = `(pointer: coarse)`, or hardwareConcurrency ≤ 4, or deviceMemory ≤ 4.

| Tier | Condition | DPR cap | MSAA | Particles max | Pitch peak | Shadows / slant |
|---|---|---|---|---|---|---|
| high | webgpu backend, not low | 2 | on | 24,576 | 16° | on / on |
| mid | webgl2 backend, not low | 1.5 | on | 16,384 | 16° | on / on |
| low | low probe (either backend) | 1.5 | off | 8,192 | 8° | off / off |
| css | no `WebGL2RenderingContext`, Save-Data, init throws, or init > 2500 ms | — | — | none | 16° CSS | none |
| still | reduced motion, or no JS | — | — | — | — | server SVG stills |

**Live downgrade:** if the first 90 rendered frames average more than 22ms, set DPR to 1. If the next 90 still average more than 22ms, halve `rainMesh.count` and turn shadows off.

**Budget:**
- ≤ 25 draw calls (8 solids + 8 edges + 8 shadows + 1 rain), fewer than 20k triangles, no post-processing, GPU memory < 16MB.
- The three chunk is dynamically imported on hydration of `/` only.

### 6.3 CSS stage (`app/_stage/CSSWord.tsx`)

`mode="live"` is the no-GPU fallback. It subscribes to `gsap.ticker` and re-renders only when the store hash changes. It uses the same store as the GPU stage.

- A fixed full-viewport `.cs-stage` holds 8 `.cs-slot` boxes: `transform: translate3d(x+.325s px, y px, 0) rotateX(pitch) rotateY(rot)`, `transform-style: preserve-3d`, and **no perspective**, so the projection is orthographic.
- Faces are at `font-size: s px`: box 0.56em × 0.7em × depth 0.56em.
  - Front: `translateZ(.28em)`, FRONT letter.
  - Side: `rotateY(-90deg) translateZ(.28em)`, SIDE letter. Verify it reads unmirrored at `rotateY(90deg)`; if not, flip both signs.
  - Top: `rotateX(90deg) translateZ(.35em)`, `--stone`.
  - Letter text: `font: 900 1em/.76em var(--f-display); margin-left: -.045em`, which puts the baseline on the face bottom.
- Colour is `color-mix(in oklab, var(--ink), var(--signal) calc(var(--tone)*100%))`.
- Ghost is `color: transparent; -webkit-text-stroke: 1px var(--edge)`.
- Drain is `translateY(+40px)` plus a fade.
- Blink uses a CSS steps animation.
- There are no edges, cast shadows or rain.
- After mounting, add `html.stage-css`.

`mode="still"` renders static markup, with props `rot` and `pitch`, for the Sheet 02 reduced-motion figure.

---

## 7. Scroll choreography

Common rules:
- Pins use `anticipatePin: 1` and `invalidateOnRefresh: true`.
- Progress numbers below are timeline positions from 0 to 1.
- **Entry rule:** every pinned sheet also has an entry trigger `{start:'top bottom', end:'top top', scrub:0.6}` that tweens all 8 slots' x, y and s to that sheet's REST placement (`L.center()`, or `L.anchor('#t')` for Sheet 06). Each pinned timeline starts and ends in REST, except `#turn`, which ends in SHIP. This makes the sheets independent.
- Mobile (column layout): pins are ×0.6, placements are always `L.column()` (no x/y moves), pitch peaks at 8°, there is no spacing breathe, and there is no snap.

| Sheet | Trigger | Pin | Scrub | SplitText | DOM | Word and GPU (store writes) |
|---|---|---|---|---|---|---|
| **#v exit** | `#v` top top → bottom top | no | 0.6 | `etym` lines (mask) out | `[data-m=spec], etym, vnote, lede, ctas, folio-b, place`: yPercent 0→−40 and autoAlpha →0, stagger 0.03 (plain elements; the lede is not split) | slots: hero spans → `L.center()`, power1.inOut. Kill the V nudge. Clear `lift`. `sheet=0` |
| **#turn** | top top → `+=150%` | yes | 0.8 · desktop snap `[0, .36, .80]` (front, sculpture, side), duration .3–.8, delay .15, directional | `h2a` chars (in a line mask, yPercent 100→0, stagger .012, expo.out); `h2b` chars; caption lines | .00–.08 kicker ScrambleText; h2a in · .70–.78 h2a lines out (yPercent −100), h2b in · .72–.80 `leader` scaleX 0→1, callout fades in, caption lines · mini-index `.mi-l` rotationX 0→90 per slot in `quarterTurn` order, at each slot's turn end | .06–.24 spacing 650→830 and zoom 1→0.9 (x, s to `L.center({spacing:830, zoom:.9})`) · **.10–.625** `transition('quarterTurn')`: dur .30, rot 0→90, tone 0→1, flat 1→0 over the first 20% and 0→1 over the last 20% · .16–.36 pitch 0→16, hold to .50, .50–.64 16→0 · .62–.72 spacing 830→650, zoom →1 · `sheet=1` |
| **#manifest** | `#manifest` top bottom → top top | no | 0.6 | row numbers ScrambleText (digits) | `ScrollTrigger.batch('[data-m=row]', {start:'top 85%', once})`: clip-path `inset(0 100% 0 0)`→`inset(0)`, 0.6s power3.out, stagger .06 | slots → `L.sticky('#manifest [data-m=ship]')` (the stuck rect of the sticky anchor). Stays SHIP |
| **#var** | top top → `+=150%` | yes | 0.8 | h2 words; sub lines; captions lines | .30–.40 kicker, h2, sub · .44–.52 code line 1 (clip steps) + `53` rolls in (mask, yPercent 100→0) + caption 1 · .56–.66 line 2, `53` out (yPercent −100), `131` in, caption 2 · .70–.80 line 3, `390+`, caption 3 | .00–.28 `transition('turnBack')` (dur .12) with spacing breathe 650→830→650 · .28–.46 `transition('toVar')` (dur .05): V A R → signal, then S H I T H alpha →0 and lift +0.12em · .40–.52 V A R → `L.anchor('#var')` · .82–1.00 V A R → center, then `transition('fromVar')` · `sheet=2` |
| **#ai** | top top → `+=160%` | yes | 0.8 | h2 words; card lines | .08–.18 h2, sub · .18–.30 pipe hairline DrawSVG 0→100% · .24–.50 station outlines draw then fill `--signal` in order, labels masked in · .30 card 1 in · .56–.76 card 1 out, card 2 in, `ring` DrawSVG, `ringlabel` in, `models` ScrambleText · .76–.84 card 3 · token loop: time-based, repeat −1, about 4s, pauses at each station; `toggleActions:'play pause resume pause'` | .00–.14 `transition('toAI')` (dur .05); A → `L.anchor('#ai [data-m=anchor-a]')`, I → `…anchor-i` · .86–1.00 A and I back to center, `transition('fromAI')` · `sheet=3` |
| **#sh** | top top → `+=80%` | yes | 0.6 | h2 lines | .06–.20 h2, sub, `$ ls guides/` types (chars, steps) · .18–.40 `bignum` rolls in (mask), listing rows clip-reveal (stagger .08) · `caret` gets class `on` (CSS blink, 530ms) from .18 · .40–.86 hold. Row hover (time-based, 0.45s power3.out): bignum swaps to the cover lines "JEV +" / "CLAUDE" (from `guide.cover`) | .00–.18 `transition('toSH')` (dur .05); S and H → `L.anchor('#sh')` · .86–1.00 back to center, `transition('fromSH')` · `sheet=4` |
| **#t** | top top → `+=140%` | yes | 0.8 | h2 lines | .00–.12 outline paths DrawSVG 0→100% (stagger .01, reading order); node rects scale 0→1 (stagger .002, back.out); `countn` 0→96 (snap 1) · .12–.28 metric lines scaleX 0→1 (stagger .03), labels in · .28–.46 I outline `rotation:180` about its cell centre (lands identical), `calli`; V outline y +18u yoyo, `callv` · .46–.82 Weight `--stroke`: 0 → −80 (.46–.60, hairline) → +40 (.60–.72) → 0 (.72–.82, detent "Black (real)"); `facts` in · .82–1.00 outline opacity 1→.3→0 | .00–.12 `transition('toOutline')`: ghost 0→1, then alpha →0 (the solids hand off to the SVG at an identical position) · .82–1.00 `transition('fromOutline')` · `sheet=5` |
| **#glyphs** | top 80% | no | no | — | cells `from {autoAlpha:0, y:8}`, `stagger:{each:.01, from:'center', grid:'auto'}`, once | — |
| **#i** | top top → `+=100%` | yes | 0.8 | `typed` chars; sub, links, colophon lines | .30–.75 chars reveal (clip or steps) in reading order · .75–1.00 sub, links, colophon lines (stagger .07) | .00–.30 `transition('drain')`: each slot sets alpha 0 at its step start and drain 0→1 (dur .08); H(7) → `L.anchor('#i [data-m=park]')`; I(5) → the caret start · .30–.75 I: `s = 0.85 × typedFontPx / 0.7`, x/y follow the right edge and line baseline of the last revealed char (rects precomputed on refresh; `gsap.quickTo`) · ≥ .75 `store.blink = 5` (reset below) · **after the pin end:** a trigger from the pin end to `max` subtracts the scroll delta from the y of slots 5 and 7 so they ride up with the section · `sheet=6`; last 5% of the document → mini index `end` |

---

## 8. Global systems

### 8.1 Runtime (`app/_motion/runtime.ts`)

- `gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase)`.
- `ScrollTrigger.config({ ignoreMobileResize: true })`.
- **Lenis** (motion mode only): `new Lenis({ lerp: 0.1, syncTouch: false, autoRaf: false })`; `lenis.on('scroll', ScrollTrigger.update)`; `gsap.ticker.add(t => lenis.raf(t * 1000))`; `gsap.ticker.lagSmoothing(0)`.
  - The stage adds its render callback afterwards, with `gsap.ticker.add(render)`, so it runs last in the tick.
  - Guide pages never create Lenis.
- **Scroll-derived values** each tick:
  - `store.direction = sign(lenis.velocity)` toggles `.vmark.up` (CSS rotate 180°, .35s, power3.out).
  - `store.slant = lerp(store.slant, clamp(lenis.velocity * .12, -8, 8), .1)` on desktop, high and mid tiers only.
  - `--squash` (100→75) is set on the header element only; running heads use `font-stretch: calc(var(--squash) * 1%)`.
- **Contexts:** `gsap.matchMedia` with conditions `{ desktop: '(min-width: 641px)', mobile: '(max-width: 640px)', reduce: '(prefers-reduced-motion: reduce)' }`. Inside a context, all sheet builders run in a `gsap.context`.
  - A width-only resize (debounced 250ms) reverts and rebuilds. SplitText is used with `autoSplit: false`, and rebuilding re-splits.
  - After rebuilding: `ScrollTrigger.refresh()`, then restore the scroll position with `lenis.scrollTo(y, { immediate: true })`.
  - After `document.fonts.ready`, measure the hero, build, refresh, and if `location.hash` is set, `lenis.scrollTo(hash, { immediate: true })`.
- **Nav:**
  - Mini-index and CTA clicks on `/` call `scrollToSheet(id)`, which uses `lenis.scrollTo`.
  - "Turn the name" scrolls to 80% of the `#turn` pin (duration 2.4, easeInOutCubic).
  - "Read the guides" scrolls to `#sh` (1.6).
- **Dev tuning:** with `?tune=1` (dev builds only), 4 range inputs edit `TUNE = { pitchPeak:16, spacingPeak:830, turnDur:.30, waveStart:.10 }`, which `sheets-a` reads. This is for tuning the screenshot frame.
- **Cursor:** no custom cursor. The only exception is `cursor: crosshair` over the Sheet 06 outline, with a small mono readout chip that snaps to the nearest node within 24 units: "A · x 435 y 265 · node 6/14". Nodes carry `data-g`, `data-n`, `data-x` and `data-y`.

### 8.2 Store (`app/_motion/store.ts`, the contract between motion and stage)

```ts
export type SlotState = {
  x: number; y: number; s: number;   // CSS px, viewport: advance-box left, baseline, font-size (1em = 1000 units)
  lift: number;                      // px, additive y (V nudge)
  rot: number;                       // deg about own vertical axis: 0 = FRONT letter, 90 = SIDE letter
  flat: number;                      // 1 = one flat colour (reading), 0 = three face tones + edges
  tone: number;                      // 0 ink → 1 signal (the flat colour)
  alpha: number; ghost: number;      // presence; ghost 1 = hairline edges + 6% fill
  drain: number;                     // 0..1 sand drain (solid hidden while > 0)
};
export type StageKind = "gpu" | "css" | "none";
export const store: {
  slots: SlotState[]; pitch: number; slant: number; rain: number; sand: number;
  blink: number; sheet: number; direction: 1 | -1; column: boolean; tier: "high" | "mid" | "low" | "css";
};
export const stageReady: Promise<StageKind>;
export function setStage(kind: StageKind): void;          // resolves stageReady, sets html class
export function setSheet(i: number): void;                // -1 = none; notifies subscribers
export function onSheet(cb: (i: number) => void): () => void;
export function heroLayout(): Pick<SlotState, "x" | "y" | "s">[];   // from #v [data-slot] spans: x = left, y = top + .82·fs, s = fs
```

Initial values: every slot is `{0,0,0, 0, 0,1,0, html.intro ? 0 : 1, 0,0}`.

### 8.3 Intro

**CSS part.** Under `html.intro`, it starts at first paint and is independent of hydration:
- `.top > *` rise 8px→0 and fade, 0.4s, `var(--ease)`.
- `.case-line.base` scaleX 0→1, 0.7s, `cubic-bezier(.87,0,.13,1)`, delay .10s. `.cap` at .18s.
- `.case path` stroke-dashoffset 1→0, 0.3s, delay `.25s + n·.04s`.
- `.spec-label`, `.etym` and `.v-note` fade in, 0.6s, delay .30s.
- **The lede and CTAs are never hidden.** The lede is the LCP.
- `.word` has `color: transparent` with a failsafe `animation: word-show 0s 1.4s forwards` (to `var(--ink)`). `html.stage-gpu` and `html.stage-css` set it permanently transparent.

**JS part** (`sheets-a.ts`, `buildIntro`):
- `kind = await Promise.race([stageReady, wait(1200).then(() => "late")])`.
- If `kind === "gpu"` and `html.intro`:
  - At max(0.40s after navigation start, now): `store.sand = 1`, then `store.rain` 0→1 over 1.9s (ease `none`; the grain easing lives in the shader). Mobile uses 1.2s.
  - Then, **in the same tick**: `sand = 0`, every slot `alpha = 1`, and add `html.inked`. The grainy fill turns crisp, and CSS tightens the crop marks 8px inward (0.3s, power3.out).
  - +0.6s: V nudge. `slots[0].lift` 0→0.018·s (0.6s sine.inOut, yoyo, 3 repeats, repeatDelay 1.2). Killed by the first wheel, touch or key.
- Otherwise: remove `html.intro`, set all alphas to 1, and there is no rain. A stage that arrives later swaps in invisibly, because colours and positions match the DOM.
- Any wheel, touch or keydown during the intro sets `intro.timeScale(6)`. Scroll is never locked.

**Hero peeks** (desktop hover or touch tap on `#v .slot`):
- Only for slots in `PEEKABLE`, only after `inked`, and only while the `#v` exit progress is < 0.02.
- `rot` 0→90, `flat` 1→0→1, `tone` 0→1 over 0.35s snap, then back over 0.7s peek (`overwrite:'auto'`).
- On the I, a mono chip shows "same both ways".
- Scrolling kills the peek and returns to rest.

### 8.4 Theme

`ThemeToggle.tsx` is unchanged: the `startViewTransition` circle from the button, 560ms, `cubic-bezier(.7,0,.2,1)`, instant under reduced motion. The GPU and CSS stages recolour instantly on the `data-theme` mutation, and the floor-shadow light swaps sides.

### 8.5 MiniIndex (`app/_ui/MiniIndex.tsx`)

- Renders 8 `.mi-l` items as `<a>`: a front span (`FRONT[i]`) and a back span (`SIDE[i]`), CSS 3D, `rotateX` driven by `sheets-a`.
- Subscribes with `onSheet`. The lit set is `MINI_LIT[SHEETS[i].id]`: lit letters are `--signal`, unlit letters are `--ink-2`, which is text-safe.
- Off the homepage there is no subscription and nothing is lit.

---

## 9. File plan and interfaces

Five parallel owners. Each file has exactly one owner.

| # | Path | Owner | Responsibility / exports |
|---|---|---|---|
| 1 | `package.json` | A | add `"type:build": "node scripts/type/build.mjs"`, `"test": "node --test scripts/type/"`; devDeps `opentype.js`, `manifold-3d` |
| 2 | `scripts/type/ToolsplexDisplay-Black.ttf` | A | copy of the source TTF |
| 3 | `scripts/type/build.mjs` | A | §6.1. Writes #6 and #7. Exits 1 on any failed assert |
| 4 | `scripts/type/guard.test.mjs` | A | §5 tests (imports `../../app/_data/word.ts`) |
| 5 | `app/_data/word.ts` | A | §5 (FRONT, SIDE, SHEETS, MINI_TARGET, MINI_LIT, PEEKABLE, PEEK_END, types, STATES, TRANSITIONS, isolatesRun, stepsOf) |
| 6 | `app/_data/glyphs.json` | A (generated) | schema in §6.1 |
| 7 | `public/type/solids.bin` | A (generated) | format in §6.1 |
| 8 | `app/_fonts/ToolsplexDisplay-Black.woff2` | A | copy of the source WOFF2 |
| 9 | `app/_stage/Stage.tsx` | B | `"use client"`; `export default function Stage()`. Returns without mounting unless `html.motion`. Probes the tier; `import("./engine")` races 2500ms; on failure mounts `<CSSWord mode="live"/>`. Calls `setStage` and disposes on unmount |
| 10 | `app/_stage/engine.ts` | B | `export async function start(canvas: HTMLCanvasElement, tier: "high"|"mid"|"low"): Promise<{ backend: "webgpu"|"webgl2"; dispose(): void }>` (§6.2) |
| 11 | `app/_stage/CSSWord.tsx` | B | `"use client"`; `export default function CSSWord(p: { mode: "live" } | { mode: "still"; rot: number; pitch: number })` (§6.3) |
| 12 | `app/_motion/store.ts` | D | §8.2 |
| 13 | `app/_motion/layouts.ts` | D | `export const L: { hero(); center(o?: {spacing?: number; zoom?: number}); anchor(sel: string); sticky(sel: string); column(); caretAt(i: number) }`, each returning `Partial<Record<number, {x,y,s}>>` in viewport px (pinned anchors measured relative to their section top). `export function transition(tl: gsap.core.Timeline, name: keyof typeof TRANSITIONS, at: number, span: number, dur: number, place?: (slot: number) => Partial<{x:number;y:number;s:number}> | undefined): void`, the only writer of rot, tone, alpha, ghost, flat and drain |
| 14 | `app/_motion/runtime.ts` | D | `export function startRuntime(): { lenis: Lenis | null; mm: gsap.MatchMedia; scrollToSheet(id: SheetId, o?: {at?: number; duration?: number}): void; TUNE: {...}; dispose(): void }` (§8.1) |
| 15 | `app/_motion/Motion.tsx` | D | `"use client"`; `export default function Motion()`. On mount: `startRuntime()`, then fonts.ready, `store.slots ← L.hero()`, then run `buildIntro, buildV, buildTurn, buildManifest, buildVar` (from #16) and `buildAI, buildSH, buildT, buildI` (from #17), each as `(ctx: BuildCtx) => void`. Sheet toggles call `setSheet`. Reverts everything on unmount |
| 16 | `app/_motion/sheets-a.ts` | D | `export type BuildCtx = { reduced: boolean; column: boolean; kind: StageKind; lenis: Lenis | null; scrollToSheet: …; TUNE: … }` + intro, 01, 02, manifest, 03, hero peeks |
| 17 | `app/_motion/sheets-b.ts` | E | 04, 05, 06, glyphs, 07, font-editor readout, the post-pin ride in #i |
| 18 | `app/_ui/MiniIndex.tsx` | D | §8.5 |
| 19 | `app/_home/Shell.tsx` | E | `"use client"`; `export default function Shell({ guides }: { guides: Guide[] })`. See the command list below |
| 20 | `app/_home/Weight.tsx` | E | `"use client"`; `export default function Weight()` and `export function GlyphGrid()`. See the details below |
| 21 | `app/_ui/Glyphs.tsx` | C | server component. `export default function Glyphs(p: { text: string; slots?: number[]; mode?: "fill"|"outline"; nodes?: boolean; metrics?: boolean; tone?: "ink"|"signal"; inline?: boolean; className?: string; title?: string })`. See the details below |
| 22 | `app/_ui/Clock.tsx` | C | `"use client"`; `<time>` HH:MM via `Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12:false})`, updated every 15s, colon blinks at 1s (not under reduced motion). Renders "--:--" before mount |
| 23 | `app/layout.tsx` | C | fonts (§3.2), boot script (§11.1), header (§4.1), footer, metadata and viewport |
| 24 | `app/globals.css` | C | tokens (§3.1), base, header, footer, `.btn` (mono 13px, radius 0), `.sec-*`, GuideList classes restyled, `.stage`, `.still` gating, intro keyframes, `::view-transition-*` (kept). Delete the `.bm*` and old `.name`, `.w1`, `.w2` rules |
| 25 | `app/page.tsx` | C | server component: §4 markup and copy, plus `<Stage/>` and `<Motion/>` at the top of `main`. Imports `home.css` |
| 26 | `app/home.css` | C | all section layouts, desktop and ≤ 640px. States that stack in one cell live under `html.motion` |
| 27 | `app/_data/work.ts` | C | `export type WorkItem = { no: string; name: string; what: string; where?: { label: string; href?: string }; swatches?: string[]; status: "live" | "building" | null }; export const work: WorkItem[]` (§4.4) |
| 28 | `app/_data/site.ts` | C | description and links (§4.10) |
| 29 | `app/_data/guides.ts` | C | only the comment on `cover` changes: "both lines set in Toolsplex; second line in the guide's ink colour" |
| 30 | `app/guides/page.tsx` | C | adds `<p class="kicker">sh · $ ls guides/</p>` and `<Glyphs text="SH" className="sh-mark" title="SH"/>` (64px) before the h1. h1 "Guides" and the lede are unchanged |
| 31 | `app/guides/guide.css` | C | edits in §10 |
| 32 | `app/_ui/Inspect.tsx` | C | **delete** |

Unchanged: `ThemeToggle.tsx`, `GuideList.tsx`, `app/guides/_ui/*`, `app/guides/jev-claude/*`.

**Shell (#19).**
- Markup: a `<form>` with a `<label class="sr-only" for="sh-in">Shell</label>`, a `$` prefix, and `<input id="sh-in" autocomplete="off" spellcheck="false" placeholder="ls guides/">`. Output goes in `role="log" aria-live="polite"`.
- Commands, case-insensitive:

| Input | Result |
|---|---|
| `ls`, `ls guides`, `ls guides/`, or empty | listing |
| `open 001`, `open jev-claude`, `cat 001` | `router.push` |
| `cd v`, `cd var`, `cd ai`, `cd sh`, `cd t`, `cd i`, `cd home`, or a bare letter or chapter | `scrollToSheet` via the `window` event `"tqt:goto"` |
| `whoami` | "gubba varshith · mahbubnagar, telangana" |
| `help` | "try: ls, open 001, cd t, whoami" |
| `clear` | clears the output |
| `sudo …` | "nice try." |
| anything else | "sh: <cmd>: not found. try help" |

- The Shell never listens to keys outside its input.

**Weight and GlyphGrid (#20).**
- The slider is `<input type="range" min=-80 max=40 step=1 value=0 aria-label="Synthetic weight" aria-valuetext>`. It writes `--stroke` on `.specimen`.
- `.specimen` is `-webkit-text-stroke: calc(abs(var(--stroke)) * 2 / 1000 * 1em) var(--stroke-c)`, where `--stroke-c` is `--paper` when the value is < 0 (erode) and `--ink` when it is > 0 (thicken, with round corners). Stroke paints over the fill.
- Double-click the slider to snap to 0.
- Scroll writes to the slider only until the user first interacts with it.
- GlyphGrid has 71 `<button aria-label="Glyph A">` cells. Hover or focus loads that glyph into the specimen.

**Glyphs (#21).**
- The viewBox is `0 0 {n*650} 700`, with y flipped to `700-y`. Each glyph is a `<g data-slot={slots[k]} transform="translate(k*650,0)">`.
- `fill` mode draws `fill-rule:evenodd` paths.
- `outline` mode draws `fill:none; stroke:currentColor; vector-effect:non-scaling-stroke`, with `pathLength="1"` and `overflow:visible`.
  - `nodes` adds 30-unit rects at on-curve points, with `data-g`, `data-n`, `data-x` and `data-y`.
  - `metrics` adds lines at y 0, 170, 265, 435, 530 and 700 across x ±20000.
- The root carries `data-glyphs` and `data-slots`. It is `aria-hidden` unless `title` is passed.
- In dev, it throws on characters outside the charset.

**Dependency order for parallel work:** A ships word.ts, glyphs.json and solids.bin first; stub files for the JSON and bin are fine on day 1. B and D agree on `store.ts` exactly as written here. C and E agree on the `data-m` hooks in §4.

---

## 10. Guides integration

**Homepage:** the header "Guides" link, the hero CTA "Read the guides", Sheet 05 (the Shell listing, the big accent number, "All guides →"), and the manifest does not duplicate them. Adding a guide is still one `guides.ts` entry plus `app/guides/<slug>/page.tsx`: the listing, the "00N being written" row and the big number all update from the data.

**`/guides` hub:** no stage, no Lenis, no three. The kicker and SH mark from #30, the h1 "Guides" in `.sec-title`, then `GuideList` restyled in `globals.css`:
- `.sec-title`: Toolsplex 900 uppercase, tracking 0.
- `.cover-a` and `.cover-b`: `font-family: var(--f-display)`; `.cover-b` keeps `var(--g-ink)`.
- `.guide-title`: Newsreader 500, `clamp(22px, 2.4vw, 32px)`.
- Hover: `outline: 1px solid var(--signal)`, and the `--handles` squares are removed.

**`/guides/[slug]`:** reading mode with native scroll and no motion runtime. The token aliases keep `guide.css` working. Edits:
1. `.cover-title { font-weight: 400; letter-spacing: -.03em }`, which puts Newsreader on "Jev +". `.cover-title .dot { font-weight: 900; letter-spacing: 0 }`, so "CLAUDE" is in Toolsplex via `--f-dot`.
2. `.mini-h, .part-h, .card-t { font-weight: 560 }`. The `font-stretch` lines can stay; they have no effect.
3. `.prompt-copy { font: 500 12px/1 var(--f-mono); border-radius: 0 }`.
4. `.part-no` and `.join a` automatically use Toolsplex through `--f-dot`.

No JSX changes are needed on guide pages. The RoboNuggets credit stays visible.

---

## 11. Reduced motion, mobile, fallbacks, accessibility, performance

### 11.1 Boot script and html classes (`layout.tsx` `<head>`, runs before paint)

```js
var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}
d.classList.add("js");
if(matchMedia("(prefers-reduced-motion: no-preference)").matches){d.classList.add("motion");if(location.pathname==="/")d.classList.add("intro")}
```

| Class | Set by | Effect |
|---|---|---|
| `js` | boot | JS ran |
| `motion` | boot | pins, stage, stills hidden: `html.motion .still{visibility:hidden}`; on ≤ 640px `display:none`; `html.motion .cards > *, .nums > div {grid-area:1/1}` |
| `intro` | boot on `/` | `.word` transparent plus the 1.4s failsafe; CSS intro animations |
| `stage-gpu` / `stage-css` | Stage | `.word` transparent permanently |
| `inked` | intro | crop marks tighten |

Failsafe: `html.motion:not(.stage-gpu):not(.stage-css) .still { animation: still-show 0s 4s forwards }`, which switches the stills to visible if the runtime dies.

### 11.2 Reduced motion (and no JS)

- No Lenis, pins, scrub, SplitText, intro, rain, peeks, slant or blink. The stage is not mounted.
- Every sheet is normal flow (`min-height: 100svh`). Its `.still` is the visual:
  - VAR in signal
  - A and I in signal with a static pipeline
  - SH with a static caret
  - the T outline with nodes and metrics, drawn
  - the static inline I caret after the typed line
  - the static parked H
  - Sheet 02 shows `<CSSWord mode="still" rot={38} pitch={12}/>` plus the two lines (VARSHITH in ink, SIDE in signal) and "Same eight solids, front and side."
- Both H2 lines of `#turn` are visible, the numerals and cards are listed rather than stacked, and all copy is identical and in order.
- The theme switch is instant. Only opacity fades of 150ms or less remain on hover and focus.
- Sheet tracking still updates the mini index (ScrollTrigger toggles without animation, created in the reduce branch).

### 11.3 Mobile (≤ 640px, or coarse pointer)

- The word is a fixed vertical column at the left, 16vw wide. The column is the hero DOM layout, so `L.column()` = `L.hero()` measured at scrollY 0. Content sits in the right 72vw.
- Turns happen in place (no breathe). Pitch peaks at 8°. Pins are ×0.6, with no snap.
- Lenis uses `syncTouch:false`, so touch scrolling stays native.
- The low tier applies (§6.2 table). There are no shadows or slant, and the rain lasts 1.2s.
- Sheet 04 stations stack vertically in the gap between A (slot 1) and I (slot 5).
- Taps replace hovers: letter peek, manifest row expand, glyph-grid load. Touch targets are at least 44px.
- Use `svh` units throughout, 16px minimum gutters, and no horizontal scroll.

### 11.4 Accessibility

- The canvas and CSS stage are `aria-hidden` and `pointer-events:none`.
- The h1 has `aria-label` plus sr-only "Gubba ", and its text content is "Gubba Varshith".
- There is one h2 per sheet, and all interactive elements are real links, buttons or inputs.
- Focus order follows the DOM. The skip link is kept. `lang="te"` is on వర్షిత్.
- Signal is text-safe; `--ink-3` is never used for text.
- The Shell does not capture global keys. The slider has `aria-valuetext` ("Black (real)" at 0).
- Pinned sections keep their text in the DOM, animated by transform, clip or opacity, and never removed.

### 11.5 Performance budget

| Area | Budget |
|---|---|
| LCP | The lede, painted at FCP. Target < 2.0s on mobile 4G |
| CLS | < 0.05 (the display font uses `display:block` and is a 1.7KB preload) |
| three.js | The chunk loads only on `/` in motion mode, after hydration. Zero three.js requests on `/guides/**` (acceptance test) |
| GPU | ≤ 25 draw calls, < 20k triangles, idle renders 0 frames, paused when the tab is hidden, live downgrade (§6.2) |
| Main thread | < 4ms per scroll frame. No layout reads in scrub callbacks: caret rects and anchors are measured on refresh; the only live read is the sticky anchor during the manifest entry |
| Assets | `solids.bin` ≈ 45KB (fetched in parallel with the three import). `glyphs.json` ≈ 10KB, bundled only into the engine chunk; Glyphs renders server-side |

---

## 12. Cut order, launch confirmations, acceptance

**Cut first, in this order:**
1. Shell commands. Keep the static listing.
2. Font-editor readout.
3. The Weight instrument and glyph grid. Keep the facts and the outline.
4. The Hermes ring and the A…I token loop. Keep the static pipeline.
5. Floor cast shadows.
6. Speed italic and the header squash.
7. The drain. Replace it with a staggered fade using the same order.

**Never cut:** the build script and its asserts, the guard test, the rain load, the Quarter Turn, the VAR, A…I and SH sheets, the CSS stage fallback, and the reduced-motion stills.

**Confirm with Varshith before launch:**
- The *varṣa* etymology and the Telugu spelling వర్షిత్. If he rejects the etymology, drop the line; the rain stays as a visual.
- SHIPPING or BUILDING. It is one constant plus `npm run type:build`.
- Which projects get a `status` and which get links (`work.ts`).
- The domain spellings: startupmaps.in vs startupmap.in, and waitflow.xyz vs thiswayflow.xyz.
- Whether WaitAds should be public.
- The Instagram handles in `site.links`.
- Any public email. None ships until he supplies one.

Private data stays out by construction: no pricing, fees, KYC, MSME, Razorpay, tax work, equity, coupons, cold-call stats or subscription costs.

**Acceptance checks:**
- `npm run type:build` passes: scanlines, raster diffs, and 96 nodes.
- `npm test` passes: the guard, including its negative controls.
- Screenshots in light and dark at hero, mid-turn (progress 0.36), SHIPPING, VAR, A…I, SH, T and I all look intentional.
- No frame reads S-H-I-T, checked by scrubbing every pin at 1% steps in both directions.
- The hero swap is invisible: the DOM word and the GPU word overlap within 1px at 100%, 125% and 150% Windows scaling.
- The Quarter Turn holds 60fps on a mid laptop (high and mid tiers).
- `/guides/jev-claude` loads with zero three.js.
- Reduced motion and no-JS render every sheet's still and all copy.