import type { CSSProperties } from "react";
import Glyphs from "./_ui/Glyphs";
import Clock from "./_ui/Clock";
import Stage from "./_stage/Stage";
import CSSWord from "./_stage/CSSWord";
import Motion from "./_motion/Motion";
import Shell from "./_home/Shell";
import Weight, { GlyphGrid } from "./_home/Weight";
import glyphs from "./_data/glyphs.json";
import { FRONT, SIDE } from "./_data/word";
import { work } from "./_data/work";
import { site } from "./_data/site";
import { accentVars, guides } from "./_data/guides";
import "./home.css";

// QUARTER TURN: a type specimen of Gubba Varshith, in seven sheets. Every word of copy is here, server-rendered.
// data-m attributes are the motion hooks (spec §4); app/_motion selects by them and nothing else.

const ALL = [0, 1, 2, 3, 4, 5, 6, 7];
const facts = glyphs.facts;
const num = (n: number) => n.toLocaleString("en-US");
const vars = (v: Record<string, string | number>) => v as CSSProperties;

// The name is set in capitals by CSS, so it reads "Gubba Varshith" to assistive tech and search.
const NAME = FRONT[0] + FRONT.slice(1).toLowerCase();

// Crop marks on the type case: at each corner of each cell's ink box (x 45 / 605, y 0 / 700) a 60-unit tick
// runs away from the box, 12 units clear of the cap and base lines, drawn from the box outward.
const TICK = 60;
const CLEAR = 12;
const CORNERS = ALL.flatMap((i) =>
  [45 + 650 * i, 605 + 650 * i].flatMap((x) => [
    { i, dy: -1, d: `M${x} ${-CLEAR}V${-CLEAR - TICK}` },
    { i, dy: 1, d: `M${x} ${700 + CLEAR}V${700 + CLEAR + TICK}` },
  ]),
);

// Sheet 04's pipeline sits in one coordinate system with the A and the I: font units, cap 700.
// The row is A (650) + pipe (4400) + I (650); stations are glyphs at .22 of the cap, evenly spaced.
const STATIONS = [
  ["M", "Manager"],
  ["K", "Keyword analyzer"],
  ["R", "Research"],
  ["D", "Drafting"],
  ["P", "Publishing"],
] as const;
const PIPE = 4400;
const ST = 0.22;
const stationX = (k: number) => Math.round((PIPE * (k + 1)) / (STATIONS.length + 1));

const METRICS = [0, 170, 265, 435, 530, 700];
const latest = guides[0];

