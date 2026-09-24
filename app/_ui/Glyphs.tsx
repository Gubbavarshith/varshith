import data from "../_data/glyphs.json";

// Server-rendered stills of Toolsplex Display, drawn from the font's own contours (app/_data/glyphs.json,
// written by scripts/type/build.mjs). With reduced motion or no JS a still is the visual; in motion mode it
// is the measured anchor the GPU word lands on. The viewBox is the cap box, so the svg's bottom edge is the
// baseline, its height is .7em and each cell is .65em: the stage converts a rect to x, y, s with no guesses.

type Glyph = { adv: number; box: number[]; contours: number[][] };
const font = data as unknown as { cap: number; adv: number; charset: string; glyphs: Record<string, Glyph> };

const CAP = font.cap; // 700; y is flipped to CAP - y
const NODE = 30; // font-editor handle size, in font units
const METRICS = [0, 170, 265, 435, 530, 700]; // baseline, the three bars, cap
const REACH = 20000; // metric lines run far past the word; the svg overflows and the page clips it

const paths = new Map<string, string>();
function pathOf(ch: string, g: Glyph) {
  let d = paths.get(ch);
  if (d === undefined) {
    // every point is on-curve (build.mjs asserts 0 off-curve), so a contour is one polyline
    d = g.contours
      .map((c) => {
        let s = `M${c[0]} ${CAP - c[1]}L`;
        for (let i = 2; i < c.length; i += 2) s += `${c[i]} ${CAP - c[i + 1]} `;
        return `${s.trimEnd()}Z`;
      })
      .join("");
    paths.set(ch, d);
  }
  return d;
}

export type GlyphsProps = {
  text: string;
  /** word slot of each glyph (data-slot); defaults to its index */
  slots?: number[];
  mode?: "fill" | "outline";
  /** outline mode: a 30-unit handle on every on-curve point */
  nodes?: boolean;
  /** lines at the baseline, bars and cap, far wider than the word */
  metrics?: boolean;
  tone?: "ink" | "signal";
  /** render a <g> in font units for use inside another svg */
  inline?: boolean;
  className?: string;
  /** accessible name; without it the still is aria-hidden */
  title?: string;
};

export default function Glyphs({
  text,
  slots,
  mode = "fill",
  nodes = false,
  metrics = false,
  tone = "ink",
  inline = false,
  className,
  title,
}: GlyphsProps) {
  let x = 0;
  const cells = [...text].map((ch, k) => {
    const g = font.glyphs[ch];
    if (!g && process.env.NODE_ENV !== "production") {
      throw new Error(`Glyphs: "${ch}" is not in Toolsplex Display. Charset: ${font.charset}`);
    }
    const at = x;
    x += g ? g.adv : font.adv;
    return { ch, g, at, slot: slots?.[k] ?? k };
  });
  const width = x;
  const outline = mode === "outline";

  const cls = ["glyphs", outline && "is-outline", tone === "signal" && "is-signal", className].filter(Boolean).join(" ");
  // presentation attributes, so a still reads right even where no stylesheet targets it (e.g. /guides)
  const paint = outline ? { fill: "none", stroke: "currentColor" } : { fill: "currentColor", fillRule: "evenodd" as const };
  const hooks = { "data-glyphs": text, "data-slots": cells.map((c) => c.slot).join(",") };

  const body = (
    <>
      {metrics && (
        <g className="metrics" fill="none" stroke="currentColor">
          {METRICS.map((m) => (
            <line
              key={m}
              className="metric"
              data-v={m}
              x1={-REACH}
              x2={width + REACH}
              y1={CAP - m}
              y2={CAP - m}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      )}
      {cells.map(({ ch, g, at, slot }, k) => (
        <g key={k} data-slot={slot} data-char={ch} transform={`translate(${at},0)`}>
          {/* no pathLength: DrawSVGPlugin measures real lengths and ignores it, so pathLength="1"
              would make every outline read fully drawn a fraction into the tween */}
          {g && g.contours.length > 0 && (
            <path d={pathOf(ch, g)} vectorEffect={outline ? "non-scaling-stroke" : undefined} />
          )}
          {nodes && g && (
            <g className="nodes">
              {g.contours.flatMap((c, ci) =>
                Array.from({ length: c.length / 2 }, (_, p) => {
                  const px = c[p * 2];
                  const py = c[p * 2 + 1];
                  const n = g.contours.slice(0, ci).reduce((s, cc) => s + cc.length / 2, 0) + p;
                  return (
                    <rect
                      key={n}
                      className="node"
                      x={px - NODE / 2}
                      y={CAP - py - NODE / 2}
                      width={NODE}
                      height={NODE}
                      data-g={ch}
                      data-n={n}
                      data-x={px}
                      data-y={py}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                }),
              )}
            </g>
          )}
        </g>
      ))}
    </>
  );

  if (inline) {
    return (
      <g className={cls} {...hooks} {...paint}>
        {body}
      </g>
    );
  }
  return (
    <svg
      className={cls}
      viewBox={`0 0 ${width} ${CAP}`}
      overflow="visible"
      {...hooks}
      {...paint}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {body}
    </svg>
  );
}
