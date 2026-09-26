import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import type { WorkItem } from "../_data/work";
import { site } from "../_data/site";
import Preview from "./Preview";
import BrowserSwitch from "./BrowserSwitch";

// The manifest's browser: a real-looking window with every build open in a tab. Page 0 is a new tab; page k
// is build k − 1, drawn from its own static preview. With motion, app/_motion/deck.ts switches tabs as you
// scroll (the address retypes, the page loads and slides in); without it, the tabs switch on click.

const url = (w: WorkItem) => w.domain ?? (w.preview ? w.name.toLowerCase().replace(/\s+/g, "") : "localhost:3000");

// ---------- icons (16px, stroke) ----------

const I = ({ d, fill }: { d: string; fill?: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="bw-i">
    <path d={d} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} />
  </svg>
);
const BACK = "M13 8H3.5M7.5 4 3.5 8l4 4";
const FWD = "M3 8h9.5M8.5 4l4 4-4 4";
const RELOAD = "M13 8a5 5 0 1 1-1.46-3.54M13 2.5V5h-2.5";
const STOP = "M4 4l8 8M12 4l-8 8";
const LOCK = "M4.5 7.5V5.5a3.5 3.5 0 0 1 7 0v2M3.5 7.5h9v6h-9z";
const STAR = "M8 2.2l1.75 3.6 3.95.55-2.87 2.77.7 3.93L8 11.2l-3.53 1.85.7-3.93L2.3 6.35l3.95-.55z";
const PUZZLE = "M6 2.5h2.5v1.5a1.2 1.2 0 1 0 2.4 0V2.5H13v3.5h-1.5a1.2 1.2 0 1 0 0 2.4H13V13H9.5v-1.5a1.2 1.2 0 1 0-2.4 0V13H3.5V9.5H5a1.2 1.2 0 1 0 0-2.4H3.5V2.5z";
const MORE = "M8 3.2v.1M8 8v.1M8 12.8v.1";
const SEARCH = "M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM10.6 10.6 14 14";

// ---------- favicons: each build's own mark, from its preview ----------

const letter = (bg: string, text: string, fg = "#fff") => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect width="16" height="16" rx="3.5" fill={bg} />
    <text x="8" y="11.4" fill={fg} fontSize={text.length > 1 ? 7 : 10} fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
      {text}
    </text>
  </svg>
);
const FAV: Record<string, ReactNode> = {
  Toolspark: letter("#3b58e2", "T", "#ffe066"),
  aiimageprompts: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="32" fill="#ffde1a" />
      <path d="M32 12l4.5 15.5L52 32l-15.5 4.5L32 52l-4.5-15.5L12 32l15.5-4.5z" fill="#fff" />
    </svg>
  ),
  StartupMaps: letter("#2f8f6b", "SM"),
  UIZoo: letter("#0f5e50", "U", "#5eead4"),
  "AI Usage": (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0e1013" />
      <path d="M16 6.7A9.3 9.3 0 1 1 7.02 13.59" fill="none" stroke="#d97757" strokeWidth="4.3" strokeLinecap="round" />
    </svg>
  ),
  GamesHub: (
    <svg viewBox="0 0 87 100" aria-hidden="true">
      <path d="M0 9Q0 0 7.8 4.5l71.4 41q7.8 4.5 0 9L7.8 95.5Q0 100 0 91z" fill="#ffb21a" />
    </svg>
  ),
  "SVG Vault": letter("#181816", "S"),
};
// a real favicon wins: public/favicons/<slug>.svg (toolspark.svg, aiimageprompts.svg, aiusage.svg …), checked at build
const slug = (w: WorkItem) => w.name.toLowerCase().replace(/[^a-z0-9]/g, "");
const fav = (w: WorkItem) =>
  existsSync(join(process.cwd(), "public", "favicons", `${slug(w)}.svg`)) ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 16px svg, nothing to optimise
    <img src={`/favicons/${slug(w)}.svg`} alt="" width={16} height={16} />
  ) : (
    (FAV[w.name] ?? letter("var(--signal)", w.name[0]))
  );
const NEW_TAB = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="1" y="1" width="14" height="14" rx="3.5" fill="none" stroke="currentColor" />
    <path d="M5 8h6M8 5v6" stroke="currentColor" />
  </svg>
);

// ---------- pages ----------

