// The S-H-I-T guard (spec §5). Slots 3–6 of VARSHITH spell S-H-I-T, so no state, transition frame, peek
// or mini-index state may ever let that run read as its own unit. `npm test` runs this.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FRONT, SIDE, SHEETS, MINI_TARGET, MINI_LIT, PEEKABLE, PEEK_END, STATES, TRANSITIONS, isolatesRun, stepsOf,
} from "../../app/_data/word.ts";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url));
const glyphs = JSON.parse(read("app/_data/glyphs.json"));

const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7];
const REST = STATES.REST;
const set = (w, i, v) => w.map((x, k) => (k === i ? { ...x, ...v } : x));
const lit = (slots) => SLOTS.map((i) => ({ ...REST[i], tone: slots.includes(i) ? "signal" : "ink" }));
// frame as text for failure messages: _ hidden, ~ turning, lowercase ghost, side letters once turned
const show = (w) =>
  w
    .map((v, i) => {
      if (v.presence === "hidden") return "_";
      if (v.face === "turning") return "~";
      const ch = v.face === "side" ? SIDE[i] : FRONT[i];
      return v.presence === "ghost" ? ch.toLowerCase() : ch;
    })
    .join("");
const safe = (words, what) => {
  for (const [n, w] of words.entries()) assert.equal(isolatesRun(w), false, `${what} frame ${n} (${show(w)}) isolates S-H-I-T`);
};

// 1. nothing the site can show isolates the run
test("no state isolates the run", () => {
  for (const [name, w] of Object.entries(STATES)) {
    assert.equal(w.length, 8, `${name} has ${w.length} slots`);
    safe([w], name);
  }
});

test("no transition frame isolates the run", () => {
  for (const [name, t] of Object.entries(TRANSITIONS)) safe(stepsOf(t), name);
});

// A turning slot is a 3D block whatever its tone and a draining one is only sand, so for those kinds the
// mid-flip model is exact and every overlap of in-flight slots is checked. ("ghost" overstates a tint,
// so step transitions are checked as discrete steps.)
test("no overlapping turn or drain frame isolates the run", () => {
  for (const [name, t] of Object.entries(TRANSITIONS)) if (t.kind === "turn" || t.kind === "drain") safe(stepsOf(t, 8), `${name} (overlap)`);
});

test("stepsOf walks from → to one slot at a time", () => {
  for (const [name, t] of Object.entries(TRANSITIONS)) {
    const words = stepsOf(t);
    assert.deepEqual(words[0], STATES[t.from], `${name} starts at ${t.from}`);
    assert.deepEqual(words.at(-1), STATES[t.to], `${name} ends at ${t.to}`);
    if (t.kind === "together") {
      assert.equal(words.length, 3, `${name}: from, all mid, to`);
      continue;
    }
    assert.equal(words.length, 17, `${name}: from, then a mid and a landed frame per slot`);
    for (let k = 1; k < words.length; k++) {
      const changed = SLOTS.filter((i) => JSON.stringify(words[k][i]) !== JSON.stringify(words[k - 1][i]));
      assert.ok(changed.length <= 1, `${name} frame ${k} changes slots ${changed}`);
      if (changed.length) assert.equal(changed[0], t.order[(k - 1) >> 1], `${name} frame ${k} is out of order`);
    }
    assert.equal(stepsOf(t, 8).length, 45, `${name}: every (landed, in flight) split`);
  }
});

test("no mini-index state isolates the run", () => {
  for (const [sheet, slots] of Object.entries(MINI_LIT)) safe([lit(slots)], `MINI_LIT.${sheet}`);
});

test("no hero peek isolates the run", () => {
  for (const i of PEEKABLE) safe([set(REST, i, { face: "turning" })], `peek on ${i} ${FRONT[i]}`);
});

// 2. the parked H may turn to G, but only once the word has drained
test("PEEK_END is safe in END", () => {
  for (const i of PEEK_END) {
    assert.notEqual(STATES.END[i].presence, "hidden", `slot ${i} is hidden in END, nothing to peek`);
    safe([set(STATES.END, i, { face: "turning" })], `END peek on ${i}`);
  }
});

// 3.
test("every transition order is a permutation of 0..7", () => {
  for (const [name, t] of Object.entries(TRANSITIONS)) {
    assert.deepEqual([...t.order].sort((a, b) => a - b), SLOTS, `${name} order ${t.order}`);
    assert.ok(t.from in STATES && t.to in STATES, `${name} names an unknown state`);
  }
});

// 4.
test("the I is an I from both sides", () => {
  assert.equal(FRONT.length, 8);
  assert.equal(SIDE.length, 8);
  assert.equal(FRONT[5], "I");
  assert.equal(SIDE[5], "I");
});

// 5.
test("both words use only the font's characters", () => {
  for (const ch of FRONT + SIDE) assert.ok(glyphs.charset.includes(ch), `"${ch}" is not in the charset`);
});

test("the generated geometry matches word.ts (run npm run type:build after changing a word)", () => {
  const bin = read("public/type/solids.bin");
  assert.equal(bin.toString("latin1", 0, 4), "TQT1");
  assert.equal(bin.toString("latin1", 8, 16), FRONT, "solids.bin FRONT");
  assert.equal(bin.toString("latin1", 16, 24), SIDE, "solids.bin SIDE");
  assert.ok(FRONT in glyphs.facts.nodes && SIDE in glyphs.facts.nodes, "glyphs.json facts.nodes");
});

test("sheet data is coherent", () => {
  assert.equal(MINI_TARGET.length, 8);
  const ids = SHEETS.map((s) => s.id);
  for (const id of MINI_TARGET) assert.ok(ids.includes(id), `MINI_TARGET names unknown sheet ${id}`);
  assert.deepEqual(Object.keys(MINI_LIT).sort(), [...ids, "end"].sort());
});

// 6. negative controls: the guard is not vacuous, and it catches the concept's three original failures
test("negative controls isolate the run", () => {
  const isolates = (w, what) => assert.equal(isolatesRun(w), true, `${what} (${show(w)}) should isolate`);
  isolates(set(REST, 7, { presence: "hidden" }), "REST without slot 7: VARSHIT");
  isolates(set(REST, 2, { presence: "hidden" }), "REST without slot 2: SHITH");
  isolates(set(REST, 2, { face: "turning" }), "REST with slot 2 turning");
  isolates(set(REST, 7, { face: "turning" }), "REST with slot 7 turning");

  const some = (t, overlap, what) => assert.ok(stepsOf(t, overlap).some(isolatesRun), `${what} should isolate somewhere`);
  some({ from: "REST", to: "SHIP", order: SLOTS, kind: "turn" }, 8, "a left-to-right quarter turn");
  some({ from: "REST", to: "END", order: [...SLOTS].reverse(), kind: "drain" }, 1, "a backspace exit");
});
