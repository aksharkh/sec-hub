"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Tip } from "@/components/ui/overlay";
import { STATUS, TONE_CLASS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { ControlStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const SERIES: ControlStatus[] = ["in_progress", "client", "review", "revise"];

/** Open work per person, stacked by status. Status colors carry state and are labeled in the legend. */
export function Workload() {
  const members = useStore((s) => s.members);
  const controls = useStore((s) => s.controls);
  const rows = useMemo(() => {
    const list = Object.values(controls);
    return members
      .filter((m) => ["lead", "consultant"].includes(m.role))
      .map((m) => {
        const mine = list.filter((c) => c.ownerId === m.id);
        const parts = SERIES.map((s) => ({ s, n: mine.filter((c) => c.status === s).length }));
        return { m, parts, total: parts.reduce((a, p) => a + p.n, 0) };
      })
      .sort((a, b) => b.total - a.total);
  }, [members, controls]);
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="px-4 pb-4">
      <ul className="space-y-3">
        {rows.map(({ m, parts, total }) => (
          <li key={m.id} className="grid grid-cols-[112px_1fr_28px] items-center gap-3">
            <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-ink-2">
              <Avatar person={m} size="xs" />
              <span className="truncate">{m.name.split(" ")[0]}</span>
            </span>
            <span className="flex h-2.5 gap-[2px]" style={{ width: `${(total / max) * 100}%` }}>
              {parts.filter((p) => p.n).map((p) => (
                <Tip key={p.s} content={`${m.name.split(" ")[0]} · ${STATUS[p.s].label}: ${p.n}`}>
                  <span className={cn("block h-full rounded-[3px] transition-[filter] hover:brightness-110", TONE_CLASS[STATUS[p.s].tone].dot)} style={{ flexGrow: p.n, flexBasis: 0 }} />
                </Tip>
              ))}
            </span>
            <span className="tnum text-right text-[12px] font-medium text-ink">{total}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3">
        {SERIES.map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <span className={cn("size-2 rounded-[2px]", TONE_CLASS[STATUS[s].tone].dot)} />
            {STATUS[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
