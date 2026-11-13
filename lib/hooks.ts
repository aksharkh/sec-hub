"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useStore } from "./store";
import type { Control } from "./types";

export const useReady = () => useStore((s) => s.ready);

/** All controls as an array (memoized on the store map). */
export function useControlList(filter?: (c: Control) => boolean) {
  const controls = useStore((s) => s.controls);
  return useMemo(() => {
    const all = Object.values(controls);
    return filter ? all.filter(filter) : all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);
}

export function useClient(id: string | undefined) {
  const clients = useStore((s) => s.clients);
  return useMemo(() => clients.find((c) => c.id === id), [clients, id]);
}

export function useGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ───────── URL query without a Suspense boundary ───────── */
let historyPatched = false;
/** Client-side navigations change the URL through pushState/replaceState, which fire no event; announce them. */
function patchHistory() {
  if (historyPatched) return;
  historyPatched = true;
  (["pushState", "replaceState"] as const).forEach((k) => {
    const original = window.history[k];
    window.history[k] = function (this: History, ...args: Parameters<History["pushState"]>) {
      const result = original.apply(this, args);
      queueMicrotask(() => window.dispatchEvent(new Event("sk:query")));
      return result;
    };
  });
}

const subscribeQuery = (cb: () => void) => {
  patchHistory();
  window.addEventListener("popstate", cb);
  window.addEventListener("sk:query", cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener("sk:query", cb);
  };
};

/** Current query string, kept in sync with setQuery below. */
export function useQuery() {
  const search = useSyncExternalStore(subscribeQuery, () => window.location.search, () => "");
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** Replace one query parameter without a navigation. */
export function setQuery(name: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  window.history.replaceState(window.history.state, "", url);
}
