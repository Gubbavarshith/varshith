"use client";

import { useEffect, useRef } from "react";

// Without motion the browser's tabs just switch pages on click. With motion, app/_motion/deck.ts drives the
// browser from the scroll and handles the tabs itself.
export default function BrowserSwitch() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bw = ref.current?.closest<HTMLElement>("[data-m=browser]");
    if (!bw || document.documentElement.classList.contains("motion")) return;
    const tabs = Array.from(bw.querySelectorAll<HTMLElement>("[data-m=tab]"));
    const pages = Array.from(bw.querySelectorAll<HTMLElement>("[data-m=page]")).slice(1); // page 0 is the new tab
    const omni = bw.querySelector<HTMLAnchorElement>("[data-m=omni]");
    const url = bw.querySelector<HTMLElement>("[data-m=url]");

    const show = (k: number) => {
      tabs.forEach((t, i) => {
        t.classList.toggle("is-on", i === k);
        t.setAttribute("aria-pressed", String(i === k));
      });
      pages.forEach((p, i) => p.classList.toggle("is-on", i === k));
      const page = pages[k];
      if (url) url.textContent = page.dataset.url ?? "";
      if (!omni) return;
      if (page.dataset.href) omni.href = page.dataset.href;
      else omni.removeAttribute("href");
    };
    const onClick = (e: Event) => show(tabs.indexOf(e.currentTarget as HTMLElement));
    tabs.forEach((t) => t.addEventListener("click", onClick));
    return () => tabs.forEach((t) => t.removeEventListener("click", onClick));
  }, []);

  return <span ref={ref} hidden />;
}
