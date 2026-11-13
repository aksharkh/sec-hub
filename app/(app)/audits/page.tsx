"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, CalendarRange, Users } from "lucide-react";
import { ClientMark } from "@/components/ui/avatar";
import { Badge, FrameworkChip } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/form";
import { Card, PageHeader, ProgressRing, Skeleton } from "@/components/ui/misc";
import { PBC, PBC_ORDER, PHASE, PHASE_ORDER } from "@/lib/audit";
import { TONE_CLASS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { AuditPhase } from "@/lib/types";
import { cn, dayLabel, daysUntil } from "@/lib/utils";

export default function AuditsPage() {
  const ready = useReady();
  const audits = useStore((s) => s.audits);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const [phase, setPhase] = useState<AuditPhase | "active">("active");

  const list = useMemo(() => audits.filter((a) => (phase === "active" ? a.phase !== "complete" : a.phase === phase)).sort((a, b) => a.start.localeCompare(b.start)), [audits, phase]);
  const allPbc = audits.filter((a) => a.phase !== "complete").flatMap((a) => a.pbc);

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Audits"
        description="Auditor coordination for every engagement: fieldwork windows, the auditor's document requests (PBC list), walkthrough meetings and samples. The auditor issues the report; SecureKnots keeps the requests moving."
        actions={<div className="no-scrollbar max-w-full overflow-x-auto"><Segmented value={phase} onChange={setPhase} options={[{ value: "active", label: "Active" }, ...PHASE_ORDER.map((p) => ({ value: p, label: PHASE[p].label }))]} /></div>}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {PBC_ORDER.map((s) => {
          const n = allPbc.filter((p) => p.status === s).length;
          return (
            <Card key={s} className="p-4">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted"><span className={cn("size-2 rounded-full", TONE_CLASS[PBC[s].tone].dot)} />{PBC[s].label}</p>
              <p className="tnum mt-2 text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink">{n}</p>
              <p className="mt-1.5 text-[11.5px] text-muted">auditor requests</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {!ready
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[230px] rounded-xl" />)
          : list.map((a, i) => {
              const c = clients.find((x) => x.id === a.clientId)!;
              const e = engagements.find((x) => x.id === a.engagementId)!;
              const accepted = a.pbc.filter((p) => p.status === "accepted").length;
              const pct = Math.round((accepted / a.pbc.length) * 100);
              const pi = PHASE_ORDER.indexOf(a.phase);
              const next = a.meetings.filter((m) => daysUntil(m.at) >= 0).sort((x, y) => x.at.localeCompare(y.at))[0];
              const follow = a.pbc.filter((p) => p.status === "followup").length;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/audits/${a.id}`} className="group block h-full">
                    <Card className="flex h-full flex-col p-4 transition-[border-color,box-shadow] group-hover:border-line-strong group-hover:shadow-sm">
                      <div className="flex items-start gap-3">
                        <ClientMark name={c.name} hue={c.hue} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{a.kind}</p>
                          <p className="truncate text-[12.5px] text-muted">{c.name} · {a.firm}</p>
                        </div>
                        <ProgressRing value={pct} size={40} />
                      </div>
                      <div className="mt-4 flex gap-1">
                        {PHASE_ORDER.map((p, k) => (
                          <div key={p} className="flex-1">
                            <div className={cn("h-1 rounded-full", k < pi || a.phase === "complete" ? "bg-ok-dot" : k === pi ? "bg-ink" : "bg-subtle-2")} />
                            <p className={cn("mt-1.5 text-[11px] font-medium", k === pi ? "text-ink" : "text-faint")}>{PHASE[p].label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        <FrameworkChip fw={e.framework} size="sm" />
                        <Badge tone={PHASE[a.phase].tone}>{PHASE[a.phase].label}</Badge>
                        {follow > 0 && <Badge tone="warn">{follow} follow-up{follow > 1 ? "s" : ""}</Badge>}
                      </div>
                      <div className="mt-auto space-y-1.5 pt-4 text-[12.5px] text-muted">
                        <p className="flex items-center gap-1.5"><CalendarRange className="size-3.5" />Fieldwork {dayLabel(a.start)} to {dayLabel(a.end)}</p>
                        {next && <p className="flex items-center gap-1.5"><Users className="size-3.5" />Next: {next.title}, {dayLabel(next.at)}</p>}
                      </div>
                      <p className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
                        <span className="tnum text-muted">{accepted} of {a.pbc.length} requests accepted</span>
                        <span className="flex items-center gap-1 font-medium text-ink-2 group-hover:text-ink">Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                      </p>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
