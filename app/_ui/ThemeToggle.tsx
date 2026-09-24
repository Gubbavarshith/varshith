"use client";

import { useLayoutEffect, useSyncExternalStore, type MouseEvent } from "react";

type Scheme = "light" | "dark";
const KEY = "theme";
const osDark = () => matchMedia("(prefers-color-scheme: dark)");

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = osDark();
  mq.addEventListener("change", cb);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", cb);
  };
}
const current = () =>
  (document.documentElement.dataset.theme as Scheme | undefined) ?? (osDark().matches ? "dark" : "light");

export default function ThemeToggle() {
  const scheme = useSyncExternalStore(subscribe, current, () => null);

  // Dev only: the strict-mode remount wipes the attribute the head script set.
  useLayoutEffect(() => {
    try {
      const t = localStorage.getItem(KEY);
      if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    } catch {}
  }, []);

  function pick(next: Scheme, e: MouseEvent<HTMLButtonElement>) {
    if (next === scheme) return;
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {}
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();

    const b = e.currentTarget.getBoundingClientRect();
    const x = b.left + b.width / 2;
    const y = b.top + b.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(
      () =>
        document.documentElement.animate(
          { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 560, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
        ),
      () => {},
    );
  }

  return (
    <div className="scheme" role="group" aria-label="Colour theme">
      <span className="scheme-key" aria-hidden="true">
        prefers-color-scheme:
      </span>
      {(["light", "dark"] as const).map((s) => (
        <button key={s} type="button" aria-pressed={scheme === s} onClick={(e) => pick(s, e)}>
          {s}
        </button>
      ))}
    </div>
  );
}
