"use client";

import { useMemo, useState } from "react";
import { Download, Globe, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/form";
import { Card, PageHeader, Skeleton } from "@/components/ui/misc";
import { useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import { cn, dateTime } from "@/lib/utils";

const TONE: Record<string, string> = {
  "Signed in": "bg-neutral-soft text-neutral",
  "Approved control": "bg-ok-soft text-ok",
  "Uploaded evidence": "bg-info-soft text-info",
  "Exported register": "bg-warn-soft text-warn",
  "Changed permission": "bg-bad-soft text-bad",
  "Sent client request": "bg-rev-soft text-rev",
  "Viewed evidence": "bg-neutral-soft text-neutral",
  "Published to Trust": "bg-subtle-2 text-ink",
};

export default function AuditLogPage() {
  const ready = useReady();
  const events = useStore((s) => s.auditEvents);
  const members = useStore((s) => s.members);
  const person = usePerson();
  const [who, setWho] = useState("all");
  const [what, setWhat] = useState("all");
  const [q, setQ] = useState("");
  const actions = useMemo(() => Array.from(new Set(events.map((e) => e.action))).sort(), [events]);
  const rows = useMemo(() => events.filter((e) => (who === "all" || e.actor === who) && (what === "all" || e.action === what) && (!q || `${e.target} ${e.ip} ${e.where}`.toLowerCase().includes(q.toLowerCase()))), [events, who, what, q]);

  const exportCsv = () => {
    const head = "time,person,action,target,ip,location";
    const lines = rows.map((e) => [e.at, person(e.actor).name, e.action, e.target, e.ip, e.where].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "secureknots-audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} events exported`);
  };

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Audit log"
        description="Every sign-in, view, upload, approval, export and permission change, with who did it and from where. Kept for three years and exportable for the auditors."
        actions={<Button variant="secondary" onClick={exportCsv}><Download /> Export CSV</Button>}
      />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search target, IP or place" className="w-full sm:w-[240px]" />
        <Select size="sm" className="w-[180px]" value={who} onValueChange={setWho} options={[{ value: "all", label: "Everyone" }, ...members.map((m) => ({ value: m.id, label: m.name }))]} />
        <Select size="sm" className="w-[190px]" value={what} onValueChange={setWhat} options={[{ value: "all", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a }))]} />
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-muted"><ShieldCheck className="size-3.5 text-ok" />Tamper-evident · read-only for everyone</span>
      </div>
      <Card className="mt-4 overflow-x-auto">
        {!ready ? <div className="space-y-2 p-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div> : (
          <table className="w-full min-w-[900px] table-fixed text-[13px]">
            <thead className="bg-raised text-left text-[12px] text-muted"><tr className="border-b border-line"><th className="h-9 w-[190px] pl-4 font-medium">Time</th><th className="w-[170px] font-medium">Person</th><th className="w-[170px] font-medium">Action</th><th className="font-medium">Target</th><th className="w-[200px] pr-4 font-medium">Source</th></tr></thead>
            <tbody>
              {rows.slice(0, 120).map((e) => {
                const p = person(e.actor);
                return (
                  <tr key={e.id} className="h-11 border-b border-line last:border-0 hover:bg-raised">
                    <td className="tnum pl-4 text-[12.5px] text-muted">{dateTime(e.at)}</td>
                    <td><span className="flex items-center gap-2 text-ink"><Avatar person={p} size="xs" />{p.name}</span></td>
                    <td><span className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", TONE[e.action] ?? "bg-subtle text-muted")}>{e.action}</span></td>
                    <td className="truncate pr-3 text-ink-2">{e.target}</td>
                    <td className="pr-4"><span className="flex items-center gap-1.5 text-[12px] text-muted"><Globe className="size-3.5" /><span className="font-mono">{e.ip}</span> · {e.where}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <p className="mt-3 text-[12px] text-faint">Showing {Math.min(120, rows.length)} of {rows.length} events. Export includes all of them.</p>
    </div>
  );
}
