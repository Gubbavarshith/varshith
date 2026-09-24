"use client";

// The word as eight CSS 3D boxes (spec §6.3). "live" is the no-GPU stage: same store, same placements,
// orthographic (no perspective), and no edges, cast shadows or rain. "still" is the static figure for
// Sheet 02 in reduced motion and no-JS. Faces are 0.56em × 0.7em × 0.56em: the capital ink box.

import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { FRONT, SIDE } from "../_data/word";
import { store } from "../_motion/store";

type Props = { mode: "live" } | { mode: "still"; rot: number; pitch: number };

// Each box turns about its own axis on the baseline: faces sit around (0, -.35em) and are pushed out by
// half the box. The slot rotates X by -pitch because CSS y points down; that is the GPU's +pitch (tops
// tilt toward the viewer). The side face reads unmirrored at rotateY(90deg), as in the GPU stage.
// A letter's baseline is pinned to its face's bottom edge by a zero-width .7em strut in a line-height 0
// line: browsers round a font's ascent to whole pixels, so any "top + .82em" placement drifts up to a
// pixel, while the strut's height is exact. text-indent pulls the 45-unit side bearing off the face.
// Colour: --flatc is the reading colour; --flat 1 floods every face with it, 0 shows the face tones.
const CSS = `
.cs-stage{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;contain:strict}
.cs-slot{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;
--flatc:color-mix(in oklab,var(--ink),var(--signal) calc(var(--tone,0)*100%))}
.cs-stage .cs-slot{will-change:transform}
.cs-f{position:absolute;left:-.28em;top:-.7em;width:.56em;height:.7em;
font:900 1em/0 var(--f-display);text-indent:-.045em;white-space:nowrap;text-transform:none;letter-spacing:0;
backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:var(--a,1)}
.cs-b{display:inline-block;width:0;height:.7em;vertical-align:baseline}
.cs-front{transform:translateZ(.28em);--face:color-mix(in oklab,var(--ink),var(--flatc) calc(var(--flat,1)*100%))}
.cs-side{transform:rotateY(-90deg) translateZ(.28em);--face:color-mix(in oklab,var(--signal),var(--flatc) calc(var(--flat,1)*100%))}
.cs-front,.cs-side{color:color-mix(in srgb,var(--face) calc(100% - var(--ghost,0)*94%),transparent)}
.cs-top{top:-.63em;height:.56em;transform:rotateX(90deg) translateZ(.35em);
--face:color-mix(in oklab,var(--stone),var(--flatc) calc(var(--flat,1)*100%));
background:color-mix(in srgb,var(--face) calc(100% - var(--ghost,0)*94%),transparent)}
.cs-slot.gh .cs-front,.cs-slot.gh .cs-side{-webkit-text-stroke:1px color-mix(in srgb,var(--edge) calc(var(--ghost,0)*100%),transparent)}
.cs-slot.blink .cs-f{animation:cs-blink 1.06s steps(1,end) infinite}
@keyframes cs-blink{50%{visibility:hidden}}
.cs-still{position:relative;display:block;width:7.36em;height:1em;margin-inline:auto;
font-size:var(--cs-size,min(12vw,20svh));user-select:none;--flat:0;--tone:0}
.cs-still .cs-slot{top:.85em;transform:rotateX(calc(-1*var(--pitch))) rotateY(var(--rot))}
`;

// React hoists this into <head> once, whichever mode renders first
const Style = () => (
  <style href="tqt-cs-word" precedence="default">
    {CSS}
  </style>
);

function Box({ i, style }: { i: number; style?: CSSProperties }) {
  return (
    <span className="cs-slot" style={style}>
      <span className="cs-f cs-front">
        <i className="cs-b" />
        {FRONT[i]}
      </span>
      <span className="cs-f cs-side">
        <i className="cs-b" />
        {SIDE[i]}
      </span>
      <span className="cs-f cs-top" />
    </span>
  );
}

// Sheet 02 figure. A box turned 38° is .79em wide, so slots sit .92em apart: the breathed 830 would
// leave the pairs of letters on neighbouring faces touching, and the figure would read as one strip.
function Still({ rot, pitch }: { rot: number; pitch: number }) {
  const vars = { "--rot": `${rot}deg`, "--pitch": `${pitch}deg` } as CSSProperties;
  return (
    <>
      <Style />
      <div className="cs-still" style={vars} aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} i={i} style={{ left: `${(i * 0.92 + 0.46).toFixed(2)}em` }} />
        ))}
      </div>
    </>
  );
}

const noSubscribe = () => () => {};
const FIELDS = 13; // per slot: the 10 SlotState fields, pitch, caret, device pixel ratio

function Live() {
  const client = useSyncExternalStore(noSubscribe, () => true, () => false);
  const root = useRef<HTMLDivElement>(null);

  // layout effect: the first frame is written, and the DOM word hidden, before the browser paints
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const boxes = Array.from(el.children) as HTMLElement[];
    const snap = new Float64Array(8 * FIELDS).fill(NaN);
    let at = 0;
    let dirty = false;
    const put = (v: number) => {
      if (snap[at] !== v) {
        snap[at] = v;
        dirty = true;
      }
      at++;
    };

    const tick = () => {
      const slots = store.slots;
      if (slots.length < 8) return;
      const pitch = store.pitch;
      const dpr = devicePixelRatio || 1;
      const b = store.blink; // the caret slot; 0 is the resting default and the V never blinks
      const caret = Number.isInteger(b) && b >= 1 && b <= 7 ? b : -1;
      for (let i = 0; i < 8; i++) {
        const s = slots[i];
        at = i * FIELDS;
        dirty = false;
        put(s.x);
        put(s.y);
        put(s.s);
        put(s.lift);
        put(s.rot);
        put(s.flat);
        put(s.tone);
        put(s.alpha);
        put(s.ghost);
        put(s.drain);
        put(pitch);
        put(caret === i ? 1 : 0);
        put(dpr);
        if (!dirty) continue;

        const box = boxes[i];
        const st = box.style;
        const a = s.s > 0 ? s.alpha * (1 - s.drain) : 0; // drain: drop 40px and fade
        // the layout baseline lands on whole device pixels, like the DOM word it replaces
        const y = Math.round(s.y * dpr) / dpr + s.lift + 40 * s.drain;
        st.visibility = a > 1e-3 ? "" : "hidden";
        st.fontSize = `${s.s}px`;
        st.transform = `translate3d(${s.x + 0.325 * s.s}px,${y}px,0) rotateX(${-pitch}deg) rotateY(${s.rot}deg)`;
        // opacity goes on the faces (via --a): opacity on the slot would flatten its 3D
        st.setProperty("--a", `${a}`);
        st.setProperty("--tone", `${s.tone}`);
        st.setProperty("--flat", `${s.flat}`);
        st.setProperty("--ghost", `${s.ghost}`);
        box.classList.toggle("gh", s.ghost > 1e-3);
        box.classList.toggle("blink", caret === i);
      }
    };

    tick();
    gsap.ticker.add(tick);
    const html = document.documentElement;
    html.classList.add("stage-css");
    return () => {
      gsap.ticker.remove(tick);
      html.classList.remove("stage-css");
    };
  }, [client]);

  if (!client) return null;
  // on <body>, like the canvas, so it sits under main (z-index 1) whatever mounts the stage
  return (
    <>
      <Style />
      {createPortal(
        <div ref={root} className="cs-stage" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Box key={i} i={i} />
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default function CSSWord(p: Props) {
  return p.mode === "live" ? <Live /> : <Still rot={p.rot} pitch={p.pitch} />;
}
