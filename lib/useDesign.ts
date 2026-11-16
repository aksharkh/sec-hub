"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { designOf, type DesignId } from "./designs";

const subscribe = (cb: () => void) => {
  window.addEventListener("sk:design", cb);
  return () => window.removeEventListener("sk:design", cb);
};

export function useDesign() {
  const id = useSyncExternalStore(subscribe, () => document.documentElement.dataset.design ?? "meridian", () => "meridian");
  return designOf(id);
}

/**
 * Switch the whole app to another design. Forced light/dark looks set the theme too.
 * Uses the View Transitions API for a circular reveal from the point that was clicked.
 */
export function applyDesign(id: DesignId, setTheme: (t: string) => void, origin?: { x: number; y: number }) {
  const d = designOf(id);
  const run = () => {
    document.documentElement.dataset.design = id;
    if (d.scheme !== "both") {
      document.documentElement.classList.toggle("dark", d.scheme === "dark");
      setTheme(d.scheme);
    }
    try { localStorage.setItem("sk-design", id); } catch {}
    window.dispatchEvent(new Event("sk:design"));
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    run();
    return;
  }
  const x = origin?.x ?? window.innerWidth - 120;
  const y = origin?.y ?? 26;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const t = doc.startViewTransition(() => flushSync(run));
  t.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
}