export default function Home() {
  return (
    <main id="main" className="home">
      <Stage />
      <Motion />

      {/* ---------- Sheet 01 · V: rain ---------- */}
      <section id="v" aria-labelledby="name">
        <p className="spec-label" data-m="spec" aria-hidden="true">
          <span>FAMILY</span> Gubba · <span>STYLE</span> Varshith · <span>WEIGHT</span> Black
        </p>
        <p className="etym" data-m="etym">
          var·shith (
          <span lang="te" className="te">
            వర్షిత్
          </span>
          ). From Sanskrit <i>varṣa</i>: rain.
        </p>
        <h1 id="name" className="name" aria-label={site.name}>
          <span className="sr-only">Gubba </span>
          <span className="word" data-m="word">
            {[...NAME].map((c, i) => (
              <span key={i} className="slot" data-slot={i}>
                {c}
              </span>
            ))}
          </span>
        </h1>
        <svg className="case" data-m="case" viewBox="0 0 5200 700" preserveAspectRatio="none" aria-hidden="true">
          {CORNERS.map((c, k) => (
            <path
              key={k}
              d={c.d}
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              style={vars({ "--n": c.i, "--dy": c.dy })}
            />
          ))}
        </svg>
        <i className="case-line base" data-m="base" aria-hidden="true" />
        <i className="case-line cap" data-m="cap" aria-hidden="true" />
        <p className="v-note" data-m="vnote" aria-hidden="true">
          V points down.
        </p>
        <p className="lede">
          I design and build small internet products with AI coding agents, from Mahbubnagar, Telangana. When a setup
          works, I write it up as a guide.
        </p>
        <div className="ctas">
          <a className="btn btn-solid" href="#sh" data-m="cta-guides">
            Read the guides
          </a>
          <a className="btn" href="#turn" data-m="cta-turn">
            Turn the name
          </a>
        </div>
        <p className="folio-b" aria-hidden="true">
          Toolsplex Display Black · {num(facts.woff2Bytes)} bytes · {facts.offCurve} curves
        </p>
        <p className="place">
          Mahbubnagar · <Clock /> IST
        </p>
      </section>

      {/* ---------- Sheet 02 · the quarter turn ---------- */}
      <section id="turn" className="leaf" aria-labelledby="turn-h">
        <p className="kicker" data-m="kicker">
          Sheet 02 · {FRONT} ⟂ {SIDE}
        </p>
        <h2 id="turn-h" className="h2" data-m="h2">
          <span data-m="h2a">Turn my name ninety degrees.</span> <span data-m="h2b">It says what I do.</span>
        </h2>
        <div className="turn-anchor" data-m="anchor">
          <Glyphs text={FRONT} slots={ALL} className="anchor" />
        </div>
        <div className="still turn-still">
          <CSSWord mode="still" rot={38} pitch={12} />
          <p className="still-lines">
            <span className="ink">{FRONT}</span> <span className="sig">{SIDE}</span>
          </p>
          <p className="cap-note">Same eight solids, front and side.</p>
        </div>
        <p className="i-callout" data-m="icallout">
          <i className="leader" data-m="leader" aria-hidden="true" />
          The I is an I from both sides.
        </p>
        <p className="caption" data-m="caption">
          Eight solids. Each one is a letter of my name intersected with a letter of {SIDE}, both cut from my own
          typeface.
        </p>
      </section>

      {/* ---------- the manifest (part of Sheet 02) ---------- */}
      <section id="manifest" aria-labelledby="manifest-h">
        <div className="ship-anchor still" data-m="ship">
          <Glyphs text={SIDE} slots={ALL} tone="signal" />
        </div>
        <div className="mf-body">
          <h2 id="manifest-h" className="h2-sm">
            The manifest.
          </h2>
          <table className="mf">
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Name</th>
                <th scope="col">What it is</th>
                <th scope="col">Where</th>
              </tr>
            </thead>
            <tbody>
              {work.map((w) => (
                <tr key={w.no} className="mf-row" data-m="row">
                  <td className="mf-no">{w.no}</td>
                  <th scope="row" className="mf-name">
                    {w.name}
                    {w.swatches && (
                      <span className="sws" aria-hidden="true">
                        {w.swatches.map((c) => (
                          <span key={c} className="sw" style={vars({ "--c": c })} />
                        ))}
                      </span>
                    )}
                    {w.status && <span className={`st st-${w.status}`}>{w.status}</span>}
                  </th>
                  <td className="mf-what">{w.what}</td>
                  <td className="mf-where">
                    {w.where?.href ? <a href={w.where.href}>{w.where.label}</a> : w.where?.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Sheet 03 · VAR: declared ---------- */}
      <section id="var" className="leaf" aria-labelledby="var-h">
        <p className="kicker" data-m="kicker">
          Sheet 03 · VAR
        </p>
        <div className="var-anchor still" data-m="anchor">
          <Glyphs text={FRONT.slice(0, 3)} slots={[0, 1, 2]} tone="signal" />
        </div>
        <h2 id="var-h" className="h2" data-m="h2">
          The first three letters are a keyword.
        </h2>
        <p className="sub" data-m="sub">
          var. I write a lot of code, and these days an AI agent does most of the typing while I decide what gets
          declared.
        </p>
        <pre className="code" data-m="code">
          <code>
            <span data-m="line">
              <span className="kw">var</span>
              {" tools    = 53;   "}
              <span className="cm">{"// toolspark.xyz"}</span>
            </span>
            <span data-m="line">
              <span className="kw">var</span>
              {" pages    = 131;  "}
              <span className="cm">{"// aiimageprompts.xyz"}</span>
            </span>
            <span data-m="line">
              <span className="kw">var</span>
              {" startups = 373;  "}
              <span className="cm">{"// Hyderabad"}</span>
            </span>
          </code>
        </pre>
        <dl className="nums" data-m="nums">
          <div data-m="num">
            <dt className="num">53</dt>
            <dd>Toolspark. 53 free browser tools in 8 categories. No signup, no uploads, nothing leaves the tab.</dd>
          </div>
          <div data-m="num">
            <dt className="num">131</dt>
            <dd>
              aiimageprompts.xyz. Google kept crawling a blank React shell, so I wrote a static-site generator for it:
              131 prompt pages, 20 posts, clean sitemaps.
            </dd>
          </div>
          <div data-m="num">
            <dt className="num">373</dt>
            <dd>
              StartupMaps. 373 Hyderabad startups collected for a street-level map, and a hackathon planned to go with
              it.
            </dd>
          </div>
        </dl>
      </section>

      {/* ---------- Sheet 04 · A…I: the middle ---------- */}
      <section id="ai" className="leaf" aria-labelledby="ai-h">
        <p className="kicker" data-m="kicker">
          Sheet 04 · A…I
        </p>
        <h2 id="ai-h" className="h2" data-m="h2">
          There’s AI in the middle of my name.
        </h2>
        <p className="sub" data-m="sub">
          A, then R, S, H, then I. It sits in the middle of most of my work too.
        </p>
        <div className="ai-row">
          <div className="still ai-a" data-m="anchor-a">
            <Glyphs text="A" slots={[1]} tone="signal" />
          </div>
          <figure className="pipe" data-m="pipe">
            <svg className="pipe-art" viewBox={`0 0 ${PIPE} 700`} overflow="visible" aria-hidden="true">
              <path className="pipe-line" d={`M0 350H${PIPE}`} vectorEffect="non-scaling-stroke" />
              {STATIONS.map(([c], k) => (
                <g
                  key={c}
                  className="station"
                  data-x={stationX(k)}
                  transform={`translate(${stationX(k) - ST * 325} ${350 - ST * 350}) scale(${ST})`}
                >
                  <Glyphs text={c} slots={[k]} mode="outline" inline />
                </g>
              ))}
              {/* the token travels the pipe in these units: x 0 → 4400, pausing at each station's data-x */}
              <rect className="token" data-m="token" x={-30} y={320} width={60} height={60} />
            </svg>
            <ol className="stations" data-m="stations">
              {STATIONS.map(([c, label], k) => (
                <li key={c} data-l={c} style={vars({ "--x": `${(stationX(k) / PIPE) * 100}%` })}>
                  {label}
                </li>
              ))}
            </ol>
            <figcaption>MABS, the multi-agent blogging system inside SastrasAI</figcaption>
          </figure>
          <div className="still ai-i" data-m="anchor-i">
            <Glyphs text="I" slots={[5]} tone="signal" />
          </div>
        </div>
        <div className="cards" data-m="cards">
          <article data-m="card">
            <h3>SastrasAI</h3>
            <p>
              Five agents and RAG over your own sitemap, so a solo blogger knows what to write next. It started with my
              own college blog and the hours I lost picking topics. My capstone for 100xEngineers, Cohort 7.
            </p>
          </article>
        </div>
      </section>

      {/* ---------- Sheet 05 · SH: shell ---------- */}
      <section id="sh" className="leaf" aria-labelledby="sh-h">
        <p className="kicker" data-m="kicker">
          Sheet 05 · SH
        </p>
        <div className="still sh-anchor" data-m="anchor">
          <Glyphs text={FRONT.slice(3, 5)} slots={[3, 4]} />
          <span className="caret" data-m="caret" aria-hidden="true" />
        </div>
        <h2 id="sh-h" className="h2" data-m="h2">
          sh. Most of what I make starts in a terminal.
        </h2>
        <p className="sub" data-m="sub">
          Claude Code, Cursor and a few small models. When a setup works, I write it up with every prompt you need to
          copy.
        </p>
        <p className="sh-no" data-m="bignum" aria-hidden="true" style={accentVars(latest)}>
          {latest.no}
        </p>
        <div className="sh-term">
          <Shell guides={guides} />
          <a className="more" href="/guides">
            All guides →
          </a>
        </div>
      </section>

      {/* ---------- Sheet 06 · T: type ---------- */}
      <section id="t" className="leaf" aria-labelledby="t-h">
        <p className="kicker" data-m="kicker">
          Sheet 06 · T
        </p>
        <h2 id="t-h" className="h2" data-m="h2">
          T is for type. I made this one.
        </h2>
        <p className="sub" data-m="sub">
          Toolsplex Display Black, built in Python with fontTools. Stems and bars are {facts.stem} units, corners are
          cut at 45°, and there isn’t a single curve in it.
        </p>
        <div className="t-stage" data-m="anchor">
          <Glyphs text={FRONT} slots={ALL} mode="outline" nodes metrics />
          <ol className="metric-labels" aria-hidden="true">
            {METRICS.map((m) => (
              <li key={m} style={vars({ "--m": m })}>
                {m}
              </li>
            ))}
          </ol>
          <p className="call call-v" data-m="callv">
            V points down. That’s why it goes first.
          </p>
          <p className="call call-i" data-m="calli">
            The I is an I-beam. Turn it upside down and it’s still an I.
          </p>
        </div>
        <dl className="facts" data-m="facts">
          <div>
            <dt>UPM</dt>
            <dd>{glyphs.upm}</dd>
          </div>
          <div>
            <dt>Cap</dt>
            <dd>{glyphs.cap}</dd>
          </div>
          <div>
            <dt>Cell</dt>
            <dd>{glyphs.adv}</dd>
          </div>
          <div>
            <dt>Characters</dt>
            <dd>{facts.chars}</dd>
          </div>
          <div>
            <dt>Off-curve points</dt>
            <dd>{facts.offCurve}</dd>
          </div>
          <div>
            <dt>Bytes</dt>
            <dd>{num(facts.woff2Bytes)}</dd>
          </div>
        </dl>
        <p className="count" data-m="count">
          {FRONT} = <span data-m="countn">{facts.nodes[FRONT]}</span> points
        </p>
        <div className="t-weight">
          <Weight />
        </div>
      </section>

      <section id="glyphs" aria-labelledby="glyphs-h">
        <h3 id="glyphs-h">All {facts.chars} characters</h3>
        <GlyphGrid />
      </section>

      {/* ---------- Sheet 07 · I and H: cursor, home ---------- */}
      <section id="i" className="leaf" aria-labelledby="i-h">
        <p className="kicker" data-m="kicker">
          Sheet 07 · I, H
        </p>
        <h2 id="i-h" className="typed" data-m="typed">
          I build small things for the internet and write down how.
          <span className="still inline-i">
            <Glyphs text="I" slots={[5]} />
          </span>
        </h2>
        <p className="sub" data-m="sub">
          Gubba Varshith. Web developer and UI/UX designer, B.Tech CSE (Data Science). Mahbubnagar and Hyderabad,
          Telangana.
        </p>
        <ul className="links" data-m="links">
          {site.links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <p className="colophon" data-m="colophon">
          Set in Toolsplex Display Black (mine), Newsreader and Martian Mono. Built with Next.js 16, GSAP, Lenis and
          three.js on WebGPU, alongside Claude Code.
        </p>
        <p className="home-line" data-m="home">
          H is for home. It’s <Clock /> in Mahbubnagar.{" "}
          <span className="still park" data-m="park">
            <Glyphs text="H" slots={[7]} />
          </span>
        </p>
      </section>
    </main>
  );
}
