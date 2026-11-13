"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { CalendarClock, ChevronLeft, ChevronRight, ClipboardCheck, FileText, Inbox, Users } from "lucide-react";
import { ClientMark } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/form";
import { Card, PageHeader, Skeleton } from "@/components/ui/misc";
import { Tip } from "@/components/ui/overlay";
import { FRAMEWORKS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn, dayLabel } from "@/lib/utils";

type Ev = { at: Date; kind: "due" | "meeting" | "policy" | "request" | "target"; title: string; sub: string; href: string; hue?: number };

const KIND = {
  target: { label: "Target date", icon: CalendarClock, cls: "bg-ink text-surface" },
  meeting: { label: "Auditor meeting", icon: Users, cls: "bg-rev-soft text-rev" },
  request: { label: "Client request due", icon: Inbox, cls: "bg-warn-soft text-warn" },
  due: { label: "Controls due", icon: ClipboardCheck, cls: "bg-info-soft text-info" },
  policy: { label: "Policy review", icon: FileText, cls: "bg-neutral-soft text-neutral" },
};

const PHASES = [
  { key: "readiness", label: "Readiness & gap assessment", cls: "bg-subtle-2" },
  { key: "remediation", label: "Remediation", cls: "bg-ink/25 dark:bg-white/25" },
  { key: "audit", label: "Audit window", cls: "bg-ink dark:bg-white" },
];

