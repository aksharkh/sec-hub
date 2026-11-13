"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, FrameworkChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Segmented, Select } from "@/components/ui/form";
import { Card, PageHeader, Skeleton, Stat } from "@/components/ui/misc";
import { useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import type { PolicyStatus } from "@/lib/types";
import { POLICY_STATUS } from "@/lib/policy";
import { cn, dayLabel, daysUntil } from "@/lib/utils";


export default function PoliciesPage() {
  const ready = useReady();
  const policies = useStore((s) => s.policies);
  const clients = useStore((s) => s.clients);
  const person = usePerson();
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState<PolicyStatus | "all">("all");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () => policies.filter((p) => (client === "all" || p.clientId === client) && (status === "all" || p.status === status) && (!q || p.title.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.reviewDue.localeCompare(b.reviewDue)),
    [policies, client, status, q],
  );
  const scoped = policies.filter((p) => client === "all" || p.clientId === client);
  const approved = scoped.filter((p) => p.status === "approved");
  const avgAck = approved.length ? Math.round(approved.reduce((n, p) => n + p.ackRate, 0) / approved.length) : 0;
  const dueSoon = approved.filter((p) => daysUntil(p.reviewDue) <= 30).length;

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Policies"
        description="Every client's policy set, written from SecureKnots templates and mapped to their frameworks. Versions, approvals, review dates and employee acknowledgment in one place."
        actions={<Button variant="primary" onClick={() => toast("New policy from template", { description: "Pick a SecureKnots template; it is pre-filled with the client's name, frameworks and owners." })}><Plus /> New from template</Button>}
      />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Policies" value={scoped.length} hint={`${approved.length} approved`} />
        <Stat label="Employee acknowledgment" value={`${avgAck}%`} hint="average, approved policies" />
        <Stat label="Reviews due in 30 days" value={dueSoon} hint="annual review cycle" />
        <Stat label="Waiting for approval" value={scoped.filter((p) => p.status === "in_review").length} hint="drafts sent to the client" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policies" className="w-full sm:w-[220px]" />
        <Select size="sm" className="w-[190px]" value={client} onValueChange={setClient} options={[{ value: "all", label: "All clients" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
        <Segmented value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, { value: "approved", label: "Approved" }, { value: "in_review", label: "In review" }, { value: "draft", label: "Draft" }]} />
      </div>

      <Card className="mt-4 overflow-x-auto">
        {!ready ? (
          <div className="space-y-2 p-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : (
          <table className="w-full min-w-[980px] table-fixed text-[13px]">
            <thead className="bg-raised text-left text-[12px] text-muted">
              <tr className="border-b border-line"><th className="h-9 pl-4 font-medium">Policy</th><th className="w-[190px] font-medium">Client</th><th className="w-[80px] font-medium">Version</th><th className="w-[120px] font-medium">Status</th><th className="w-[170px] font-medium">Acknowledged</th><th className="w-[120px] font-medium">Next review</th><th className="w-[110px] pr-4 font-medium">Owner</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const c = clients.find((x) => x.id === p.clientId)!;
                const o = person(p.ownerId);
                const d = daysUntil(p.reviewDue);
                return (
                  <tr key={p.id} className="h-14 border-b border-line last:border-0 hover:bg-raised">
                    <td className="pl-4 pr-3">
                      <Link href={`/policies/${p.id}`} className="group flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-subtle text-muted transition-colors group-hover:text-ink"><FileText className="size-4" /></span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink group-hover:underline">{p.title}</span>
                          <span className="flex gap-1 pt-0.5">{p.frameworks.slice(0, 3).map((f) => <FrameworkChip key={f} fw={f} size="sm" />)}{p.frameworks.length > 3 && <span className="text-[11px] text-faint">+{p.frameworks.length - 3}</span>}</span>
                        </span>
                      </Link>
                    </td>
                    <td><span className="flex items-center gap-2 text-ink-2"><ClientMark name={c.name} hue={c.hue} size="sm" /><span className="truncate">{c.name}</span></span></td>
                    <td className="tnum font-mono text-[12px] text-ink-2">v{p.version}</td>
                    <td><Badge tone={POLICY_STATUS[p.status].tone}>{POLICY_STATUS[p.status].label}</Badge></td>
                    <td className="pr-6">
                      {p.status === "approved" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle-2"><div className={cn("h-full rounded-full", p.ackRate >= 95 ? "bg-ok-dot" : p.ackRate >= 85 ? "bg-ink/70 dark:bg-white/70" : "bg-warn-dot")} style={{ width: `${p.ackRate}%` }} /></div>
                          <span className="tnum w-9 text-right text-[12px] text-ink-2">{p.ackRate}%</span>
                        </div>
                      ) : <span className="text-faint">—</span>}
                    </td>
                    <td className={cn("tnum text-[12.5px]", p.status !== "approved" ? "text-faint" : d < 0 ? "font-medium text-bad" : d <= 30 ? "font-medium text-warn" : "text-muted")}>{p.status !== "approved" ? "After approval" : d < 0 ? `${-d}d overdue` : dayLabel(p.reviewDue)}</td>
                    <td className="pr-4"><span className="flex items-center gap-1.5 text-ink-2"><Avatar person={o} size="xs" />{o.name.split(" ")[0]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
