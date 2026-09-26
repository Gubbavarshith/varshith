"use client";

import { useEffect, useRef } from "react";

// A build's preview, drawn live rather than as a screenshot: the static copy of its page in public/previews,
// cut to its first screen (everything after the hero is below it) and scaled into the card. It loads when the
// card nears the viewport; in the pinned deck the cards away from the current one are display:none, so only
// the neighbours load.

const W = 1440; // the width every preview is designed at

const pages = new Map<string, Promise<string>>();

function firstScreen(file: string): Promise<string> {
  let page = pages.get(file);
  if (!page) {
    const url = new URL(`/previews/${file}`, location.href);
    page = fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${url}: ${r.status}`))))
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll("script").forEach((s) => s.remove());
        const hero = doc.querySelector('[data-part="hero"]');
        for (let el = hero; el && el !== doc.body && !el.matches(".preview"); el = el.parentElement) {
          while (el.nextElementSibling) el.nextElementSibling.remove();
        }
        const base = doc.createElement("base");
        base.href = url.href; // its img/… paths resolve beside the file
        doc.head.prepend(base);
        const style = doc.createElement("style");
        style.textContent = "html,body{margin:0;overflow:hidden}";
        doc.head.append(style);
        return `<!doctype html>${doc.documentElement.outerHTML}`;
      });
    page.catch(() => pages.delete(file)); // a failed fetch may retry on the next mount
    pages.set(file, page);
  }
  return page;
}

export default function Preview({ file, name }: { file: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    let frame: HTMLIFrameElement | null = null;
    let live = true;

    const fit = () => box.style.setProperty("--k", String(box.clientWidth / W));
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        firstScreen(file).then(
          (html) => {
            if (!live) return;
            frame = document.createElement("iframe");
            frame.title = `${name}, preview`;
            frame.tabIndex = -1;
            frame.setAttribute("aria-hidden", "true");
            frame.setAttribute("sandbox", "allow-same-origin"); // no scripts, and none are needed
            frame.addEventListener("load", () => box.classList.add("is-in"), { once: true });
            frame.srcdoc = html;
            box.append(frame);
          },
          () => box.classList.add("is-off"),
        );
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(box);

    return () => {
      live = false;
      io.disconnect();
      ro.disconnect();
      frame?.remove();
      box.classList.remove("is-in", "is-off");
    };
  }, [file, name]);

  return <div ref={ref} className="mf-pv" />;
}
