"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { ReadinessViz } from "@/components/charts/ReadinessViz";
import { openNewClient } from "@/components/clients/NewClientWizard";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { Workload } from "@/components/home/Workload";
import { Avatar, AvatarStack, ClientMark } from "@/components/ui/avatar";
import { Badge, Code, FrameworkChip, Kbd } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHead, EmptyState, Stat, StatusBar } from "@/components/ui/misc";
import { DueChip } from "@/components/workspace/ControlDetail";
import { FRAMEWORKS, STAGES } from "@/lib/catalog";
import type { ActivityKind, Control } from "@/lib/types";
import { ago, cn, dayLabel } from "@/lib/utils";
import { HEALTH, trend, type EngRow, type HomeData } from "./useHome";

type P = { h: HomeData; onApprove: (c: Control) => void };

const today = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const first = (h: HomeData) => h.me?.name.split(" ")[0] ?? "there";

/* ───────── shared pieces ───────── */
function stats(h: HomeData): ReactNode[] {
  const { d } = h;
  return [
    <Stat key="a" label="Active engagements" value={d.rows.length} hint={`across ${d.activeClients} clients`} spark={trend(d.rows.length, [0.7, 0.75, 0.75, 0.82, 0.88, 0.88, 0.94, 1])} />,
    <Stat key="b" label="Approved this week" value={d.approvedWeek} delta="+18%" hint="vs last week" spark={trend(d.approvedWeek, [0.55, 0.72, 0.5, 0.86, 0.68, 0.92, 0.84, 1])} tone="ok" />,
    <Stat key="c" label="Open gaps" value={d.openGaps.length} hint={`${d.critical} critical`} spark={trend(d.openGaps.length, [1.2, 1.16, 1.24, 1.12, 1.05, 1.08, 1.02, 1])} tone="warn" />,
    <Stat key="d" label="Overdue controls" value={d.overdue.length} delta={d.overdue.length > 10 ? "+3" : "-2"} deltaGood={d.overdue.length <= 10} hint="since Monday" spark={trend(d.overdue.length, [1.3, 1.15, 1.35, 1.2, 1.12, 1.05, 1.18, 1])} tone="bad" />,
  ];
}

