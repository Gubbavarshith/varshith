// The manifest's browser, in motion. p is the stop: 0 is the new tab, k is build k − 1. Between two stops the
// browser does what a real one does when you open the next build: the address is selected and retyped, the
// tab moves over, the page loads (a progress line, a spinner in the tab, a status bubble) and slides in over
// the last one. Scrolling back plays it in reverse. Every value is a function of p, so any scroll position
// draws the same frame.

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const phase = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

/** Each stop holds still for this share of its scroll on either side, so it can be read. */
const DWELL = 0.14;

export type Deck = {
  /** The last stop (the number of builds). */
  last: number;
  /** Remeasure the tabs; call after every refresh. */
  measure(): void;
  render(p: number): void;
  /** A frame of a direct move between any two stops (a tab click), f from 0 to 1. */
  draw(from: number, to: number, f: number): void;
  /** The stop nearest to rest at p. */
  current(p: number): number;
  dispose(): void;
};

export function createDeck(sec: HTMLElement): Deck | null {
  const bw = sec.querySelector<HTMLElement>("[data-m=browser]");
  if (!bw) return null;
  const q = <T extends HTMLElement>(k: string) => bw.querySelector<T>(`[data-m=${k}]`);
  const tabs = Array.from(bw.querySelectorAll<HTMLElement>("[data-m=tab]"));
  const pages = Array.from(bw.querySelectorAll<HTMLElement>("[data-m=page]"));
  const labels = Array.from(sec.querySelectorAll<HTMLElement>("[data-m=label]"));
  const [tabOn, url, omni, load, status, back, fwd, reload] = [
    q("tab-on"), q("url"), q<HTMLAnchorElement>("omni"), q("load"), q("status"), q("back"), q("fwd"), q("reload"),
  ];
  const last = tabs.length;
  if (!last || pages.length !== last + 1 || labels.length !== last) return null;
  const urls = pages.map((p) => p.dataset.url ?? "");
  const hrefs = pages.map((p) => p.dataset.href ?? "");
  const tabOf = (s: number) => Math.max(0, s - 1); // the new tab is what tab 1 showed before it loaded

  let tabX: number[] = [], tabW: number[] = [];
  let on = -1, landed = -1, href = "\0";

  // style and text writes run every frame of a scroll, so only the ones that change reach the DOM
  let written = new WeakMap<HTMLElement, Record<string, string>>();
  const put = (el: HTMLElement | null, prop: string, v: string) => {
    if (!el) return;
    let seen = written.get(el);
    if (!seen) written.set(el, (seen = {}));
    if (seen[prop] === v) return;
    seen[prop] = v;
    if (prop === "text") el.textContent = v;
    else if (prop.startsWith("class:")) el.classList.toggle(prop.slice(6), v === "1");
    else el.style.setProperty(prop, v);
  };

  const measure = () => {
    tabX = tabs.map((t) => t.offsetLeft);
    tabW = tabs.map((t) => t.offsetWidth);
  };

  // a build that comes to rest finishes loading: the top-level parts of its hero rise into place (the
  // previews carry data-part hooks for this)
  const wake = (page: HTMLElement) => {
    const doc = page.querySelector("iframe")?.contentDocument;
    const hero = doc?.querySelector<HTMLElement>('[data-part="hero"]') ?? doc?.querySelector<HTMLElement>(".preview");
    if (!hero) return;
    const parts = Array.from(hero.querySelectorAll<HTMLElement>("[data-part]")).filter(
      (el) => (el.parentElement?.closest("[data-part]") ?? hero) === hero,
    );
    (parts.length ? parts : Array.from(hero.children)).slice(0, 8).forEach((el, i) =>
      el.animate([{ opacity: 0.2, translate: "0 24px" }, { opacity: 1, translate: "0 0" }], {
        duration: 700,
        delay: 40 + i * 60,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "backwards",
      }),
    );
  };

  const eased = (p: number) => {
    const b = Math.floor(p);
    return b + smooth(clamp01((p - b - DWELL) / (1 - 2 * DWELL)));
  };
  const current = (p: number) => Math.min(last, Math.max(0, Math.round(eased(p))));

  /** One frame of the move from stop `from` to stop `to` (any two stops), f from 0 (resting on `from`) to 1. */
  const draw = (from: number, to: number, f: number) => {
    if (!tabX.length) measure();
    const dir = to >= from ? 1 : -1;
    const cur = f < 0.5 ? from : to;

    // the address: selected, retyped, then the new one as the page loads
    let text = urls[from], sel = false, typing = false;
    if (f >= 0.4) text = urls[to];
    else if (f >= 0.16) {
      text = urls[to].slice(0, Math.ceil(urls[to].length * phase(f, 0.16, 0.4)));
      typing = true;
    } else if (f >= 0.06) {
      sel = !!urls[from];
      typing = !urls[from]; // an empty box just takes the caret
    }
    put(url, "text", text);
    put(url, "class:is-sel", sel ? "1" : "0");
    put(url, "class:is-typing", typing ? "1" : "0");

    // loading: a progress line under the toolbar, stop in place of reload, a spinner in the tab, a status bubble
    const loading = f >= 0.4 && f < 0.97;
    const lf = phase(f, 0.4, 0.95);
    put(load, "transform", `scaleX(${(0.06 + 0.94 * (1 - (1 - lf) ** 2)).toFixed(4)})`);
    put(load, "opacity", loading ? (1 - phase(f, 0.9, 0.97)).toFixed(3) : "0");
    put(reload, "class:is-loading", loading ? "1" : "0");
    const waiting = f >= 0.42 && f < 0.9;
    if (waiting) put(status, "text", `Waiting for ${urls[to]}…`);
    put(status, "class:is-on", waiting ? "1" : "0");

    // the tab: the highlight slides to the new build's tab as the address is entered
    const ta = tabOf(from), tb = tabOf(to);
    const h = smooth(phase(f, 0.36, 0.5));
    if (tabOn && tabX.length) {
      put(tabOn, "transform", `translateX(${(tabX[ta] + (tabX[tb] - tabX[ta]) * h).toFixed(2)}px)`);
      put(tabOn, "width", `${(tabW[ta] + (tabW[tb] - tabW[ta]) * h).toFixed(2)}px`);
    }
    tabs.forEach((t, n) => {
      put(t, "class:is-on", n === tabOf(cur) ? "1" : "0");
      put(t, "class:is-loading", loading && n === tb ? "1" : "0");
    });
    // tab 1 reads "New Tab" until Toolspark's title arrives
    put(tabs[0], "class:is-new", (from === 0 && f < 0.6) || (to === 0 && f >= 0.6) ? "1" : "0");

    // the pages. Forward: the new one slides in from the right over the old, which drifts left and dims.
    // Back: the old one slides away to the right, uncovering the new one as it drifts back in
    const g = smooth(phase(f, 0.45, 0.92));
    const top = dir > 0 ? to : from, under = dir > 0 ? from : to;
    const k = dir > 0 ? g : 1 - g; // how far the top page has come in
    pages.forEach((page, j) => {
      const shown = j === under || (j === top && k > 0);
      const near = shown || Math.abs(j - cur) < 2.5; // neighbours stay laid out so their previews preload
      put(page, "display", near ? "block" : "none");
      put(page, "visibility", shown ? "visible" : "hidden");
      if (!shown) return;
      put(page, "transform", j === under ? `translateX(${(-28 * k).toFixed(3)}%)` : `translateX(${(100 * (1 - k)).toFixed(3)}%)`);
      put(page, "--dim", j === under ? (0.3 * k).toFixed(3) : "0");
      put(page, "--edge", j === top ? "1" : "0");
    });

    // back and forward, as a browser would have them here
    put(back, "class:is-off", cur === 0 ? "1" : "0");
    put(fwd, "class:is-off", cur === last ? "1" : "0");

    // the label beside SHIPPING: in place near rest, out (up when leaving, down when not yet here) by mid-move
    labels.forEach((lb, n) => {
      const s = n + 1;
      const d = s === from ? -dir * f : s === to ? dir * (1 - f) : s < Math.min(from, to) ? -2 : 2;
      const a = Math.abs(d);
      const o = a <= 0.08 ? 0 : smooth(clamp01((a - 0.08) / 0.38));
      put(lb, "--o", (Math.sign(d) * o).toFixed(4));
      put(lb, "--a", o.toFixed(4));
      put(lb, "class:is-on", a < 0.5 ? "1" : "0");
    });

    // the address bar opens the build that is showing
    if (hrefs[cur] !== href && omni) {
      href = hrefs[cur];
      if (href) omni.href = href;
      else omni.removeAttribute("href");
    }
    if (cur !== on) {
      tabs.forEach((t, n) => t.setAttribute("aria-pressed", String(n === tabOf(cur) && cur > 0)));
      on = cur;
    }
    const rest = f < 0.001 ? from : f > 0.999 ? to : -1;
    if (rest < 0) landed = -1;
    else if (rest !== landed) {
      landed = rest;
      if (rest > 0) wake(pages[rest]);
    }
  };

  /** The scroll position's frame: p is a stop, fractional between two neighbours. */
  const render = (p: number) => {
    const e = Math.min(last, Math.max(0, eased(p)));
    const b = Math.min(last, Math.floor(e));
    draw(b, Math.min(last, b + 1), e - b);
  };

  const dispose = () => {
    for (const el of [...tabs, ...pages, ...labels, tabOn, load, status, url, reload, back, fwd]) {
      el?.removeAttribute("style");
      el?.classList.remove("is-on", "is-sel", "is-typing", "is-loading", "is-new", "is-off");
    }
    // back to the markup's state: the first build showing, as the tabs expect without motion
    tabs[0].classList.add("is-on");
    pages[1].classList.add("is-on");
    if (url) url.textContent = urls[1];
    written = new WeakMap();
    on = landed = -1;
    href = "\0";
  };

  return { last, measure, render, draw, current, dispose };
}