function Timeline() {
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const today = new Date();
  const from = startOfMonth(addMonths(today, -2));
  const to = endOfMonth(addMonths(today, 6));
  const span = +to - +from;
  const x = (d: Date | string) => Math.min(100, Math.max(0, ((+new Date(d) - +from) / span) * 100));
  const months = Array.from({ length: 9 }, (_, i) => addMonths(from, i));
  const rows = engagements
    .map((e) => ({ e, c: clients.find((c) => c.id === e.clientId)! }))
    .filter((r) => r.c)
    .sort((a, b) => a.e.target.localeCompare(b.e.target));

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[240px_1fr] border-b border-line bg-raised">
            <div className="px-4 py-2.5 text-[12px] font-medium text-muted">Engagement</div>
            <div className="relative h-10">
              {months.map((m) => (
                <span key={+m} className="absolute top-0 flex h-full items-center border-l border-line pl-2 text-[12px] font-medium text-muted" style={{ left: `${x(m)}%` }}>
                  {format(m, "MMM")}
                  {m.getMonth() === 0 && <span className="ml-1 text-faint">{format(m, "yyyy")}</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-[240px] right-0">
              {months.map((m) => <span key={+m} className="absolute inset-y-0 border-l border-line/70" style={{ left: `${x(m)}%` }} />)}
              <span className="absolute inset-y-0 z-10 w-px bg-bad-dot" style={{ left: `${x(today)}%` }}>
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b-md bg-bad-dot px-1.5 py-0.5 text-[10px] font-semibold text-white">Today</span>
              </span>
            </div>
            {rows.map(({ e, c }, i) => {
              const target = new Date(e.target);
              const start = new Date(c.startedAt);
              const remStart = new Date(+target - 60 * 864e5);
              const auditStart = new Date(+target - 21 * 864e5);
              const end = new Date(+target + 14 * 864e5);
              const segs = [
                { p: PHASES[0], a: start, b: remStart },
                { p: PHASES[1], a: remStart, b: auditStart },
                { p: PHASES[2], a: auditStart, b: end },
              ].filter((s) => +s.b > +s.a);
              return (
                <div key={e.id} className="grid grid-cols-[240px_1fr] border-b border-line last:border-0 hover:bg-raised/60">
                  <Link href={`/clients/${c.id}/${e.framework}`} className="flex min-w-0 items-center gap-2.5 px-4 py-2.5">
                    <ClientMark name={c.name} hue={c.hue} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                      <span className="block truncate text-[11.5px] text-muted">{FRAMEWORKS[e.framework].short} · target {dayLabel(e.target)}</span>
                    </span>
                  </Link>
                  <div className="relative h-[52px]">
                    {segs.map((s, k) => (
                      <Tip key={k} content={`${s.p.label}: ${format(s.a, "MMM d")} to ${format(s.b, "MMM d")}`}>
                        <motion.span
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.03 * i + k * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className={cn("absolute top-1/2 h-3 origin-left -translate-y-1/2 rounded-full", s.p.cls)}
                          style={{ left: `calc(${x(s.a)}% + ${k ? 1 : 0}px)`, width: `calc(${x(s.b) - x(s.a)}% - ${k < segs.length - 1 ? 2 : 0}px)` }}
                        />
                      </Tip>
                    ))}
                    <Tip content={`Target: ${format(target, "MMM d, yyyy")}`}>
                      <span className="absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border-2 border-surface bg-ok-dot" style={{ left: `${x(target)}%` }} />
                    </Tip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[11.5px] text-muted">
        {PHASES.map((p) => <span key={p.key} className="flex items-center gap-1.5"><span className={cn("h-2 w-4 rounded-full", p.cls)} />{p.label}</span>)}
        <span className="flex items-center gap-1.5"><span className="size-2 rotate-45 rounded-[1px] bg-ok-dot" />Target date</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-bad-dot" />Today</span>
      </div>
    </Card>
  );
}

function Month() {
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const controls = useStore((s) => s.controls);
  const audits = useStore((s) => s.audits);
  const policies = useStore((s) => s.policies);
  const requests = useStore((s) => s.requests);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [sel, setSel] = useState(() => new Date());

  const events = useMemo(() => {
    const out: Ev[] = [];
    const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
    const hue = (id: string) => clients.find((c) => c.id === id)?.hue;
    engagements.forEach((e) => out.push({ at: new Date(e.target), kind: "target", title: `${FRAMEWORKS[e.framework].short} target`, sub: name(e.clientId), href: `/clients/${e.clientId}/${e.framework}`, hue: hue(e.clientId) }));
    audits.forEach((a) => a.meetings.forEach((m) => out.push({ at: new Date(m.at), kind: "meeting", title: m.title, sub: `${name(a.clientId)} · ${format(new Date(m.at), "h:mm a")}`, href: `/audits/${a.id}`, hue: hue(a.clientId) })));
    requests.filter((r) => r.status === "open").forEach((r) => out.push({ at: new Date(r.due), kind: "request", title: r.title, sub: name(r.clientId), href: `/clients/${r.clientId}`, hue: hue(r.clientId) }));
    policies.filter((p) => p.status === "approved").forEach((p) => out.push({ at: new Date(p.reviewDue), kind: "policy", title: `${p.title} review`, sub: name(p.clientId), href: `/policies/${p.id}`, hue: hue(p.clientId) }));
    const dueBy = new Map<string, number>();
    Object.values(controls).filter((c) => c.status !== "approved").forEach((c) => { const k = c.due.slice(0, 10); dueBy.set(k, (dueBy.get(k) ?? 0) + 1); });
    dueBy.forEach((n, k) => out.push({ at: new Date(`${k}T12:00:00`), kind: "due", title: `${n} control${n > 1 ? "s" : ""} due`, sub: "Across all clients", href: "/" }));
    return out;
  }, [clients, engagements, controls, audits, policies, requests]);

  const days = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(endOfMonth(cursor)) });
  const on = (d: Date) => events.filter((e) => isSameDay(e.at, d));
  const selected = on(sel).sort((a, b) => Object.keys(KIND).indexOf(a.kind) - Object.keys(KIND).indexOf(b.kind));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{format(cursor, "MMMM yyyy")}</p>
          <div className="flex items-center gap-1">
            <Button size="xs" variant="ghost" onClick={() => { setCursor(startOfMonth(new Date())); setSel(new Date()); }}>Today</Button>
            <Button size="icon-sm" variant="ghost" aria-label="Previous month" onClick={() => setCursor((c) => addMonths(c, -1))}><ChevronLeft /></Button>
            <Button size="icon-sm" variant="ghost" aria-label="Next month" onClick={() => setCursor((c) => addMonths(c, 1))}><ChevronRight /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-line bg-raised text-center text-[11.5px] font-medium text-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const ev = on(d);
            const picked = isSameDay(d, sel);
            return (
              <button
                key={+d}
                onClick={() => setSel(d)}
                className={cn("relative min-h-[92px] border-b border-r border-line p-1.5 text-left transition-colors [&:nth-child(7n)]:border-r-0", !isSameMonth(d, cursor) && "bg-raised/60", picked ? "bg-brand-soft/60" : "hover:bg-raised")}
              >
                <span className={cn("tnum inline-grid size-6 place-items-center rounded-full text-[12px]", isToday(d) ? "bg-ink font-semibold text-surface" : isSameMonth(d, cursor) ? "text-ink" : "text-faint")}>{format(d, "d")}</span>
                <span className="mt-1 block space-y-0.5">
                  {ev.slice(0, 3).map((e, i) => (
                    <span key={i} className={cn("block truncate rounded-[5px] px-1.5 py-px text-[10.5px] font-medium", KIND[e.kind].cls)}>{e.kind === "due" ? e.title : `${e.title}`}</span>
                  ))}
                  {ev.length > 3 && <span className="block px-1 text-[10.5px] text-faint">+{ev.length - 3} more</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="h-fit">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[14px] font-semibold text-ink">{format(sel, "EEEE, MMMM d")}</p>
          <p className="text-[12px] text-muted">{selected.length ? `${selected.length} item${selected.length > 1 ? "s" : ""}` : "Nothing scheduled"}</p>
        </div>
        <ul className="p-2">
          {selected.map((e, i) => {
            const K = KIND[e.kind];
            return (
              <li key={i}>
                <Link href={e.href} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-raised">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", K.cls)}><K.icon className="size-3.5" /></span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium leading-5 text-ink">{e.title}</span>
                    <span className="block text-[12px] text-muted">{K.label} · {e.sub}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line px-4 py-3">
          {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => <span key={k} className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className={cn("size-2 rounded-[3px]", KIND[k].cls)} />{KIND[k].label}</span>)}
        </div>
      </Card>
    </div>
  );
}

export default function CalendarPage() {
  const ready = useReady();
  const [view, setView] = useState<"timeline" | "month">("timeline");
  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Calendar"
        description="Every engagement from kickoff to certification, with control deadlines, client requests, auditor meetings and policy reviews in one view."
        actions={<Segmented value={view} onChange={setView} options={[{ value: "timeline", label: "Timeline" }, { value: "month", label: "Month" }]} />}
      />
      <div className="mt-6">{!ready ? <Skeleton className="h-[520px] rounded-xl" /> : view === "timeline" ? <Timeline /> : <Month />}</div>
    </div>
  );
}
