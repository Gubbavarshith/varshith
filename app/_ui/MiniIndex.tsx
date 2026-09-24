"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type MouseEvent } from "react";
import { FRONT, MINI_LIT, MINI_TARGET, SHEETS, SIDE, type SheetId } from "../_data/word";
import { onSheet, store } from "../_motion/store";

// The name as a chapter list. Each letter holds its FRONT face and, a quarter turn under it, its SIDE face
// (globals.css builds the drum). On home the runtime rolls a letter over once its solid has turned.

const LABEL = ["V: rain", "A: AI in the middle", "VAR: declared", "S: shell", "H: shell", "I: cursor", "T: type", "H: home"];

const none = () => () => {};
const litOf = (sheet: number) => (sheet < 0 ? [] : MINI_LIT[sheet >= SHEETS.length ? "end" : SHEETS[sheet].id]);

export default function MiniIndex() {
  const home = usePathname() === "/";
  // only the home page tracks sheets; elsewhere nothing is lit
  const sheet = useSyncExternalStore(home ? onSheet : none, () => (home ? store.sheet : -1), () => -1);
  const lit = litOf(sheet);
  const here = sheet >= 0 && sheet < SHEETS.length ? SHEETS[sheet].id : null;

  // on home the runtime scrolls there itself and cancels the event; without it, the hash link does the work
  const go = (id: SheetId) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!home || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.dispatchEvent(new CustomEvent("tqt:goto", { detail: id, cancelable: true }))) e.preventDefault();
  };

  return (
    <nav className="mi" aria-label="Chapters">
      {Array.from(FRONT, (ch, i) => {
        const id = MINI_TARGET[i];
        return (
          <Link
            key={i}
            className="mi-l"
            href={home ? `#${id}` : `/#${id}`}
            aria-label={LABEL[i]}
            aria-current={id === here ? "location" : undefined}
            data-mi={i}
            data-lit={lit.includes(i) ? "true" : undefined}
            onClick={go(id)}
          >
            <span aria-hidden="true">{ch}</span>
            <span aria-hidden="true">{SIDE[i]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
