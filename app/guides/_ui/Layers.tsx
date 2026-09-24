"use client";

import { useEffect, useRef, useState } from "react";

export type Part = { id: string; n?: string; label: string };

// Table of contents drawn as a design tool's layers panel; the layer you're reading is selected.
export default function Layers({ title, parts }: { title: string; parts: Part[] }) {
  const [active, setActive] = useState(parts[0].id);
  const list = useRef<HTMLOListElement>(null);

  // current = last section whose top has passed 30% of the screen; at the very bottom, the last one
  useEffect(() => {
    const els = parts.map((p) => document.getElementById(p.id)).filter((el) => el !== null);
    let raf = 0;
    const update = () => {
      raf = 0;
      const end = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      const el = end ? els.at(-1) : els.findLast((s) => s.getBoundingClientRect().top < innerHeight * 0.3);
      setActive((el ?? els[0]).id);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [parts]);

  // on phones the panel is a sideways strip: keep the current layer in view
  useEffect(() => {
    const ol = list.current!;
    const a = ol.querySelector<HTMLElement>('[aria-current="location"]');
    if (a && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.offsetLeft - 12, behavior: "smooth" });
  }, [active]);

  return (
    <nav className="layers" aria-label="Guide sections">
      <p className="layers-head">Layers</p>
      <p className="layers-root">{title}</p>
      <ol ref={list}>
        {parts.map((p) => (
          <li key={p.id}>
            <a href={`#${p.id}`} aria-current={active === p.id ? "location" : undefined}>
              <span className="layers-ico" aria-hidden="true">
                #
              </span>
              {p.n && <span className="layers-n">{p.n}</span>}
              <span>{p.label}</span>
            </a>
          </li>
        ))}
      </ol>
      <span className="layers-progress" aria-hidden="true" />
    </nav>
  );
}
