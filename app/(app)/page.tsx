"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { openNewClient } from "@/components/clients/NewClientWizard";
import { Workload } from "@/components/home/Workload";
import { Avatar, AvatarStack, ClientMark } from "@/components/ui/avatar";
import { Badge, Code, FrameworkChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHead, EmptyState, Skeleton, Stat, StatusBar } from "@/components/ui/misc";
import { DueChip } from "@/components/workspace/ControlDetail";
import { ApproveDialog } from "@/components/workspace/ReviewDialogs";
import { FRAMEWORKS, STAGES } from "@/lib/catalog";
import { useGreeting, useReady } from "@/lib/hooks";
import { ME } from "@/lib/mock/seed";
import { progressOf, usePerson, useStore } from "@/lib/store";
import type { Control } from "@/lib/types";
import { ago, cn, dayLabel, daysUntil } from "@/lib/utils";

/** Illustrative weekly trend ending at the live value. */
const trend = (v: number, f: number[]) => f.map((x) => Math.round(v * x));

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-10 pt-7 md:px-6">
      <Skeleton className="h-9 w-80" />
      <Skeleton className="mt-3 h-4 w-[420px] max-w-full" />
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[420px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const ready = useReady();
  const greeting = useGreeting();
  const controls = useStore((s) => s.controls);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const gaps = useStore((s) => s.gaps);
  const members = useStore((s) => s.members);
  const person = usePerson();
  const [approving, setApproving] = useState<Control | null>(null);

  const d = useMemo(() => {
    const list = Object.values(controls);
    const waiting = list.filter((c) => c.status === "review" && c.approvals.reviewed).sort((a, b) => a.approvals.reviewed!.at.localeCompare(b.approvals.reviewed!.at));
    const qa = list.filter((c) => c.status === "review" && !c.approvals.reviewed);
    const revise = list.filter((c) => c.status === "revise");
    const overdue = list.filter((c) => c.status !== "approved" && daysUntil(c.due) < 0);
    const week = list.filter((c) => c.status !== "approved" && daysUntil(c.due) >= 0 && daysUntil(c.due) <= 7).sort((a, b) => a.due.localeCompare(b.due));
    const approvedWeek = list.filter((c) => c.approvals.approved && daysUntil(c.approvals.approved.at) >= -7).length;
    const openGaps = gaps.filter((g) => g.status !== "closed");
    const soon = engagements.filter((e) => daysUntil(e.target) >= 0 && daysUntil(e.target) <= 30);
    return { waiting, qa, revise, overdue, week, approvedWeek, openGaps, soon };
  }, [controls, gaps, engagements]);

  if (!ready) return <HomeSkeleton />;
  const me = members.find((m) => m.id === ME)!;
  const activeEngs = engagements.filter((e) => clients.find((c) => c.id === e.clientId)?.stage !== "certified");

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13px] text-muted">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="serif mt-1 text-[36px] leading-[1.05] text-ink md:text-[42px]">
            {greeting}, {me.name.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-2">
            <Link href="/reviews" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">{d.waiting.length} controls</Link> passed QA and need your approval,{" "}
            {d.revise.length} are back with their owners for revision, and {d.soon.length} {d.soon.length === 1 ? "engagement reaches" : "engagements reach"} its target date in the next 30 days.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openNewClient}>
            <Plus /> New client
          </Button>
          <Button variant="primary" asChild>
            <Link href="/reviews">Open reviews <ArrowRight /></Link>
          </Button>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active engagements" value={activeEngs.length} hint={`across ${clients.filter((c) => c.stage !== "certified").length} clients`} spark={trend(activeEngs.length, [0.7, 0.75, 0.75, 0.82, 0.88, 0.88, 0.94, 1])} />
        <Stat label="Approved this week" value={d.approvedWeek} delta="+18%" hint="vs last week" spark={trend(d.approvedWeek, [0.55, 0.72, 0.5, 0.86, 0.68, 0.92, 0.84, 1])} tone="ok" />
        <Stat label="Open gaps" value={d.openGaps.length} hint={`${d.openGaps.filter((g) => g.severity === "critical").length} critical`} spark={trend(d.openGaps.length, [1.2, 1.16, 1.24, 1.12, 1.05, 1.08, 1.02, 1])} tone="warn" />
        <Stat label="Overdue controls" value={d.overdue.length} delta={d.overdue.length > 10 ? "+3" : "-2"} deltaGood={d.overdue.length <= 10} hint="since Monday" spark={trend(d.overdue.length, [1.3, 1.15, 1.35, 1.2, 1.12, 1.05, 1.18, 1])} tone="bad" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHead
              title="Waiting for your approval"
              sub="Passed QA review. Approving locks the evidence for the audit packet."
              action={<Button size="xs" variant="ghost" asChild><Link href="/reviews">All reviews <ArrowRight /></Link></Button>}
            />
            {d.waiting.length === 0 ? (
              <EmptyState title="All caught up" body="Nothing is waiting for your approval right now." className="py-10" />
            ) : (
              <ul className="px-2 pb-2">
                {d.waiting.slice(0, 6).map((c) => {
                  const client = clients.find((x) => x.id === c.clientId)!;
                  const eng = engagements.find((e) => e.id === c.engagementId)!;
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
                          {client.name} · {FRAMEWORKS[eng.framework].short} · QA by
                          <Avatar person={qa} size="xs" className="!size-4 !text-[7px]" />
                          {qa.name.split(" ")[0]} {ago(c.approvals.reviewed!.at)}
                        </p>
                      </Link>
                      <span className="hidden sm:block"><DueChip due={c.due} status={c.status} /></span>
                      <Button size="xs" variant="secondary" className="opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100" onClick={() => setApproving(c)}>
                        <Check /> Approve
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
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
                    <th className="pr-4 font-medium">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEngs.slice(0, 9).map((e) => {
                    const client = clients.find((c) => c.id === e.clientId)!;
                    const cs = Object.values(controls).filter((c) => c.engagementId === e.id);
                    const p = progressOf(cs);
                    const days = daysUntil(e.target);
                    return (
                      <tr key={e.id} className="h-12 border-b border-line last:border-0 hover:bg-raised">
                        <td className="pl-4">
                          <Link href={`/clients/${client.id}/${e.framework}`} className="flex items-center gap-2.5 font-medium text-ink hover:underline">
                            <ClientMark name={client.name} hue={client.hue} size="sm" />
                            {client.name}
                          </Link>
                        </td>
                        <td><FrameworkChip fw={e.framework} /></td>
                        <td><span className="text-ink-2">{STAGES.find((s) => s.id === client.stage)!.label}</span></td>
                        <td className="pr-6">
                          <div className="flex items-center gap-2.5">
                            <StatusBar controls={cs} className="flex-1" />
                            <span className="tnum w-8 text-right text-[12px] font-medium text-ink">{p.pct}%</span>
                          </div>
                        </td>
                        <td className={cn("tnum text-[12.5px]", days <= 30 ? "font-medium text-warn" : "text-muted")}>{dayLabel(e.target)}</td>
                        <td className="pr-4"><AvatarStack people={client.team.map(person)} size="xs" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHead title="Team workload" sub="Open controls per person" />
            <Workload />
          </Card>
          <Card>
            <CardHead title="Due this week" action={<Badge tone="warn">{d.week.length}</Badge>} />
            <ul className="px-2 pb-2">
              {d.week.slice(0, 5).map((c) => {
                const client = clients.find((x) => x.id === c.clientId)!;
                const eng = engagements.find((e) => e.id === c.engagementId)!;
                return (
                  <li key={c.id}>
                    <Link href={`/clients/${c.clientId}/${eng.framework}?control=${c.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-raised">
                      <Avatar person={person(c.ownerId)} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{c.title}</span>
                        <span className="block truncate text-[12px] text-muted">{client.name} · {c.code}</span>
                      </span>
                      <DueChip due={c.due} status={c.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <CardHead title="Activity" sub="Across all clients" />
            <ActivityFeed limit={7} />
          </Card>
        </div>
      </div>
      <ApproveDialog control={approving} open={!!approving} onOpenChange={(o) => !o && setApproving(null)} />
    </div>
  );
}
