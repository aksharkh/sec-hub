"use client";

import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/form";
import { forecast } from "@/lib/ai";
import { FRAMEWORKS } from "@/lib/catalog";
import type { Client, Control, Engagement } from "@/lib/types";
import { cn, dayLabel } from "@/lib/utils";
import { useState } from "react";

export function ForecastCard({ client, engagements, controls }: { client: Client; engagements: Engagement[]; controls: Control[] }) {
  const [eid, setEid] = useState(engagements[0]?.id);
  const e = engagements.find((x) => x.id === eid) ?? engagements[0];
  if (!e) return null;
  const f = forecast(controls.filter((c) => c.engagementId === e.id), e, client.startedAt);
  const t0 = new Date(f.start).getTime();
  const now = f.now;
  const tp = f.early ? f.now : new Date(f.projected).getTime();
  const tt = new Date(e.target).getTime();
  const t1 = Math.max(tp, tt) + 14 * 864e5;
  const W = 600;
  const H = 180;
  const X = (t: number) => 30 + ((t - t0) / (t1 - t0)) * (W - 50);
  const Y = (v: number) => H - 20 - (v / f.total) * (H - 40);
  const steps = 18;
  const actual = Array.from({ length: steps + 1 }, (_, i) => {
    const p = i / steps;
    return [X(t0 + p * (now - t0)), Y(f.done * Math.pow(p, 1.35))] as const;
  });
  const path = actual.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const done = f.done >= f.total;
  const show = !done && !f.early;
  const late = f.slack < 0 && !f.early;
  const daysLeft = Math.max(1, (tt - now) / 864e5);
  const needed = (f.total - f.done) / daysLeft;
  const extraPerWeek = Math.max(0, Math.ceil((needed - f.pace) * 7));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 px-4 pb-1 pt-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink"><TrendingUp className="size-4 text-muted" />Readiness forecast</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">Projected from the current approval pace. Updates as controls are approved.</p>
        </div>
        {engagements.length > 1 && (
          <Segmented size="xs" value={e.id} onChange={setEid} options={engagements.map((x) => ({ value: x.id, label: FRAMEWORKS[x.framework].short }))} />
        )}
      </div>
      <div className="px-4">
        <p className="mt-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {done ? "Audit-ready: every control is approved" : f.early ? "Too early to forecast" : <>Projected audit-ready <span className="serif text-[20px] font-normal">{dayLabel(f.projected)}</span></>}
          {!done && !f.early && (
            <span className={cn("ml-2 rounded-full px-2 py-0.5 align-middle text-[11.5px] font-semibold", late ? "bg-bad-soft text-bad" : "bg-ok-soft text-ok")}>
              {late ? `${-f.slack} days after target` : `${f.slack} days before target`}
            </span>
          )}
        </p>
        {f.early && !done && <p className="mt-1 text-[12.5px] text-ink-2">Fewer than 10% of controls are approved. A projection appears once there is enough approval history.</p>}
        {!done && late && !f.early && (
          <p className="mt-1 text-[12.5px] text-ink-2">To hit {dayLabel(e.target)}, approve about <b className="tnum">{extraPerWeek}</b> more control{extraPerWeek === 1 ? "" : "s"} a week. Clearing the client&apos;s open requests is the fastest lever.</p>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-[180px] w-full" role="img" aria-label="Approved controls over time with projection">
        {[0, 0.5, 1].map((p) => <line key={p} x1="30" x2={W - 20} y1={Y(p * f.total)} y2={Y(p * f.total)} stroke="var(--line)" strokeDasharray="2 4" />)}
        {/* projection band */}
        {show && <path d={`M${X(now)} ${Y(f.done)} L${X(tp - 10 * 864e5)} ${Y(f.total)} L${X(tp + 12 * 864e5)} ${Y(f.total)} Z`} fill="var(--brand)" opacity="0.07" />}
        <motion.path d={path} fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
        {show && <motion.line x1={X(now)} y1={Y(f.done)} x2={X(tp)} y2={Y(f.total)} stroke="var(--brand)" strokeWidth="2" strokeDasharray="5 5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />}
        {/* target */}
        <line x1={X(tt)} x2={X(tt)} y1="14" y2={H - 20} stroke={late ? "var(--bad-dot)" : "var(--ok-dot)"} strokeWidth="1.5" />
        <text x={X(tt)} y="11" textAnchor="middle" className="fill-muted text-[10px]">Target {dayLabel(e.target)}</text>
        {/* today */}
        <circle cx={X(now)} cy={Y(f.done)} r="5" fill="var(--ink)" stroke="var(--surface)" strokeWidth="2" />
        <text x={X(now) + 8} y={Y(f.done) + 14} className="tnum fill-ink text-[10.5px] font-semibold">{f.done}/{f.total} today</text>
        {show && <circle cx={X(tp)} cy={Y(f.total)} r="4.5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />}
        <text x="30" y={H - 4} className="fill-faint text-[10px]">Kickoff {dayLabel(f.start)}</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-ink" />Approved so far</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-brand" />Projection</span>
        <span className="tnum">Pace: {(f.pace * 7).toFixed(1)} controls a week</span>
      </div>
    </Card>
  );
}
