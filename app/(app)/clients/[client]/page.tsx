"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeftRight, ArrowRight, CalendarClock, Check, ClipboardCheck, FileText, Gauge, Globe, Mail, MapPin, Rocket } from "lucide-react";
import { PHASE } from "@/lib/audit";
import { ForecastCard } from "@/components/charts/Forecast";
import { toast } from "sonner";
import { Copy, Inbox } from "lucide-react";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, FrameworkChip, GapStatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHead, EmptyState, ProgressRing, Skeleton, StatusBar } from "@/components/ui/misc";
import { Tip } from "@/components/ui/overlay";
import { StagePill } from "@/components/ui/stage";
import { DueChip } from "@/components/workspace/ControlDetail";
import { PublishDialog } from "@/components/workspace/PublishDialog";
import { FRAMEWORKS, SEVERITY, STAGES, STATUS, STATUS_ORDER } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { progressOf, usePerson, useStore } from "@/lib/store";
import { ago, cn, dayLabel, daysUntil } from "@/lib/utils";

export default function ClientPage() {
  const { client: id } = useParams<{ client: string }>();
  const ready = useReady();
  const router = useRouter();
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const all = useStore((s) => s.controls);
  const gaps = useStore((s) => s.gaps);
  const requests = useStore((s) => s.requests);
  const setViewAs = useStore((s) => s.setViewAs);
  const audits = useStore((s) => s.audits);
  const policies = useStore((s) => s.policies);
  const risks = useStore((s) => s.risks);
  const person = usePerson();
  const [publishing, setPublishing] = useState(false);

  const client = clients.find((c) => c.id === id);
  const engs = useMemo(() => engagements.filter((e) => e.clientId === id), [engagements, id]);
  const cs = useMemo(() => Object.values(all).filter((c) => c.clientId === id), [all, id]);

  if (!ready)
    return (
      <div className="mx-auto max-w-[1680px] px-4 pt-7 md:px-6">
        <div className="flex gap-4"><Skeleton className="size-14 rounded-2xl" /><div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-40" /></div></div>
        <Skeleton className="mt-8 h-16 rounded-xl" />
        <div className="mt-4 grid gap-4 md:grid-cols-2"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div>
      </div>
    );
  if (!client) notFound();

  const overall = progressOf(cs);
  const stageIdx = STAGES.findIndex((s) => s.id === client.stage);
  const clientGaps = gaps.filter((g) => g.clientId === client.id && g.status !== "closed").sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank);
  const openReq = requests.filter((r) => r.clientId === client.id && r.status !== "accepted");
  const canPublish = client.trustPlan && client.stage === "certified";

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <ClientMark name={client.name} hue={client.hue} size="xl" />
          <div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">{client.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              <span>{client.industry}</span>
              <span className="flex items-center gap-1"><MapPin className="size-3.5" />{client.hq}</span>
              <span>Client since {new Date(client.startedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StagePill stage={client.stage} />
              {engs.map((e) => <FrameworkChip key={e.id} fw={e.framework} />)}
              {client.trustPlan && <Badge tone={client.publishedAt ? "ok" : "brand"}>{client.publishedAt ? `Trust live · ${ago(client.publishedAt)}` : "Trust plan"}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setViewAs(client.id); router.push("/portal"); }}>
            <ArrowLeftRight /> View as client
          </Button>
          {canPublish ? (
            <Button variant="primary" onClick={() => setPublishing(true)}>
              <Rocket /> {client.publishedAt ? "Publish update to Trust" : "Publish to Trust"}
            </Button>
          ) : (
            <Tip content={client.trustPlan ? "Available once the client is certified" : "Client is not on the Trust plan"}>
              <span tabIndex={0}><Button variant="primary" disabled><Rocket /> Publish to Trust</Button></span>
            </Tip>
          )}
        </div>
      </div>

      {/* Stage stepper */}
      <Card className="mt-6 px-5 py-4">
        <ol className="grid grid-cols-5 gap-2">
          {STAGES.map((s, i) => {
            const done = i < stageIdx || client.stage === "certified";
            const active = i === stageIdx && client.stage !== "certified";
            return (
              <li key={s.id} className="min-w-0">
                <div className={cn("h-1 rounded-full", done ? "bg-ok-dot" : active ? "bg-brand" : "bg-subtle-2")} />
                <p className={cn("mt-2 flex items-center gap-1 truncate text-[12.5px] font-medium", done ? "text-ink" : active ? "text-brand-ink" : "text-faint")}>
                  {done && <Check className="size-3.5 shrink-0 text-ok" />}
                  {s.label}
                </p>
                <p className="hidden truncate text-[11.5px] text-faint sm:block">{done ? "Complete" : active ? "Current stage" : "Upcoming"}</p>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {engs.map((e) => {
              const ec = cs.filter((c) => c.engagementId === e.id);
              const p = progressOf(ec);
              const days = daysUntil(e.target);
              return (
                <Link key={e.id} href={`/clients/${client.id}/${e.framework}`} className="group">
                  <Card className="h-full p-4 transition-[border-color,box-shadow] group-hover:border-line-strong group-hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <FrameworkChip fw={e.framework} />
                        <p className="mt-2.5 text-[16px] font-semibold tracking-[-0.015em] text-ink">{FRAMEWORKS[e.framework].name}</p>
                        <p className="mt-0.5 text-[12.5px] text-muted">{e.auditor}</p>
                      </div>
                      <ProgressRing value={p.pct} size={48} stroke={4} />
                    </div>
                    <StatusBar controls={ec} className="mt-5" />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {(["approved", "review", "revise"] as const).map((s) => (
                        <div key={s} className="rounded-lg bg-raised px-2.5 py-2">
                          <p className="tnum text-[16px] font-semibold text-ink">{ec.filter((c) => c.status === s).length}</p>
                          <p className="text-[11.5px] text-muted">{STATUS[s].label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[12.5px]">
                      <span className={cn("tnum flex items-center gap-1", days >= 0 && days <= 30 ? "font-medium text-warn" : "text-muted")}>
                        <CalendarClock className="size-3.5" />
                        {days >= 0 ? `Target ${dayLabel(e.target)}` : `Done ${dayLabel(e.target)}`}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-ink-2 transition-colors group-hover:text-brand">Open workspace <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(() => {
              const au = audits.filter((a) => a.clientId === client.id);
              const pol = policies.filter((p) => p.clientId === client.id);
              const rk = risks.filter((r) => r.clientId === client.id);
              const pbcOpen = au.flatMap((a) => a.pbc).filter((p) => p.status !== "accepted").length;
              const tiles = [
                { href: au[0] ? `/audits/${au[0].id}` : "/audits", icon: ClipboardCheck, label: "Audit", value: au[0] ? PHASE[au[0].phase].label : "Not scheduled", sub: au[0] ? `${pbcOpen} auditor requests open` : "Starts after remediation" },
                { href: `/policies`, icon: FileText, label: "Policies", value: `${pol.filter((p) => p.status === "approved").length} of ${pol.length} approved`, sub: pol.length ? `${Math.round(pol.reduce((n, p) => n + p.ackRate, 0) / pol.length)}% average acknowledgment` : "No policies yet" },
                { href: `/risks`, icon: Gauge, label: "Risks", value: `${rk.filter((r) => r.residualImpact * r.residualLikelihood >= 10).length} high residual`, sub: `${rk.length} risks in the register` },
              ];
              return tiles.map((t) => (
                <Link key={t.label} href={t.href} className="group">
                  <Card className="h-full p-4 transition-[border-color,box-shadow] group-hover:border-line-strong group-hover:shadow-sm">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted"><t.icon className="size-3.5" />{t.label}</p>
                    <p className="mt-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">{t.value}</p>
                    <p className="mt-0.5 text-[12px] text-muted">{t.sub}</p>
                  </Card>
                </Link>
              ));
            })()}
          </div>

          <ForecastCard client={client} engagements={engs} controls={cs} />

          <Card>
            <CardHead title="Open gaps" sub={`${clientGaps.length} findings from gap analysis that still need work`} action={<Button size="xs" variant="ghost" asChild><Link href={`/gaps?client=${client.id}`}>Gap register <ArrowRight /></Link></Button>} />
            {clientGaps.length === 0 ? (
              <EmptyState title="No open gaps" body="Everything found in gap analysis has been closed." className="py-8" />
            ) : (
              <ul className="px-2 pb-2">
                {clientGaps.slice(0, 6).map((g) => {
                  const ctl = all[g.controlId];
                  const e = engagements.find((x) => x.id === g.engagementId)!;
                  return (
                    <li key={g.id}>
                      <Link href={`/clients/${client.id}/${e.framework}?control=${g.controlId}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-raised">
                        <SeverityBadge severity={g.severity} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-ink">{g.title}</span>
                          <span className="block truncate text-[12px] text-muted">{FRAMEWORKS[e.framework].short} {ctl?.code} · {person(g.ownerId).name}</span>
                        </span>
                        <GapStatusBadge status={g.status} />
                        <span className="hidden w-24 justify-end sm:flex"><DueChip due={g.due} /></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <ProgressRing value={overall.pct} size={64} stroke={5} />
              <div>
                <p className="text-[13px] font-semibold text-ink">Overall readiness</p>
                <p className="tnum text-[12.5px] text-muted">{overall.done} of {overall.total} controls approved across {engs.length} framework{engs.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {STATUS_ORDER.map((s) => (
                <p key={s} className="flex items-center justify-between text-[12.5px]"><span className="text-muted">{STATUS[s].label}</span><span className="tnum font-medium text-ink">{cs.filter((c) => c.status === s).length}</span></p>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Waiting on the client" sub="Evidence requests they can see in their dashboard" />
            <ul className="px-2 pb-2">
              {openReq.length === 0 && <li className="px-2 pb-3 text-[13px] text-muted">No open requests.</li>}
              {openReq.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-lg px-2 py-2">
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", r.status === "submitted" ? "bg-info-dot" : daysUntil(r.due) < 0 ? "bg-bad-dot" : "bg-warn-dot")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-5 text-ink">{r.title}</span>
                    <span className="block text-[12px] text-muted">{r.status === "submitted" ? "Submitted, waiting for review" : `Due ${dayLabel(r.due)}`}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><Inbox className="size-4 text-muted" />Evidence inbox</p>
            <p className="mt-1 text-[12.5px] leading-5 text-muted">The client forwards evidence by email; attachments are read and filed to the right controls automatically.</p>
            <button
              onClick={() => { navigator.clipboard?.writeText(`${client.id}@evidence.secureknots.com`); toast("Address copied"); }}
              className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-line-strong bg-raised px-3 py-2 text-left font-mono text-[12px] text-ink transition-colors hover:border-ink"
            >
              <span className="truncate">{client.id}@evidence.secureknots.com</span>
              <Copy className="size-3.5 shrink-0 text-muted" />
            </button>
          </Card>

          <Card>
            <CardHead title="People" />
            <ul className="space-y-1 px-2 pb-3">
              {client.contacts.map((ct) => (
                <li key={ct.email} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <Avatar person={{ name: ct.name, hue: client.hue, client: true }} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{ct.name}</span>
                    <span className="block truncate text-[12px] text-muted">{ct.title} · Client</span>
                  </span>
                  <a href={`mailto:${ct.email}`} className="rounded-md p-1.5 text-faint hover:bg-subtle hover:text-ink" aria-label={`Email ${ct.name}`}><Mail className="size-4" /></a>
                </li>
              ))}
              {client.team.map((m) => {
                const p = person(m);
                return (
                  <li key={m} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                    <Avatar person={p} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                      <span className="block truncate text-[12px] text-muted">{p.title}{m === client.ownerId ? " · Engagement owner" : ""}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHead title="Activity" />
            <ActivityFeed clientId={client.id} limit={6} />
          </Card>
          {client.trustPlan && (
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Globe className="size-4" /></span>
              <div className="min-w-0 flex-1 text-[12.5px]">
                <p className="font-medium text-ink">trust.{client.contacts[0].email.split("@")[1]}</p>
                <p className="text-muted">{client.publishedAt ? `Last published ${ago(client.publishedAt)}` : "Not published yet"}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
      <PublishDialog client={client} engagements={engs} open={publishing} onOpenChange={setPublishing} />
    </div>
  );
}
