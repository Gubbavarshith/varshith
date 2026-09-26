"use client";

// Sheet 05's terminal. The server renders `ls guides/`, so the listing is plain links that work without JS;
// the prompt then takes a small, deterministic set of commands. It reads keys typed into its own input and
// nothing else. cd hands the scroll to the motion runtime through the "tqt:goto" window event.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Guide } from "../_data/guides";
import { FRONT, MINI_TARGET, SHEETS, type SheetId } from "../_data/word";

type Line = { text: string; err?: boolean };
type Block = { id: number; cmd: string; out: "ls" | Line[] };
type Result = { out?: "ls" | Line[]; clear?: true; go?: SheetId; open?: string };

const PROMPT = "ls guides/"; // the placeholder, and what an empty Enter runs
const KEEP = 3; // blocks on screen: the sheet is pinned, so the log can't grow
const pad = (n: number) => String(n).padStart(3, "0");

// Where `cd x` (or a bare x) goes: sheet ids and one-word titles, the letters of the name (each goes where
// the mini index sends it; the first H wins), and the usual shell homes. H is for home, so ~ is Sheet 07.
const CHAPTER: Record<string, SheetId> = (() => {
  const map: Record<string, SheetId> = { home: "i", "~": "i", "/": "v" };
  for (const s of SHEETS) {
    map[s.id] = s.id;
    map[s.title.toLowerCase()] ??= s.id;
  }
  [...FRONT.toLowerCase()].forEach((c, i) => {
    map[c] ??= MINI_TARGET[i];
  });
  return map;
})();

const err = (text: string): Result => ({ out: [{ text, err: true }] });
const clip = (s: string) => (s.length > 24 ? `${s.slice(0, 23)}…` : s);

