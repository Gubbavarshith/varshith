// The word model: which letters show, how, and in what order they change.
// No imports and erasable-only TypeScript (no enums, no parameter properties), because Node strips the
// types and runs this file directly from scripts/type/build.mjs and scripts/type/guard.test.mjs.

export const FRONT = "VARSHITH";
export const SIDE = "SHIPPING"; // one-line swap to "BUILDING" (also keeps I at slot 5), then `npm run type:build`

export type SheetId = "v" | "turn" | "var" | "ai" | "sh" | "t" | "i";
export const SHEETS: { id: SheetId; no: string; title: string }[] = [
  { id: "v", no: "01", title: "Rain" },
  { id: "turn", no: "02", title: "Quarter turn" },
  { id: "var", no: "03", title: "Declared" },
  { id: "ai", no: "04", title: "The middle" },
  { id: "sh", no: "05", title: "Shell" },
  { id: "t", no: "06", title: "Type" },
  { id: "i", no: "07", title: "Cursor, home" },
];

// mini index: where each letter links, and which letters light up on each sheet
export const MINI_TARGET: SheetId[] = ["v", "ai", "var", "sh", "sh", "i", "t", "i"];
export const MINI_LIT: Record<SheetId | "end", number[]> = {
  v: [0],
  turn: [0, 1, 2, 3, 4, 5, 6, 7],
  var: [0, 1, 2],
  ai: [1, 5],
  sh: [3, 4],
  t: [6],
  i: [5, 7],
  end: [0, 1, 2, 3, 4, 5, 6, 7],
};
export const PEEKABLE = [0, 1, 3, 4, 5, 6]; // never 2 or 7: a turning neighbour isolates "SHITH" / "VARSHIT"
export const PEEK_END = [7]; // only in the END state (the parked H turns to G)

export type Face = "front" | "side" | "turning";
export type Presence = "solid" | "ghost" | "hidden";
export type Tone = "ink" | "signal";
export type Vis = { face: Face; presence: Presence; tone: Tone; group: string };
export type Word = Vis[]; // length 8

const W = (f: (i: number) => Partial<Vis>): Word =>
  Array.from({ length: 8 }, (_, i) => ({ face: "front", presence: "solid", tone: "ink", group: "word", ...f(i) }));
const only = (keep: number[], v: Partial<Vis>) => W((i) => (keep.includes(i) ? v : { presence: "hidden" }));

export const STATES = {
  REST: W(() => ({})),
  SHIP: W(() => ({ face: "side", tone: "signal" })),
  VAR: W((i) => (i < 3 ? { tone: "signal", group: "var" } : { presence: "hidden" })),
  AI: only([1, 5], { tone: "signal", group: "ai" }),
  SH: only([3, 4], { group: "sh" }),
  OUTLINE: W(() => ({ presence: "ghost" })),
  END: W((i) => (i === 5 ? { group: "caret" } : i === 7 ? { group: "park" } : { presence: "hidden" })),
} satisfies Record<string, Word>;
export type StateName = keyof typeof STATES;

export type Transition = { from: StateName; to: StateName; order: number[]; kind: "turn" | "step" | "together" | "drain" };
export const TRANSITIONS = {
  quarterTurn: { from: "REST", to: "SHIP", order: [5, 4, 6, 3, 7, 2, 1, 0], kind: "turn" }, // wave from the I
  turnBack: { from: "SHIP", to: "REST", order: [0, 1, 2, 3, 7, 4, 6, 5], kind: "turn" }, // the I lands last
  toVar: { from: "REST", to: "VAR", order: [0, 1, 2, 3, 4, 5, 6, 7], kind: "step" }, // tint V A R, then forward-delete S H I T H
  fromVar: { from: "VAR", to: "REST", order: [7, 6, 5, 4, 3, 2, 1, 0], kind: "step" },
  toAI: { from: "REST", to: "AI", order: [6, 3, 4, 2, 0, 7, 1, 5], kind: "step" }, // T leaves first
  fromAI: { from: "AI", to: "REST", order: [5, 1, 7, 0, 2, 4, 3, 6], kind: "step" }, // T returns last
  toSH: { from: "REST", to: "SH", order: [6, 5, 0, 1, 2, 7, 3, 4], kind: "step" },
  fromSH: { from: "SH", to: "REST", order: [4, 3, 7, 2, 1, 0, 5, 6], kind: "step" },
  toOutline: { from: "REST", to: "OUTLINE", order: [0, 1, 2, 3, 4, 5, 6, 7], kind: "together" },
  fromOutline: { from: "OUTLINE", to: "REST", order: [0, 1, 2, 3, 4, 5, 6, 7], kind: "together" },
  drain: { from: "REST", to: "END", order: [6, 3, 0, 1, 2, 4, 5, 7], kind: "drain" }, // T, S first
} satisfies Record<string, Transition>;

const level = (v: Vis) =>
  v.presence === "hidden" ? 0 : v.presence === "ghost" || v.face === "turning" ? 1 : v.tone === "ink" ? 2 : 3;
const key = (v: Vis) => `${level(v)}|${v.group}`;

/** true = this frame reads S-H-I-T as its own unit. Must never be true. */
export function isolatesRun(w: Word): boolean {
  const run = [3, 4, 5, 6];
  if (!run.every((i) => w[i].face === "front" && level(w[i]) > 0)) return false; // run broken or turned
  if (new Set(run.map((i) => key(w[i]))).size > 1) return false; // run not styled alike
  if (level(w[3]) < Math.max(...w.map(level))) return false; // run is de-emphasised
  return [2, 7].some((i) => key(w[i]) !== key(w[3])); // a neighbour breaks away
}

/**
 * Every word a transition passes through, in time order. Slots flip in `order`; a slot mid-flip is
 * face "turning" for kind "turn" and presence "ghost" otherwise. With the default `overlap` of 1 that is
 * from, order[0] mid, order[0] landed, order[1] mid, …, to: the settled frames between two step starts
 * are real frames too, so they are included. "together" flips all eight at once: from, all mid, to.
 *
 * `overlap` is how many slots may be mid-flip at once. Equal-duration tweens that start in `order` keep
 * the slots in flight consecutive in `order`, so `overlap = 8` covers every frame a continuous,
 * overlapping transition can show.
 */
export function stepsOf(t: Transition, overlap = 1): Word[] {
  const from = STATES[t.from];
  const to = STATES[t.to];
  const mid = (i: number): Vis => {
    const base = from[i].presence === "hidden" ? to[i] : from[i]; // a letter fading in is seen in its landing style
    return t.kind === "turn" ? { ...base, face: "turning" } : { ...base, presence: "ghost" };
  };
  if (t.kind === "together") return [from, from.map((_, i) => mid(i)), to];

  const rank = from.map((_, i) => t.order.indexOf(i));
  // order[0..a) landed at `to`, order[a..b) mid-flip, order[b..8) still at `from`
  const frame = (a: number, b: number): Word => from.map((v, i) => (rank[i] < a ? to[i] : rank[i] < b ? mid(i) : v));
  const words: Word[] = [];
  for (let s = 0; s <= 16; s++) {
    // a + b = s moves forward in time; b - a slots are in flight
    for (let a = Math.floor(s / 2); a >= 0 && a >= s - 8 && s - 2 * a <= overlap; a--) words.push(frame(a, s - a));
  }
  return words;
}
