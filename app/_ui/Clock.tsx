"use client";

import { useSyncExternalStore } from "react";

// Local time in Mahbubnagar. The server can't know the visitor's clock, so it renders --:-- and the first
// client render fills it in; minute precision means a 15s poll is never more than 15s stale.
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 15_000);
  return () => clearInterval(id);
};
const now = () => fmt.format(new Date());
const unknown = () => "--:--";

export default function Clock() {
  const t = useSyncExternalStore(subscribe, now, unknown);
  const [h, m] = t.split(":");
  const known = h !== "--";
  return (
    <time className="clock" dateTime={known ? t : undefined}>
      {h}
      {/* blinks once a second in CSS, only when motion is welcome */}
      <span className={known ? "clock-c" : undefined}>:</span>
      {m}
    </time>
  );
}