function NewTab({ work }: { work: WorkItem[] }) {
  return (
    <div className="bw-ntp">
      <p className="ntp-top" aria-hidden="true">
        <span>Guides</span>
        <span>Instagram</span>
        <b>V</b>
      </p>
      <p className="ntp-logo">Varshith</p>
      <p className="ntp-search">
        <I d={SEARCH} />
        Search my builds or type a URL
      </p>
      <ul className="ntp-tiles">
        {work.map((w) => (
          <li key={w.name}>
            <span className="ntp-fav">{fav(w)}</span>
            {w.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

// SastrasAI isn't live, so its tab never finishes loading
function NotYet() {
  return (
    <div className="bw-err">
      <svg className="err-ico" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M11 5h18l9 9v29H11z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M29 5v9h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="19.5" cy="25" r="1.8" fill="currentColor" />
        <circle cx="29.5" cy="25" r="1.8" fill="currentColor" />
        <path d="M18.5 35q6-4.5 12 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <p className="err-h">This build can’t be reached yet</p>
      <p>
        <b>localhost:3000</b> is still being built. I know you’re all waiting.
      </p>
      <p className="err-try">Try:</p>
      <ul>
        <li>Giving the five agents time to agree on a headline</li>
        <li>Coming back soon</li>
      </ul>
      <p className="err-code">ERR_STILL_SHIPPING</p>
      <span className="err-btn">Reload</span>
    </div>
  );
}

// ---------- the window ----------

export default function Browser({ work }: { work: WorkItem[] }) {
  const first = work[0];
  return (
    <div className="bw" data-m="browser">
      <BrowserSwitch />
      <div className="bw-strip">
        <div className="bw-tabs" data-m="tabs">
          <i className="bw-on" data-m="tab-on" aria-hidden="true" />
          {work.map((w, k) => (
            <button
              key={w.name}
              type="button"
              className={["bw-tab", k === 0 && "is-on", !w.preview && "is-never"].filter(Boolean).join(" ")}
              data-m="tab"
              aria-label={`Show ${w.name}`}
              aria-pressed={k === 0}
            >
              <span className="bw-fav" aria-hidden="true">
                {k === 0 && <span className="bw-fav-new">{NEW_TAB}</span>}
                <span className="bw-fav-own">{fav(w)}</span>
                <i className="bw-spin" />
              </span>
              <span className="bw-title" aria-hidden="true">
                {k === 0 && <span className="bw-title-new">New Tab</span>}
                <span className="bw-title-own">{w.name}</span>
              </span>
              <span className="bw-x" aria-hidden="true">
                <I d={STOP} />
              </span>
              <span className="bw-card" aria-hidden="true">
                <b>{w.name}</b>
                {url(w)}
              </span>
            </button>
          ))}
          <span className="bw-plus" aria-hidden="true">
            <I d="M8 3v10M3 8h10" />
          </span>
        </div>
        <span className="bw-win" aria-hidden="true">
          <I d="M3.5 8h9" />
          <I d="M4 4h8v8H4z" />
          <I d={STOP} />
        </span>
      </div>

      <div className="bw-bar">
        <span className="bw-btn" data-m="back" aria-hidden="true">
          <I d={BACK} />
        </span>
        <span className="bw-btn" data-m="fwd" aria-hidden="true">
          <I d={FWD} />
        </span>
        <span className="bw-btn bw-reload" data-m="reload" aria-hidden="true">
          <I d={RELOAD} />
          <I d={STOP} />
        </span>
        <a className="bw-omni" data-m="omni" href={first.href} target="_blank" rel="noreferrer">
          <span className="bw-lock" aria-hidden="true">
            <I d={LOCK} />
          </span>
          <span className="bw-url" data-m="url">
            {url(first)}
          </span>
          <span className="bw-star" aria-hidden="true">
            <I d={STAR} />
          </span>
        </a>
        <span className="bw-count" aria-hidden="true">
          {work.length}
        </span>
        <span className="bw-btn bw-ext" aria-hidden="true">
          <I d={PUZZLE} />
        </span>
        <span className="bw-me" aria-hidden="true">
          V
        </span>
        <span className="bw-btn" aria-hidden="true">
          <I d={MORE} />
        </span>
      </div>

      <nav className="bw-marks" aria-label="Bookmarks">
        <a href="/guides">
          <I d="M3.5 2.5h9v11l-4.5-3-4.5 3z" />
          Guides
        </a>
        {site.links.map((l) => (
          <a key={l.href} href={l.href}>
            <I d="M3 8a5 5 0 1 0 10 0A5 5 0 0 0 3 8zM3 8h10M8 3c1.6 1.4 2.4 3.1 2.4 5S9.6 11.6 8 13C6.4 11.6 5.6 9.9 5.6 8S6.4 4.4 8 3z" />
            {l.label.replace(/^Instagram\s+/, "")}
          </a>
        ))}
      </nav>

      <div className="bw-view" data-m="view" aria-hidden="true">
        <i className="bw-load" data-m="load" />
        <div className="bw-page" data-m="page">
          <NewTab work={work} />
        </div>
        {work.map((w, k) => (
          <div key={w.name} className={k === 0 ? "bw-page is-on" : "bw-page"} data-m="page" data-url={url(w)} data-href={w.href ?? ""}>
            {w.preview ? <Preview file={w.preview} name={w.name} /> : <NotYet />}
          </div>
        ))}
        <p className="bw-status" data-m="status" />
      </div>
    </div>
  );
}