function ApprovalList({ h, onApprove, limit = 6 }: P & { limit?: number }) {
  const { d, clientOf, engOf, person } = h;
  if (!d.waiting.length) return <EmptyState title="All caught up" body="Nothing is waiting for your approval right now." className="py-10" />;
  return (
    <ul className="px-2 pb-2">
      {d.waiting.slice(0, limit).map((c) => {
        const client = clientOf(c.clientId);
        const qa = person(c.approvals.reviewed!.by);
        return (
          <li key={c.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-raised">
            <ClientMark name={client.name} hue={client.hue} size="sm" />
            <Link href={`/reviews?c=${c.id}`} className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[13px]">
                <Code className="text-[11.5px] text-muted">{c.code}</Code>
                <span className="truncate font-medium text-ink">{c.title}</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted">
                {client.name} · {FRAMEWORKS[engOf(c.engagementId).framework].short} · QA by
                <Avatar person={qa} size="xs" className="!size-4 !text-[7px]" />
                {qa.name.split(" ")[0]} {ago(c.approvals.reviewed!.at)}
              </p>
            </Link>
            <span className="hidden sm:block"><DueChip due={c.due} status={c.status} /></span>
            <Button size="xs" variant="secondary" className="opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100" onClick={() => onApprove(c)}>
              <Check /> Approve
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function DueList({ h, limit = 5 }: { h: HomeData; limit?: number }) {
  const { d, clientOf, person, controlHref } = h;
  return (
    <ul className="px-2 pb-2">
      {d.week.slice(0, limit).map((c) => (
        <li key={c.id}>
          <Link href={controlHref(c)} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-raised">
            <Avatar person={person(c.ownerId)} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{c.title}</span>
              <span className="block truncate text-[12px] text-muted">{clientOf(c.clientId).name} · {c.code}</span>
            </span>
            <DueChip due={c.due} status={c.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HealthBadge({ r }: { r: EngRow }) {
  if (r.health === "ready") return <Badge tone="ok">Ready</Badge>;
  if (r.health === "ok") return <Badge tone="ok">On track</Badge>;
  if (r.health === "early") return <Badge tone="neutral">Too early</Badge>;
  return <Badge tone={r.health === "late" ? "bad" : "warn"}>{-r.slack}d late</Badge>;
}

/* ═════════════ MONO — the original dashboard ═════════════ */
export function HomeClassic({ h, onApprove }: P) {
  const { d, greeting, person } = h;
  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13px] text-muted">{today()}</p>
          <h1 className="serif mt-1 text-[36px] leading-[1.05] text-ink md:text-[42px]">{greeting}, {first(h)}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-2">
            <Link href="/reviews" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">{d.waiting.length} controls</Link> passed QA and need your approval,{" "}
            {d.revise.length} are back with their owners for revision, and {d.soon.length} {d.soon.length === 1 ? "engagement reaches" : "engagements reach"} its target date in the next 30 days.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openNewClient}><Plus /> New client</Button>
          <Button variant="primary" asChild><Link href="/reviews">Open reviews <ArrowRight /></Link></Button>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats(h)}</div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <ReadinessViz rows={d.viz} />
          <Card>
            <CardHead title="Waiting for your approval" sub="Passed QA review. Approving locks the evidence for the audit packet." action={<Button size="xs" variant="ghost" asChild><Link href="/reviews">All reviews <ArrowRight /></Link></Button>} />
            <ApprovalList h={h} onApprove={onApprove} />
          </Card>
          <Card>
            <CardHead title="Engagements" sub="Progress is the share of controls approved." action={<Button size="xs" variant="ghost" asChild><Link href="/clients">All clients <ArrowRight /></Link></Button>} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-[13px]">
                <thead>
                  <tr className="border-y border-line bg-raised text-left text-[12px] text-muted">
                    <th className="h-8 pl-4 font-medium">Client</th>
                    <th className="font-medium">Framework</th>
                    <th className="font-medium">Stage</th>
                    <th className="w-[180px] font-medium">Progress</th>
                    <th className="font-medium">Target</th>
                    <th className="font-medium">Forecast</th>
                    <th className="pr-4 font-medium">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {d.rows.slice(0, 9).map((r) => (
                    <tr key={r.e.id} className="h-12 border-b border-line last:border-0 hover:bg-raised">
                      <td className="pl-4">
                        <Link href={r.href} className="flex items-center gap-2.5 font-medium text-ink hover:underline">
                          <ClientMark name={r.client.name} hue={r.client.hue} size="sm" />
                          {r.client.name}
                        </Link>
                      </td>
                      <td><FrameworkChip fw={r.e.framework} /></td>
                      <td><span className="text-ink-2">{STAGES.find((s) => s.id === r.client.stage)!.label}</span></td>
                      <td className="pr-6">
                        <div className="flex items-center gap-2.5">
                          <StatusBar controls={r.cs} className="flex-1" />
                          <span className="tnum w-8 text-right text-[12px] font-medium text-ink">{r.pct}%</span>
                        </div>
                      </td>
                      <td className={cn("tnum text-[12.5px]", r.days <= 30 ? "font-medium text-warn" : "text-muted")}>{dayLabel(r.e.target)}</td>
                      <td><HealthBadge r={r} /></td>
                      <td className="pr-4"><AvatarStack people={r.client.team.map(person)} size="xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card><CardHead title="Team workload" sub="Open controls per person" /><Workload /></Card>
          <Card><CardHead title="Due this week" action={<Badge tone="warn">{d.week.length}</Badge>} /><DueList h={h} /></Card>
          <Card><CardHead title="Activity" sub="Across all clients" /><ActivityFeed limit={7} /></Card>
        </div>
      </div>
    </div>
  );
}

/* ═════════════ MERIDIAN — a morning newspaper ═════════════ */
export function HomeEditorial({ h, onApprove }: P) {
  const { d, greeting, clientOf, engOf, person, controlHref, activity } = h;
  const now = new Date();
  const no = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5);
  const kicker = "text-[11px] font-semibold uppercase tracking-[0.16em]";
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-8">
      <header className="border-b-[3px] border-double border-ink pb-4 text-center">
        <div className={cn("flex items-center justify-between text-muted", kicker, "text-[10.5px]")}>
          <span>No. {no}</span>
          <span className="hidden sm:inline">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
          <span>Internal edition</span>
        </div>
        <p className="serif mt-4 text-[44px] leading-none tracking-[-0.02em] text-ink md:text-[80px]">The SecureKnots Brief</p>
        <p className="serif mt-3 text-[16px] italic text-ink-2">{greeting}, {first(h)}. Where every engagement stands this morning.</p>
      </header>
      <div className={cn("no-scrollbar flex gap-6 overflow-x-auto whitespace-nowrap border-b border-ink py-2 text-ink-2", kicker, "text-[11px]")}>
        <Link href="/reviews" className="hover:text-brand">Approvals <b className="text-ink">{d.waiting.length}</b></Link>
        <span>Revisions <b className="text-ink">{d.revise.length}</b></span>
        <Link href="/gaps" className="hover:text-brand">Open gaps <b className="text-ink">{d.openGaps.length}</b></Link>
        <span>Overdue <b className="text-ink">{d.overdue.length}</b></span>
        <span>Targets in 30 days <b className="text-ink">{d.soon.length}</b></span>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-12">
        <article className="min-w-0 lg:col-span-8 lg:border-r lg:border-line-strong lg:pr-10">
          <p className={cn(kicker, "text-brand")}>Lead · Approvals</p>
          <h2 className="serif mt-3 text-[38px] leading-[1.02] text-ink md:text-[60px]">{d.waiting.length} controls passed QA and wait for your signature</h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.7] text-ink-2 first-letter:float-left first-letter:mr-2 first-letter:font-[family-name:var(--font-instrument)] first-letter:text-[68px] first-letter:leading-[0.78] first-letter:text-ink">
            {d.waiting[0] ? `The oldest passed QA ${ago(d.waiting[0].approvals.reviewed!.at)}. ` : ""}Meanwhile {d.revise.length} controls are back with their owners for revision, {d.critical} critical gaps remain open, and {d.soon.length} {d.soon.length === 1 ? "engagement reaches" : "engagements reach"} its target date within the month.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {d.waiting.slice(0, 6).map((c) => {
              const client = clientOf(c.clientId);
              const qa = person(c.approvals.reviewed!.by);
              return (
                <div key={c.id} className="border-t border-line-strong py-4">
                  <p className={cn(kicker, "text-[10.5px] text-muted")}>{client.name} · {FRAMEWORKS[engOf(c.engagementId).framework].short}</p>
                  <Link href={`/reviews?c=${c.id}`} className="serif mt-1.5 block text-[22px] leading-[1.15] text-ink hover:text-brand">{c.title}</Link>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
                    <Code>{c.code}</Code> · QA by {qa.name.split(" ")[0]}, {ago(c.approvals.reviewed!.at)}
                    <button onClick={() => onApprove(c)} className="ml-auto font-semibold text-brand hover:underline">Approve →</button>
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="min-w-0 lg:col-span-4">
          <p className={cn(kicker, "border-b border-ink pb-2")}>In numbers</p>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7">{stats(h)}</div>
          <p className={cn(kicker, "mt-12 border-b border-ink pb-2")}>Deadlines this week</p>
          <ul>
            {d.week.slice(0, 6).map((c) => {
              const due = new Date(c.due);
              return (
                <li key={c.id} className="border-b border-line">
                  <Link href={controlHref(c)} className="flex gap-4 py-3 hover:text-brand">
                    <span className="w-11 shrink-0 text-center">
                      <span className="serif tnum block text-[30px] leading-none text-ink">{due.getDate()}</span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-muted">{due.toLocaleDateString("en-US", { month: "short" })}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium text-ink">{c.title}</span>
                      <span className="block text-[12px] text-muted">{clientOf(c.clientId).name} · {c.code}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="min-w-0 lg:col-span-8 lg:border-r lg:border-line-strong lg:pr-10">
          <p className={cn(kicker, "border-b border-ink pb-2")}>Readiness index</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-[13.5px]">
              <thead>
                <tr className="text-left">
                  <th className="h-9 font-medium">Client</th>
                  <th className="font-medium">Framework</th>
                  <th className="text-right font-medium">Ready</th>
                  <th className="text-right font-medium">Slack</th>
                  <th className="pl-6 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.slice(0, 10).map((r) => (
                  <tr key={r.e.id} className="h-11 border-b border-line">
                    <td><Link href={r.href} className="serif text-[17px] text-ink hover:text-brand">{r.client.name}</Link></td>
                    <td className="text-ink-2">{FRAMEWORKS[r.e.framework].short}</td>
                    <td className="serif tnum text-right text-[19px] text-ink">{r.pct}%</td>
                    <td className={cn("tnum text-right font-semibold", r.health === "early" ? "text-faint" : r.slack >= 0 ? "text-ok" : "text-bad")}>{r.health === "early" ? "n/a" : `${r.slack >= 0 ? "▲" : "▼"} ${Math.abs(r.slack)}d`}</td>
                    <td className="tnum pl-6 text-muted">{dayLabel(r.e.target)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="min-w-0 lg:col-span-4">
          <p className={cn(kicker, "border-b border-ink pb-2")}>The wire</p>
          <ul>
            {activity.slice(0, 7).map((a) => (
              <li key={a.id} className="border-b border-line py-3">
                <p className={cn(kicker, "text-[10px] text-brand")}>{clientOf(a.clientId)?.name ?? "Workspace"} · {ago(a.at)}</p>
                <p className="serif mt-1 text-[16px] leading-[1.3] text-ink">{person(a.by).name.split(" ")[0]} {a.text}</p>
              </li>
            ))}
          </ul>
        </aside>

        <section className="min-w-0 lg:col-span-12">
          <ReadinessViz rows={d.viz} />
        </section>
      </div>
    </div>
  );
}

/* ═════════════ BOARDROOM — executive summary ═════════════ */
const NEXT_STEP = { ready: "Book the audit", ok: "Keep current pace", risk: "Add reviewer time", late: "Escalate with the client", early: "Finish the gap assessment" } as const;
const RAG = { ready: "bg-ok", ok: "bg-ok", risk: "bg-warn", late: "bg-bad", early: "bg-faint" } as const;

export function HomeExecutive({ h, onApprove }: P) {
  const { d, greeting, clientOf, engOf, person, controlHref } = h;
  const count = (k: EngRow["health"][]) => d.rows.filter((r) => k.includes(r.health)).length;
  const rank = { late: 0, risk: 1, early: 2, ok: 3, ready: 4 } as const;
  const sorted = [...d.rows].sort((a, b) => rank[a.health] - rank[b.health] || a.pct - b.pct);
  const kpis = [
    { label: "On track", value: count(["ok", "ready"]), cls: "text-[#7ee2a8]" },
    { label: "At risk", value: count(["risk"]), cls: "text-[#ffd479]" },
    { label: "Late", value: count(["late"]), cls: "text-[#ff9b9b]" },
    { label: "Approved this week", value: d.approvedWeek, cls: "text-white" },
  ];
  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-14 pt-6 md:px-6">
      <section className="overflow-hidden rounded-[var(--radius-2xl)] bg-[#13294b] text-white shadow-panel">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#d4b25c]">Executive summary · {today()}</p>
            <p className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.02em] md:text-[40px]">{greeting}, {first(h)}.</p>
            <p className="mt-2 max-w-2xl text-[16px] leading-[1.6] text-white/80">
              {d.rows.length} engagements are active across {d.activeClients} clients: {count(["ok", "ready"])} on track, {count(["risk"])} at risk, {count(["late"])} late and {count(["early"])} too early to forecast.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={openNewClient} className="inline-flex h-11 items-center gap-2 rounded-md border border-white/25 px-5 text-[15px] font-semibold hover:bg-white/10"><Plus className="size-4" /> New client</button>
            <Link href="/reviews" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#d4b25c] px-5 text-[15px] font-bold text-[#13294b] hover:bg-[#e0c274]">Review {d.waiting.length} approvals <ArrowRight className="size-4" /></Link>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 md:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="border-white/10 px-6 py-5 [&:not(:last-child)]:border-r">
              <p className={cn("tnum text-[40px] font-bold leading-none", k.cls)}>{k.value}</p>
              <p className="mt-2 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/60">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{stats(h)}</div>

      <Card className="mt-6">
        <CardHead title="Portfolio status" sub="Every active engagement, most urgent first." action={<Button size="sm" variant="secondary" asChild><Link href="/reports">Board pack <ArrowRight /></Link></Button>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="text-left">
                <th className="h-10 pl-4">Client</th>
                <th>Framework</th>
                <th>Stage</th>
                <th className="w-[220px]">Progress</th>
                <th>Target date</th>
                <th>Status</th>
                <th className="pr-4">Next step</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.e.id} className="h-14 border-b border-line">
                  <td className="pl-4">
                    <Link href={r.href} className="flex items-center gap-3 font-semibold text-ink hover:underline">
                      <ClientMark name={r.client.name} hue={r.client.hue} size="md" />
                      {r.client.name}
                    </Link>
                  </td>
                  <td className="text-ink-2">{FRAMEWORKS[r.e.framework].short}</td>
                  <td className="text-ink-2">{STAGES.find((s) => s.id === r.client.stage)!.label}</td>
                  <td className="pr-6">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-subtle-2"><div className={cn("h-full", RAG[r.health])} style={{ width: `${r.pct}%` }} /></div>
                      <span className="tnum w-10 text-right font-bold text-ink">{r.pct}%</span>
                    </div>
                  </td>
                  <td className="tnum text-ink-2">{dayLabel(r.e.target)}</td>
                  <td>
                    <span className="inline-flex items-center gap-2 font-semibold text-ink">
                      <span className={cn("size-3 rounded-full", RAG[r.health])} />
                      {HEALTH[r.health].label}{r.health === "risk" || r.health === "late" ? ` (${-r.slack} days)` : ""}
                    </span>
                  </td>
                  <td className="pr-4 text-ink-2">{NEXT_STEP[r.health]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHead title="Decisions needed" sub="Passed QA. Approving locks the evidence for the audit." />
          {d.waiting.length === 0 ? (
            <EmptyState title="All caught up" className="py-10" />
          ) : (
            <ul className="px-4 pb-3">
              {d.waiting.slice(0, 6).map((c) => {
                const client = clientOf(c.clientId);
                return (
                  <li key={c.id} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
                    <Link href={`/reviews?c=${c.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 truncate text-[13.5px] text-muted">{client.name} · {FRAMEWORKS[engOf(c.engagementId).framework].short} · {c.code} · QA by {person(c.approvals.reviewed!.by).name}</p>
                    </Link>
                    <Button size="md" variant="primary" onClick={() => onApprove(c)}><Check /> Approve</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <CardHead title="Deadlines this week" sub={`${d.week.length} controls due in the next 7 days`} />
          <ul className="px-4 pb-3">
            {d.week.slice(0, 6).map((c) => {
              const due = new Date(c.due);
              return (
                <li key={c.id} className="border-b border-line last:border-0">
                  <Link href={controlHref(c)} className="flex items-center gap-4 py-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-md bg-[#13294b] text-white">
                      <span className="text-center leading-none"><span className="tnum block text-[18px] font-bold">{due.getDate()}</span><span className="block text-[10px] font-semibold uppercase">{due.toLocaleDateString("en-US", { month: "short" })}</span></span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{c.title}</span>
                      <span className="block truncate text-[13.5px] text-muted">{clientOf(c.clientId).name} · owner {person(c.ownerId).name}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReadinessViz rows={d.viz} />
        <Card><CardHead title="Team workload" sub="Open controls per person" /><Workload /></Card>
      </div>
    </div>
  );
}

/* ═════════════ AURORA — bento grid ═════════════ */
export function HomeBento({ h, onApprove }: P) {
  const { d, greeting } = h;
  const tiers = (["ready", "ok", "risk", "late", "early"] as const).map((k) => ({ k, n: d.rows.filter((r) => r.health === k).length }));
  const upcoming = [...d.rows].filter((r) => r.days >= 0).sort((a, b) => a.days - b.days).slice(0, 4);
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 md:px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#7c3aed,#c026d3_52%,#f97316)] p-7 text-white shadow-[0_30px_60px_-30px_rgb(192_38_211/0.7)] md:col-span-2 xl:row-span-2">
          <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/15 blur-2xl" />
          <svg aria-hidden viewBox="0 0 200 200" className="absolute -bottom-10 -right-6 size-64 opacity-30">
            {[90, 70, 50, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="white" strokeWidth="1.2" />)}
          </svg>
          <div className="relative">
            <p className="text-[13px] font-medium text-white/80">{today()}</p>
            <p className="mt-3 text-[42px] font-semibold leading-[0.98] tracking-[-0.05em] md:text-[56px]" style={{ fontFamily: "var(--font-space)" }}>
              {greeting},<br />{first(h)}
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-[1.55] text-white/85">
              {d.waiting.length} approvals are ready for you and {d.revise.length} controls are back with their owners.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/reviews" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#5b21b6] shadow-lg transition-transform hover:scale-[1.03]">Start reviewing <ArrowRight className="size-4" /></Link>
              <button onClick={openNewClient} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-5 text-[14px] font-medium text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25"><Plus className="size-4" /> New client</button>
            </div>
          </div>
        </section>
        {stats(h)}
        <div className="min-w-0 md:col-span-2 xl:row-span-2">
          <ReadinessViz rows={d.viz} />
        </div>
        <Card className="min-w-0 md:col-span-2 xl:row-span-2">
          <CardHead title="Waiting for you" sub="Passed QA" action={<Button size="xs" variant="ghost" asChild><Link href="/reviews">All <ArrowRight /></Link></Button>} />
          <ApprovalList h={h} onApprove={onApprove} limit={7} />
        </Card>
        <Card className="min-w-0 md:col-span-2"><CardHead title="Team workload" /><Workload /></Card>
        <Card className="min-w-0"><CardHead title="This week" action={<Badge tone="warn">{d.week.length}</Badge>} /><DueList h={h} limit={4} /></Card>
        <Card className="min-w-0 p-5">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-space)" }}>Engagement health</p>
          <div className="mt-4 space-y-3">
            {tiers.map((t) => (
              <div key={t.k}>
                <div className="flex justify-between text-[12.5px]"><span className="text-ink-2">{HEALTH[t.k].label}</span><span className="tnum font-semibold text-ink">{t.n}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-subtle-2">
                  <div className={cn("h-full rounded-full", { ok: "bg-[linear-gradient(90deg,#10b981,#06b6d4)]", warn: "bg-[linear-gradient(90deg,#f59e0b,#ec4899)]", bad: "bg-[linear-gradient(90deg,#f43f5e,#a855f7)]", neutral: "bg-[linear-gradient(90deg,#a29bbf,#c4b5fd)]" }[HEALTH[t.k].tone])} style={{ width: `${(t.n / Math.max(d.rows.length, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="min-w-0 md:col-span-2"><CardHead title="Activity" sub="Across all clients" /><ActivityFeed limit={5} /></Card>
        <Card className="min-w-0 md:col-span-2">
          <CardHead title="Next targets" sub="Projected from the current pace" />
          <ul className="px-2 pb-2">
            {upcoming.map((r) => (
              <li key={r.e.id}>
                <Link href={r.href} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-white/50">
                  <ClientMark name={r.client.name} hue={r.client.hue} size="sm" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-ink">{r.client.name}</span><span className="block text-[12px] text-muted">{FRAMEWORKS[r.e.framework].short} · target {dayLabel(r.e.target)}</span></span>
                  <HealthBadge r={r} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ═════════════ SPATIAL — centered, floating columns ═════════════ */
export function HomeOrbit({ h, onApprove }: P) {
  const { d, greeting } = h;
  const s = stats(h);
  const chip = "inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-[13px] text-ink-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl transition-colors hover:bg-white/[0.1] hover:text-ink";
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-10 md:px-8">
      <div className="text-center">
        <p className="text-[11.5px] font-medium uppercase tracking-[0.32em] text-muted">{today()}</p>
        <h1 data-ph className="mt-4 text-[44px] font-extralight leading-none tracking-[-0.05em] text-ink md:text-[72px]">{greeting}, {first(h)}</h1>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/reviews" className={chip}><span className="size-1.5 rounded-full bg-[#a5b4fc] shadow-[0_0_8px_#a5b4fc]" />{d.waiting.length} to approve</Link>
          <span className={chip}><span className="size-1.5 rounded-full bg-[#f472b6] shadow-[0_0_8px_#f472b6]" />{d.revise.length} sent back</span>
          <Link href="/calendar" className={chip}><span className="size-1.5 rounded-full bg-[#5eead4] shadow-[0_0_8px_#5eead4]" />{d.soon.length} {d.soon.length === 1 ? "target" : "targets"} this month</Link>
          <button onClick={openNewClient} className={chip}><Plus className="size-3.5" /> New client</button>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          {s[0]}
          {s[1]}
          <Card><CardHead title="Due this week" /><DueList h={h} limit={5} /></Card>
        </div>
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <ReadinessViz rows={d.viz} />
          <Card><CardHead title="Waiting for your approval" sub="Passed QA review" /><ApprovalList h={h} onApprove={onApprove} /></Card>
        </div>
        <div className="grid min-w-0 grid-cols-1 content-start gap-5 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          {s[2]}
          {s[3]}
          <Card><CardHead title="Team" sub="Open controls per person" /><Workload /></Card>
          <Card><CardHead title="Activity" /><ActivityFeed limit={5} /></Card>
        </div>
      </div>
    </div>
  );
}

/* ═════════════ BRUTAL — a poster ═════════════ */
const NOTES = ["#fff27a", "#ff9ad5", "#9ee7ff", "#c6f432"];
const TILT = [-1.5, 1, -0.5, 1.5];

export function HomePoster({ h, onApprove }: P) {
  const { d, greeting, clientOf, person, controlHref } = h;
  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const h2 = "text-[30px] font-bold uppercase leading-none tracking-[-0.045em] text-ink md:text-[36px]";
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-14 pt-6 md:px-6">
      <section className="relative border-b-[3px] border-ink pb-7">
        <p className="text-[13px] font-bold uppercase">{greeting}, {first(h)}</p>
        <h1 data-ph className="mt-2 text-[54px] font-bold uppercase leading-[0.98] tracking-[-0.06em] text-ink md:text-[108px]">
          {weekday}.<br />
          <span className="box-decoration-clone bg-[#c6f432] px-2">{d.waiting.length} to approve.</span>
        </h1>
        <span className="absolute right-2 top-2 hidden rotate-6 rounded-full border-2 border-ink bg-[#ff9ad5] px-5 py-4 text-center text-[13px] font-bold uppercase leading-tight shadow-[3px_3px_0_#111] md:block">
          <span className="block text-[34px] leading-none">{d.revise.length}</span>sent back
        </span>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" asChild><Link href="/reviews">Start the pile <ArrowRight /></Link></Button>
          <Button size="lg" onClick={openNewClient}><Plus /> New client</Button>
        </div>
      </section>

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">{stats(h)}</div>

      <section className="mt-12">
        <div className="flex items-end justify-between border-b-[3px] border-ink pb-2">
          <h2 className={h2}>The pile</h2>
          <Link href="/reviews" className="text-[12px] font-bold uppercase underline decoration-2 underline-offset-4">See all {d.waiting.length}</Link>
        </div>
        <ol>
          {d.waiting.slice(0, 5).map((c, i) => (
            <li key={c.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b-2 border-ink py-4 transition-colors hover:bg-[#fff27a] md:grid-cols-[72px_minmax(0,1fr)_auto]">
              <span className="text-[38px] font-bold leading-none tracking-[-0.06em] md:text-[52px]">{String(i + 1).padStart(2, "0")}</span>
              <Link href={`/reviews?c=${c.id}`} className="min-w-0">
                <p className="truncate text-[16px] font-bold uppercase tracking-[-0.02em] md:text-[19px]">{c.title}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
                  <span className="border-2 border-ink bg-white px-1.5">{clientOf(c.clientId).name}</span>
                  <span>{c.code}</span>
                  <span className="hidden sm:inline">QA {person(c.approvals.reviewed!.by).name.split(" ")[0]} · {ago(c.approvals.reviewed!.at)}</span>
                </p>
              </Link>
              <Button variant="primary" onClick={() => onApprove(c)}><Check /> <span className="hidden sm:inline">Approve</span></Button>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <h2 className={cn(h2, "border-b-[3px] border-ink pb-2")}>Progress</h2>
          {d.rows.slice(0, 8).map((r) => (
            <Link key={r.e.id} href={r.href} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-4 border-b-2 border-ink py-3 transition-colors hover:bg-[#fff27a]">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold uppercase">{r.client.name} <span className="ml-1 border-2 border-ink px-1 text-[10.5px]">{FRAMEWORKS[r.e.framework].short}</span></p>
                <div className="mt-2 h-4 border-2 border-ink bg-surface">
                  <div className="h-full bg-[repeating-linear-gradient(-45deg,#111_0_5px,#c6f432_5px_10px)]" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
              <span className="tnum text-right text-[30px] font-bold tracking-[-0.05em]">{r.pct}%</span>
            </Link>
          ))}
        </section>
        <section className="min-w-0">
          <h2 className={cn(h2, "border-b-[3px] border-ink pb-2")}>Due this week</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {d.week.slice(0, 6).map((c, i) => (
              <Link key={c.id} href={controlHref(c)} className="block min-h-[128px] border-2 border-[#111] p-3 text-[#111] shadow-[4px_4px_0_#111] transition-transform hover:-translate-y-1" style={{ background: NOTES[i % 4], rotate: `${TILT[i % 4]}deg` }}>
                <p className="text-[11px] font-bold uppercase">{dayLabel(c.due)}</p>
                <p className="mt-2 line-clamp-3 text-[14px] font-bold leading-tight">{c.title}</p>
                <p className="mt-2 text-[11px] font-semibold">{clientOf(c.clientId).name}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReadinessViz rows={d.viz} />
        <Card><CardHead title="Activity" /><ActivityFeed limit={7} /></Card>
      </div>
    </div>
  );
}

/* ═════════════ NOCTURNE — terminal dashboard ═════════════ */
const KIND_CLS: Record<ActivityKind, string> = {
  approve: "text-ok", revise: "text-bad", upload: "text-info", comment: "text-muted", status: "text-rev", assign: "text-muted", gap: "text-warn", publish: "text-brand",
};
const HEALTH_CLS = { ready: "text-ok", ok: "text-brand", risk: "text-warn", late: "text-bad", early: "text-muted" } as const;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Pane({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("relative min-w-0 p-4", className)}>
      <span className="absolute right-3 top-2 text-[10.5px] text-faint">[{label}]</span>
      {children}
    </Card>
  );
}

function Prompt({ user, cmd }: { user: string; cmd: string }) {
  return (
    <p className="truncate pr-16 text-[12px]">
      <span className="text-brand">{user}@secureknots</span>
      <span className="text-faint">:~$ </span>
      <span className="text-ink">{cmd}</span>
    </p>
  );
}

export function HomeTerminal({ h, onApprove }: P) {
  const { d, greeting, clientOf, person, controlHref, activity } = h;
  const user = first(h).toLowerCase();
  const kv: [string, ReactNode, string?][] = [
    ["engagements", d.rows.length],
    ["awaiting_approval", d.waiting.length, "text-brand"],
    ["sent_back", d.revise.length, "text-bad"],
    ["open_gaps", `${d.openGaps.length} (${d.critical} crit)`, "text-warn"],
    ["overdue", d.overdue.length, "text-bad"],
    ["approved_7d", d.approvedWeek, "text-ok"],
  ];
  const maxLoad = Math.max(...d.load.map((l) => l.open), 1);
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 pb-10 pt-5 font-[family-name:var(--font-jet)] md:px-6">
      <Pane label="0:status">
        <Prompt user={user} cmd="sk status --today" />
        <p className="mt-3 text-[13px] text-ink-2">{greeting.toLowerCase()}, {user}. <span className="text-faint">{today().toLowerCase()}</span></p>
        <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px] sm:grid-cols-3 xl:grid-cols-6">
          {kv.map(([k, v, cls]) => (
            <p key={k} className="truncate"><span className="text-faint">{k}=</span><span className={cn("tnum font-semibold text-ink", cls)}>{v}</span></p>
          ))}
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[11.5px] text-faint">hint: press <Kbd>Ctrl K</Kbd> to run a command, or drop files anywhere to file them.</p>
      </Pane>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Pane label="1:readiness">
            <Prompt user={user} cmd="sk readiness --active --sort=pct" />
            <div className="no-scrollbar mt-3 overflow-x-auto">
              <div className="min-w-[620px] text-[12.5px]">
                {[...d.rows].sort((a, b) => b.pct - a.pct).map((r) => {
                  const n = Math.round((r.pct / 100) * 28);
                  return (
                    <Link key={r.e.id} href={r.href} className="grid grid-cols-[minmax(0,180px)_78px_auto_44px_86px] items-center gap-3 rounded px-1 py-[3px] hover:bg-brand-soft">
                      <span className="truncate text-ink">{slug(r.client.name)}</span>
                      <span className="truncate text-muted">{FRAMEWORKS[r.e.framework].short.toLowerCase()}</span>
                      <span className="whitespace-pre tracking-[-1px]"><span className={HEALTH_CLS[r.health]}>{"█".repeat(n)}</span><span className="text-faint opacity-40">{"░".repeat(28 - n)}</span></span>
                      <span className="tnum text-right text-ink">{r.pct}%</span>
                      <span className={cn("text-right", HEALTH_CLS[r.health])}>{r.health === "risk" || r.health === "late" ? `-${-r.slack}d` : HEALTH[r.health].label.toLowerCase()}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Pane>
          <Pane label="2:queue">
            <Prompt user={user} cmd={`sk queue --awaiting-approval | head -${Math.min(8, d.waiting.length)}`} />
            <ul className="mt-3 text-[12.5px]">
              {d.waiting.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded px-1 py-1 hover:bg-brand-soft">
                  <span className="text-brand">→</span>
                  <span className="w-[74px] shrink-0 truncate text-muted">{c.code}</span>
                  <Link href={`/reviews?c=${c.id}`} className="min-w-0 flex-1 truncate text-ink hover:underline">{c.title}</Link>
                  <span className="hidden shrink-0 text-faint md:inline">qa:{person(c.approvals.reviewed!.by).name.split(" ")[0].toLowerCase()} {ago(c.approvals.reviewed!.at)}</span>
                  <button onClick={() => onApprove(c)} className="shrink-0 text-brand hover:underline">[a]pprove</button>
                </li>
              ))}
              {d.waiting.length === 0 && <li className="text-faint">queue empty.</li>}
            </ul>
          </Pane>
        </div>

        <div className="min-w-0 space-y-4">
          <Pane label="3:log">
            <Prompt user={user} cmd="tail -f activity.log" />
            <ul className="mt-3 space-y-1 text-[12px] leading-[1.55]">
              {activity.slice(0, 9).map((a) => (
                <li key={a.id} className="truncate">
                  <span className="text-faint">[{new Date(a.at).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}]</span>{" "}
                  <span className={cn("inline-block w-[58px] uppercase", KIND_CLS[a.kind])}>{a.kind}</span>
                  <span className="text-ink">{person(a.by).name.split(" ")[0].toLowerCase()}</span> <span className="text-ink-2">{a.text}</span>
                  <span className="text-faint"> · {slug(clientOf(a.clientId)?.name ?? "")}</span>
                </li>
              ))}
              <li><span className="inline-block h-3.5 w-[7px] animate-pulse bg-brand/80 align-middle" /></li>
            </ul>
          </Pane>
          <Pane label="4:due">
            <Prompt user={user} cmd="sk due --this-week" />
            <ul className="mt-3 text-[12.5px]">
              {d.week.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={controlHref(c)} className="flex gap-3 rounded px-1 py-[3px] hover:bg-brand-soft">
                    <span className="w-[86px] shrink-0 text-warn">{dayLabel(c.due).toLowerCase()}</span>
                    <span className="w-[74px] shrink-0 truncate text-muted">{c.code}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Pane>
          <Pane label="5:load">
            <Prompt user={user} cmd="sk load --team" />
            <ul className="mt-3 text-[12.5px]">
              {d.load.map(({ m, open }) => {
                const n = Math.round((open / maxLoad) * 24);
                return (
                  <li key={m.id} className="flex items-center gap-2 py-[2px]">
                    <span className="w-[86px] shrink-0 truncate text-ink-2">{m.name.split(" ")[0].toLowerCase()}</span>
                    <span className="whitespace-pre text-faint">[<span className={n > 18 ? "text-bad" : n > 12 ? "text-warn" : "text-brand"}>{"|".repeat(n)}</span>{" ".repeat(24 - n)}]</span>
                    <span className="tnum text-ink">{open}</span>
                  </li>
                );
              })}
            </ul>
          </Pane>
        </div>
      </div>
    </div>
  );
}
