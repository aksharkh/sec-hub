"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Code, FrameworkChip } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Card, CardHead, PageHeader } from "@/components/ui/misc";
import { Tip } from "@/components/ui/overlay";
import { DOMAINS, FRAMEWORKS, FRAMEWORK_ORDER, UNIFIED } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { DomainId, FrameworkKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MappingPage() {
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const [cell, setCell] = useState<{ d: DomainId; f: FrameworkKey } | null>({ d: "access", f: "fedramp" });
  const [client, setClient] = useState("none");

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    UNIFIED.forEach((u) => (Object.keys(u.map) as FrameworkKey[]).forEach((f) => (m[`${u.domain}:${f}`] = (m[`${u.domain}:${f}`] ?? 0) + 1)));
    return m;
  }, []);
  const max = Math.max(...Object.values(counts));
  const perFw = FRAMEWORK_ORDER.map((f) => ({ f, n: UNIFIED.filter((u) => u.map[f]).length }));
  const widest = [...UNIFIED].sort((a, b) => Object.keys(b.map).length - Object.keys(a.map).length).slice(0, 5);
  const clientFws = new Set(engagements.filter((e) => e.clientId === client).map((e) => e.framework));
  const reuse = clientFws.size > 1 ? UNIFIED.filter((u) => [...clientFws].filter((f) => u.map[f]).length > 1).length : 0;
  const selected = cell ? UNIFIED.filter((u) => u.domain === cell.d && u.map[cell.f]) : [];

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Control mapping"
        description={`One SecureKnots control library of ${UNIFIED.length} controls, mapped to every framework. Each cell counts the library controls in a domain that a framework asks for; evidence for a control is collected once and counts everywhere it maps.`}
        actions={
          <Select
            size="sm"
            className="w-[230px]"
            value={client}
            onValueChange={setClient}
            options={[{ value: "none", label: "Highlight a client's frameworks" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
          />
        }
      />

      <AnimatePresence>
        {client !== "none" && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden text-[13px] text-ink-2">
            <span className="inline-block rounded-lg bg-brand-soft px-3 py-2 text-brand-ink">
              {clients.find((c) => c.id === client)?.name} is preparing for {clientFws.size} framework{clientFws.size === 1 ? "" : "s"}.{" "}
              {reuse > 0 ? <><b className="font-semibold">{reuse} library controls</b> count toward more than one of them, so their evidence is collected once.</> : "With one framework there is nothing to reuse yet."}
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[12.5px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 h-[88px] min-w-[180px] border-b border-line bg-surface pl-4 text-left align-bottom text-[12px] font-medium text-muted"><span className="block pb-2.5">Domain</span></th>
                  {FRAMEWORK_ORDER.map((f) => (
                    <th key={f} className={cn("border-b border-line px-1 pb-2 align-bottom transition-opacity", client !== "none" && !clientFws.has(f) && "opacity-30")}>
                      <span className="mx-auto block w-fit [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[12px] font-medium text-ink-2">{FRAMEWORKS[f].short}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOMAINS.map((d) => (
                  <tr key={d.id}>
                    <td className="sticky left-0 z-10 h-10 border-b border-line bg-surface pl-4 pr-3 font-medium text-ink-2">{d.name}</td>
                    {FRAMEWORK_ORDER.map((f) => {
                      const n = counts[`${d.id}:${f}`] ?? 0;
                      const on = cell?.d === d.id && cell.f === f;
                      const dim = client !== "none" && !clientFws.has(f);
                      return (
                        <td key={f} className="border-b border-line p-1 text-center">
                          {n > 0 ? (
                            <Tip content={`${d.name} · ${FRAMEWORKS[f].short}: ${n} control${n > 1 ? "s" : ""}`}>
                              <button
                                onClick={() => setCell({ d: d.id, f })}
                                className={cn(
                                  "tnum mx-auto grid h-8 w-full min-w-[34px] max-w-[52px] place-items-center rounded-md text-[12px] font-medium transition-[box-shadow,opacity,transform] hover:scale-[1.06]",
                                  on && "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--brand)]",
                                  dim && "opacity-25",
                                )}
                                style={{
                                  background: `color-mix(in oklab, var(--brand) ${18 + (n / max) * 70}%, var(--surface))`,
                                  color: n / max > 0.45 ? "var(--on-brand)" : "var(--brand-ink)",
                                }}
                              >
                                {n}
                              </button>
                            </Tip>
                          ) : (
                            <span className="mx-auto block h-8 max-w-[52px] rounded-md bg-subtle/60" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-raised">
                  <td className="sticky left-0 z-10 h-10 bg-raised pl-4 text-[12px] font-semibold text-ink">Library controls</td>
                  {perFw.map(({ f, n }) => <td key={f} className="tnum text-center text-[12.5px] font-semibold text-ink">{n}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-[11.5px] text-muted">
            Fewer
            <span className="flex h-2 w-28 overflow-hidden rounded-full">
              {[0.18, 0.35, 0.52, 0.7, 0.88].map((p) => <span key={p} className="flex-1" style={{ background: `color-mix(in oklab, var(--brand) ${p * 100}%, var(--surface))` }} />)}
            </span>
            More controls per domain
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead
              title={cell ? `${DOMAINS.find((d) => d.id === cell.d)?.name}` : "Pick a cell"}
              sub={cell ? <span className="flex items-center gap-1.5">Library controls mapped to <FrameworkChip fw={cell.f} size="sm" /></span> : "Click any number in the matrix"}
            />
            <ul className="px-2 pb-2">
              {selected.map((u) => (
                <li key={u.id} className="rounded-lg px-2 py-2.5 hover:bg-raised">
                  <p className="flex items-center gap-2 text-[13px]">
                    <Code className="rounded border border-line bg-subtle px-1 text-[11.5px]">{u.map[cell!.f]}</Code>
                    <span className="font-medium text-ink">{u.title}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(Object.entries(u.map) as [FrameworkKey, string][]).filter(([f]) => f !== cell!.f).map(([f, code]) => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-[11px] text-muted">
                        <span className="size-1.5 rounded-full" style={{ background: `hsl(${FRAMEWORKS[f].hue} 62% 52%)` }} />
                        {FRAMEWORKS[f].short} <span className="font-mono">{code}</span>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="Widest-reaching controls" sub="Collect this evidence once, satisfy the most frameworks" />
            <ul className="space-y-2.5 px-4 pb-4">
              {widest.map((u) => {
                const n = Object.keys(u.map).length;
                return (
                  <li key={u.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="truncate font-medium text-ink">{u.title}</span>
                      <span className="tnum shrink-0 text-muted">{n} frameworks</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle-2">
                      <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${(n / FRAMEWORK_ORDER.length) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
