"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CircleCheck, RotateCcw, ScanSearch, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Code, GapStatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select, Tabs, Textarea, Label } from "@/components/ui/form";
import { Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Sheet, SheetClose } from "@/components/ui/overlay";
import { DueChip } from "@/components/workspace/ControlDetail";
import { FRAMEWORKS, GAP_STATUS, SEVERITY, TONE_CLASS } from "@/lib/catalog";
import { useQuery, useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import type { GapStatus, Severity } from "@/lib/types";
import { ago, cn } from "@/lib/utils";

function Register() {
  const ready = useReady();
  const params = useQuery();
  const gaps = useStore((s) => s.gaps);
  const clients = useStore((s) => s.clients);
  const controls = useStore((s) => s.controls);
  const engagements = useStore((s) => s.engagements);
  const updateGap = useStore((s) => s.updateGap);
  const person = usePerson();
  const [tab, setTab] = useState<GapStatus | "active">("active");
  const [client, setClient] = useState(params.get("client") ?? "all");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const scoped = useMemo(() => gaps.filter((g) => (client === "all" || g.clientId === client) && (sev === "all" || g.severity === sev) && (!q || g.title.toLowerCase().includes(q.toLowerCase()))), [gaps, client, sev, q]);
  const rows = useMemo(
    () => scoped.filter((g) => (tab === "active" ? g.status !== "closed" : g.status === tab)).sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank || a.due.localeCompare(b.due)),
    [scoped, tab],
  );
  const g = gaps.find((x) => x.id === open);
  const bySev = (["critical", "high", "medium", "low"] as Severity[]).map((s) => ({ s, n: gaps.filter((x) => x.severity === s && x.status !== "closed" && (client === "all" || x.clientId === client)).length }));
  const total = bySev.reduce((a, b) => a + b.n, 0) || 1;

  const move = (id: string, status: GapStatus, msg: string) => {
    const prev = gaps.find((x) => x.id === id)?.status;
    updateGap(id, { status });
    toast(msg, { action: prev ? { label: "Undo", onClick: () => updateGap(id, { status: prev }) } : undefined });
  };

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader title="Gap register" description="Findings from gap analysis across every client. A gap is fixed by its owner, marked for recheck, then closed after SecureKnots verifies the fix." />

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12.5px] font-medium text-muted">Open gaps by severity</p>
            <p className="tnum mt-1 text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink">{bySev.reduce((a, b) => a + b.n, 0)}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {bySev.map(({ s, n }) => (
              <span key={s} className="flex items-center gap-2 text-[12.5px] text-muted">
                <span className={cn("size-2 rounded-[2px]", TONE_CLASS[SEVERITY[s].tone].dot)} />
                {SEVERITY[s].label}
                <span className="tnum font-medium text-ink">{n}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex h-2.5 gap-[2px]">
          {bySev.filter((b) => b.n).map(({ s, n }) => (
            <span key={s} className={cn("rounded-[3px]", TONE_CLASS[SEVERITY[s].tone].dot)} style={{ flexGrow: n / total, flexBasis: 0 }} title={`${SEVERITY[s].label}: ${n}`} />
          ))}
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gaps" className="w-full sm:w-[220px]" />
        <Select size="sm" className="w-[190px]" value={client} onValueChange={setClient} options={[{ value: "all", label: "All clients" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
        <Select size="sm" className="w-[150px]" value={sev} onValueChange={(v) => setSev(v as Severity | "all")} options={[{ value: "all", label: "Any severity" }, ...(["critical", "high", "medium", "low"] as Severity[]).map((s) => ({ value: s, label: SEVERITY[s].label }))]} />
      </div>
      <Tabs
        className="mt-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "active", label: "All open", count: scoped.filter((x) => x.status !== "closed").length },
          ...(["open", "remediating", "recheck", "closed"] as GapStatus[]).map((s) => ({ value: s, label: GAP_STATUS[s].label, count: scoped.filter((x) => x.status === s).length })),
        ]}
      />

      {!ready ? (
        <div className="mt-4 space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing here" body="No gaps match these filters." />
      ) : (
        <div className="-mx-4 mt-1 overflow-x-auto md:mx-0">
          <table className="w-full min-w-[960px] table-fixed text-[13px]">
            <thead className="text-left text-[12px] text-muted">
              <tr className="border-b border-line"><th className="h-10 w-[120px] pl-4 font-medium md:pl-2">Severity</th><th className="font-medium">Gap</th><th className="w-[210px] font-medium">Client</th><th className="w-[140px] font-medium">Status</th><th className="w-[120px] font-medium">Owner</th><th className="w-[120px] pr-4 font-medium md:pr-2">Due</th></tr>
            </thead>
            <tbody>
              {rows.map((x) => {
                const c = clients.find((k) => k.id === x.clientId)!;
                const ctl = controls[x.controlId];
                const e = engagements.find((k) => k.id === x.engagementId)!;
                const o = person(x.ownerId);
                return (
                  <tr key={x.id} onClick={() => setOpen(x.id)} className="h-14 cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-raised">
                    <td className="pl-4 md:pl-2"><SeverityBadge severity={x.severity} /></td>
                    <td className="max-w-0 pr-4">
                      <p className="truncate font-medium text-ink">{x.title}</p>
                      <p className="truncate text-[12px] text-muted">{FRAMEWORKS[e.framework].short} {ctl?.code} · {ctl?.title}</p>
                    </td>
                    <td><span className="flex items-center gap-2 text-ink-2"><ClientMark name={c.name} hue={c.hue} size="sm" />{c.name}</span></td>
                    <td><GapStatusBadge status={x.status} /></td>
                    <td><span className="flex items-center gap-1.5 text-ink-2"><Avatar person={o} size="xs" />{o.name.split(" ")[0]}</span></td>
                    <td className="pr-4 md:pr-2"><DueChip due={x.due} status={x.status === "closed" ? "approved" : undefined} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!g} onOpenChange={(o) => !o && setOpen(null)} title="Gap details" className="w-[min(560px,calc(100vw-16px))]">
        {g && (() => {
          const c = clients.find((k) => k.id === g.clientId)!;
          const ctl = controls[g.controlId];
          const e = engagements.find((k) => k.id === g.engagementId)!;
          return (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                <ClientMark name={c.name} hue={c.hue} size="sm" />
                <span className="text-[13px] text-muted">{c.name}</span>
                <SheetClose asChild><Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Close"><X /></Button></SheetClose>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <div className="flex flex-wrap gap-1.5"><SeverityBadge severity={g.severity} /><GapStatusBadge status={g.status} /></div>
                <h2 className="mt-3 text-[20px] font-semibold leading-snug tracking-[-0.02em] text-ink">{g.title}</h2>
                <p className="mt-2 text-[13.5px] leading-6 text-ink-2">{g.detail}</p>
                <div className="mt-5 space-y-2 rounded-xl border border-line px-4 py-3 text-[13px]">
                  <p className="flex items-center justify-between"><span className="text-muted">Control</span>{ctl && <Link href={`/clients/${c.id}/${e.framework}?control=${ctl.id}`} className="flex items-center gap-1.5 font-medium text-brand-ink hover:underline">{FRAMEWORKS[e.framework].short} <Code>{ctl.code}</Code><ArrowUpRight className="size-3.5" /></Link>}</p>
                  <p className="flex items-center justify-between"><span className="text-muted">Owner</span><span className="flex items-center gap-1.5 text-ink"><Avatar person={person(g.ownerId)} size="xs" />{person(g.ownerId).name}</span></p>
                  <p className="flex items-center justify-between"><span className="text-muted">Due</span><DueChip due={g.due} /></p>
                  <p className="flex items-center justify-between"><span className="text-muted">Found</span><span className="text-ink">{ago(g.createdAt)}</span></p>
                </div>
                <div className="mt-5">
                  <Label>Remediation plan</Label>
                  <Textarea defaultValue={g.plan} onBlur={(ev) => ev.target.value !== g.plan && (updateGap(g.id, { plan: ev.target.value }), toast("Plan saved"))} className="min-h-[96px]" />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-raised px-5 py-3">
                {g.status === "closed" ? (
                  <Button variant="secondary" onClick={() => move(g.id, "open", "Gap reopened")}><RotateCcw /> Reopen</Button>
                ) : (
                  <>
                    {g.status === "open" && <Button variant="secondary" onClick={() => move(g.id, "remediating", "Marked as remediating")}>Start remediation</Button>}
                    {g.status !== "recheck" && <Button variant="secondary" onClick={() => move(g.id, "recheck", "Sent for recheck")}><ScanSearch /> Mark for recheck</Button>}
                    {g.status === "recheck" && <Button variant="secondary" onClick={() => move(g.id, "remediating", "Fix not verified, back to remediation")}><RotateCcw /> Fix not verified</Button>}
                    <Button variant="primary" disabled={g.status !== "recheck"} onClick={() => { move(g.id, "closed", "Gap closed"); setOpen(null); }}><CircleCheck /> Close gap</Button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}

export default function GapsPage() {
  return <Register />;
}