function interpret(input: string, list: Guide[]): Result {
  const words = input.trim().split(/\s+/).filter(Boolean);
  const [cmd = "", ...args] = words.map((w) => w.toLowerCase());
  const arg = args.join(" ");
  const next = pad(list.length + 1);
  switch (cmd) {
    case "":
      return { out: "ls" };
    case "ls": {
      const paths = args.filter((a) => !a.startsWith("-"));
      if (paths.every((p) => /^(\.\/)?guides\/?$/.test(p))) return { out: "ls" };
      return err(`ls: cannot access '${clip(paths[0])}': no such file or directory`);
    }
    case "open":
    case "cat": {
      const key = arg.replace(/^(\.\/)?(guides\/)?/, "").replace(/\/$/, "");
      const g = list.find((x) => x.no === key || x.slug === key);
      if (g) return { open: g.slug, out: [{ text: `opening guides/${g.slug}/` }] };
      if (key === next) return { out: [{ text: `${next} is still being written.` }] };
      return err(key ? `${cmd}: ${clip(key)}: no such guide. try ls` : `${cmd}: which one? try ${cmd} ${list[0]?.no ?? "001"}`);
    }
    case "cd": {
      if (!arg) return { go: "i" }; // a bare cd goes home
      const to = CHAPTER[arg.replace(/^#/, "").replace(/(.)\/$/, "$1")];
      return to ? { go: to } : err(`cd: ${clip(arg)}: no such chapter`);
    }
    case "whoami":
      return { out: [{ text: "gubba varshith · mahbubnagar, telangana" }] };
    case "help":
      return { out: [{ text: `try: ls, open ${list[0]?.no ?? "001"}, cd t, whoami` }] };
    case "clear":
      return { clear: true };
    case "sudo":
      return { out: [{ text: "nice try." }] };
  }
  const bare = CHAPTER[words.join(" ").toLowerCase()];
  return bare ? { go: bare } : err(`sh: ${clip(words[0])}: not found. try help`);
}

/** Scroll to a sheet. The runtime claims the event (preventDefault) and scrolls with Lenis; with no runtime
 *  and no Lenis (reduced motion) it's a plain jump. */
function goto(id: SheetId) {
  const ev = new CustomEvent<SheetId>("tqt:goto", { detail: id, cancelable: true });
  const claimed = !window.dispatchEvent(ev);
  if (!claimed && !document.documentElement.classList.contains("lenis")) {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }
}

function Listing({ list }: { list: Guide[] }) {
  return (
    <ol className="shell-ls">
      {list.map((g) => (
        <li key={g.slug}>
          <Link className="shell-row" href={`/guides/${g.slug}`} data-m="sh-row" data-guide={g.slug}>
            <span className="shell-no">{g.no}</span>
            <span className="shell-name">
              <span className="shell-dir">{g.slug}/</span> <span className="shell-t">{g.title}</span>
            </span>
            <span className="shell-meta">
              {g.parts} parts · {g.minutes} min · {g.tags.join(", ")}
            </span>
          </Link>
        </li>
      ))}
      <li className="shell-row shell-next" data-m="sh-row">
        <span className="shell-no">{pad(list.length + 1)}</span>
        <span className="shell-name">
          <i className="shell-cur" aria-hidden="true" />
          being written
        </span>
      </li>
    </ol>
  );
}

const CSS = `
.shell{font:400 var(--fs-mono)/1.55 var(--f-mono);font-stretch:87.5%;color:var(--ink);border-top:1px solid var(--ink);min-width:0}
.shell p{margin:0}
.shell-ls{margin:0;padding:0;list-style:none}
.shell-block+.shell-block{border-top:1px dashed var(--rule)}
.shell-echo{padding:12px 0 8px;color:var(--ink-2);overflow-wrap:anywhere}
.shell-ps{color:var(--signal);margin-right:1ch;user-select:none}
.shell-cmd{display:inline-block;color:var(--ink)}
.shell-row{display:grid;grid-template-columns:5ch minmax(0,1fr);column-gap:1ch;padding:12px 0;border-top:1px solid var(--rule);color:inherit;text-decoration:none}
.shell-no{color:var(--ink-2);font-variant-numeric:tabular-nums}
.shell-dir{color:var(--signal)}
.shell-t{color:var(--ink);transition:color .15s}
a.shell-row:hover .shell-t{color:var(--signal)}
.shell-meta{grid-column:2;margin-top:2px;font-size:var(--fs-label);color:var(--ink-2)}
.shell-next{border-top-style:dashed;color:var(--ink-2)}
.shell-cur{display:inline-block;width:.6em;height:1.1em;margin-right:1ch;vertical-align:-.22em;background:var(--signal);animation:shell-blink 1.06s steps(1,end) infinite}
@keyframes shell-blink{50%{visibility:hidden}}
.shell-out{padding:0 0 8px 2ch;overflow-wrap:anywhere}
.shell-err{color:var(--ink-2)}
.shell-form{display:flex;align-items:center;padding-top:6px;border-top:1px solid var(--ink)}
/* the form carries the focus ring, so it wraps the $ as well as the text */
.shell-form:focus-within{outline:2px solid var(--signal);outline-offset:3px}
.shell-in{flex:1;min-width:0;min-height:44px;margin:0;padding:0;border:0;border-radius:0;background:none;font:inherit;color:inherit;caret-color:var(--signal)}
.shell-in:focus{outline:none}
.shell-in::placeholder{color:var(--ink-2);opacity:1}
@media (pointer:coarse){.shell-in{font-size:16px}} /* iOS zooms into anything smaller */
@media (max-width:640px){.shell-row{grid-template-columns:4ch minmax(0,1fr)}.shell-dir{display:block}}
@media (prefers-reduced-motion:reduce){.shell-cur{animation:none}}
`;

export default function Shell({ guides }: { guides: Guide[] }) {
  const router = useRouter();
  const list = [...guides].sort((a, b) => a.no.localeCompare(b.no)); // ls order: 001 first
  const [blocks, setBlocks] = useState<Block[]>([{ id: 0, cmd: PROMPT, out: "ls" }]);
  const seq = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const cursor = useRef(0);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = input.current;
    if (!el) return;
    const typed = el.value.trim();
    const r = interpret(typed || PROMPT, list);
    if (typed) history.current.push(typed);
    cursor.current = history.current.length;
    el.value = "";
    const id = ++seq.current;
    if (r.clear) setBlocks([]);
    else setBlocks((b) => [...b, { id, cmd: typed || PROMPT, out: r.out ?? [] }].slice(-KEEP));
    if (r.open) router.push(`/guides/${r.open}`);
    if (r.go) goto(r.go);
  }

  // up and down walk back through what was typed; Escape clears the line
  function recall(e: KeyboardEvent<HTMLInputElement>) {
    const h = history.current;
    const el = e.currentTarget;
    if (e.key === "Escape") {
      el.value = "";
      cursor.current = h.length;
      return;
    }
    if ((e.key !== "ArrowUp" && e.key !== "ArrowDown") || !h.length) return;
    e.preventDefault();
    cursor.current = Math.min(h.length, Math.max(0, cursor.current + (e.key === "ArrowUp" ? -1 : 1)));
    el.value = h[cursor.current] ?? "";
  }

  return (
    <div className="shell">
      <style href="tqt-shell" precedence="default">
        {CSS}
      </style>
      <div className="shell-log" role="log" aria-live="polite" aria-label="Shell output">
        {blocks.map((b) => (
          <div key={b.id} className="shell-block">
            <p className="shell-echo">
              <span className="shell-ps" aria-hidden="true">
                $
              </span>
              <span className="shell-cmd" data-m={b.id === 0 ? "sh-cmd" : undefined}>
                {b.cmd}
              </span>
            </p>
            {b.out === "ls" ? (
              <Listing list={list} />
            ) : (
              b.out.map((l, i) => (
                <p key={i} className={l.err ? "shell-out shell-err" : "shell-out"}>
                  {l.text}
                </p>
              ))
            )}
          </div>
        ))}
      </div>
      <form className="shell-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="sh-in">
          Shell
        </label>
        <span className="shell-ps" aria-hidden="true">
          $
        </span>
        <input
          ref={input}
          id="sh-in"
          className="shell-in"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          maxLength={64}
          placeholder={PROMPT}
          onKeyDown={recall}
        />
      </form>
    </div>
  );
}
