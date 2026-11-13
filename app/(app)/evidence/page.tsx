"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Download, LayoutGrid, Rows3, X, History, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, Code, StatusIcon } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Segmented, Select } from "@/components/ui/form";
import { Card, EmptyState, FileIcon, PageHeader, Skeleton } from "@/components/ui/misc";
import { FRAMEWORKS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import type { Evidence, FileKind } from "@/lib/types";
import { ago, cn, dateTime, daysUntil, fileSize } from "@/lib/utils";

const GROUPS: Record<string, FileKind[]> = { all: [], docs: ["pdf", "docx"], sheets: ["xlsx", "csv"], images: ["png"], archives: ["zip"] };

function stateTone(s: Evidence["state"]) {
  return s === "accepted" ? "ok" : s === "rejected" ? "bad" : "warn";
}

/** A believable first page of the document, drawn rather than rendered. */
function DocPreview({ e, client }: { e: Evidence; client: string }) {
  if (e.kind === "png")
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line bg-[linear-gradient(180deg,var(--subtle),var(--surface))] p-3">
        <div className="flex gap-1"><span className="size-2 rounded-full bg-bad-dot/70" /><span className="size-2 rounded-full bg-warn-dot/70" /><span className="size-2 rounded-full bg-ok-dot/70" /></div>
        <div className="mt-3 grid grid-cols-[60px_1fr] gap-3">
          <div className="space-y-1.5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className={cn("h-1.5 rounded", i === 1 ? "bg-brand/60" : "bg-line-strong")} />)}</div>
          <div className="space-y-2">
            <div className="h-2.5 w-2/3 rounded bg-ink/70" />
            {[0, 1, 2].map((i) => <div key={i} className="flex items-center justify-between rounded border border-line bg-surface px-2 py-1.5"><div className="h-1.5 w-1/2 rounded bg-line-strong" /><span className="h-3 w-6 rounded-full bg-ok-dot/70" /></div>)}
          </div>
        </div>
      </div>
    );
  const sheet = e.kind === "xlsx" || e.kind === "csv";
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm dark:bg-[#f6f6f4]">
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#1f3fae]">{client}</p>
      <p className="mt-1 text-[12px] font-semibold leading-tight text-[#0f1729]">{e.name}</p>
      <div className="mt-1 h-px bg-[#0f1729]/10" />
      {sheet ? (
        <div className="mt-3 grid grid-cols-4 gap-px overflow-hidden rounded-sm bg-[#0f1729]/10">
          {Array.from({ length: 36 }).map((_, i) => <div key={i} className={cn("h-3 bg-white", i < 4 && "bg-[#eef1f8]")}><div className="mx-1 mt-1 h-1 rounded bg-[#0f1729]/15" style={{ width: `${30 + ((i * 37) % 60)}%` }} /></div>)}
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={cn("h-1 rounded bg-[#0f1729]/12", i % 6 === 0 && "mt-3 h-1.5 w-1/3 bg-[#0f1729]/30")} style={i % 6 ? { width: `${70 + ((i * 29) % 30)}%` } : undefined} />
          ))}
        </div>
      )}
      <div className="absolute bottom-3 right-4 text-[7px] text-[#0f1729]/40">Page 1 of {e.kind === "pdf" ? 12 : 4}</div>
    </div>
  );
}

export default function EvidencePage() {
  const ready = useReady();
  const evidence = useStore((s) => s.evidence);
  const clients = useStore((s) => s.clients);
  const controls = useStore((s) => s.controls);
  const engagements = useStore((s) => s.engagements);
  const setState = useStore((s) => s.setEvidenceState);
  const person = usePerson();
  const [q, setQ] = useState("");
  const [client, setClient] = useState("all");
  const [group, setGroup] = useState("all");
  const [source, setSource] = useState<"all" | "client" | "internal">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expiring, setExpiring] = useState(false);
  const [sel, setSel] = useState<string | null>(null);

  const list = useMemo(
    () =>
      Object.values(evidence)
        .filter((e) => (client === "all" || e.clientId === client) && (group === "all" || GROUPS[group].includes(e.kind)) && (source === "all" || e.source === source) && (!q || e.name.toLowerCase().includes(q.toLowerCase())) && (!expiring || (!!e.expires && daysUntil(e.expires) <= 30)))
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [evidence, client, group, source, q, expiring],
  );
  const current = (sel && evidence[sel]) || list[0];

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Evidence"
        description="Every file clients and the team have uploaded. One file can satisfy controls in several frameworks, so it is uploaded once and linked everywhere."
        actions={<Button variant="secondary" onClick={() => toast.success("Export started", { description: `${list.length} files will be zipped by client and framework.` })}><Download /> Export</Button>}
      />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files" className="w-full sm:w-[220px]" />
        <Select size="sm" className="w-[190px]" value={client} onValueChange={setClient} options={[{ value: "all", label: "All clients" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
        <Segmented value={group} onChange={setGroup} options={[{ value: "all", label: "All" }, { value: "docs", label: "Documents" }, { value: "sheets", label: "Sheets" }, { value: "images", label: "Screenshots" }]} />
        <Segmented value={source} onChange={setSource} options={[{ value: "all", label: "Anyone" }, { value: "client", label: "From clients" }, { value: "internal", label: "From team" }]} />
        <Button size="sm" variant={expiring ? "soft" : "ghost"} onClick={() => setExpiring((x) => !x)}>
          <TimerReset /> Expiring soon · {Object.values(evidence).filter((e) => e.expires && daysUntil(e.expires) <= 30).length}
        </Button>
        <div className="ml-auto flex items-center gap-3">
          <span className="tnum text-[12px] text-faint">{list.length} files</span>
          <Segmented value={view} onChange={setView} options={[{ value: "grid", label: "", icon: <LayoutGrid /> }, { value: "list", label: "", icon: <Rows3 /> }]} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {!ready ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-[168px] rounded-xl" />)}</div>
          ) : list.length === 0 ? (
            <Card><EmptyState title="No files match" body="Try another client or clear the filters." /></Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {list.slice(0, 120).map((e, i) => {
                const c = clients.find((x) => x.id === e.clientId)!;
                return (
                  <motion.button
                    key={e.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 20) * 0.015 }}
                    onClick={() => setSel(e.id)}
                    className={cn("group rounded-xl border bg-surface p-2.5 text-left transition-[border-color,box-shadow]", current?.id === e.id ? "border-brand shadow-[0_0_0_3px_var(--ring)]" : "border-line hover:border-line-strong hover:shadow-sm")}
                  >
                    <div className="relative grid h-24 place-items-center rounded-lg bg-subtle">
                      <FileIcon kind={e.kind} size="lg" />
                      {e.controlIds.length > 1 && <span className="tnum absolute right-1.5 top-1.5 rounded-full bg-surface px-1.5 text-[10.5px] font-medium leading-[18px] text-brand-ink shadow-xs">×{e.controlIds.length}</span>}
                    </div>
                    <p className="mt-2.5 truncate text-[12.5px] font-medium text-ink" title={e.name}>{e.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted">
                      <ClientMark name={c.name} hue={c.hue} size="sm" className="!size-3.5 !rounded-[3px] !text-[6px]" />
                      <span className="truncate">{c.name}</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      {e.expires && daysUntil(e.expires) <= 30 ? (
                        <span className={cn("text-[11px] font-medium", daysUntil(e.expires) < 0 ? "text-bad" : "text-warn")}>{daysUntil(e.expires) < 0 ? "Expired" : `Expires in ${daysUntil(e.expires)}d`}</span>
                      ) : (
                        <span className="text-[11px] text-faint">{ago(e.uploadedAt)}</span>
                      )}
                      <span className={cn("size-1.5 rounded-full", e.state === "accepted" ? "bg-ok-dot" : e.state === "rejected" ? "bg-bad-dot" : "bg-warn-dot")} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead className="bg-raised text-left text-[12px] text-muted"><tr className="border-b border-line"><th className="h-9 pl-4 font-medium">File</th><th className="font-medium">Client</th><th className="font-medium">Uploaded by</th><th className="font-medium">Used in</th><th className="pr-4 font-medium">State</th></tr></thead>
                <tbody>
                  {list.slice(0, 150).map((e) => {
                    const c = clients.find((x) => x.id === e.clientId)!;
                    const p = person(e.uploadedBy);
                    return (
                      <tr key={e.id} onClick={() => setSel(e.id)} className={cn("h-12 cursor-pointer border-b border-line last:border-0", current?.id === e.id ? "bg-brand-soft/60" : "hover:bg-raised")}>
                        <td className="pl-4"><span className="flex items-center gap-2.5"><FileIcon kind={e.kind} size="sm" /><span className="max-w-[260px] truncate font-medium text-ink">{e.name}</span></span></td>
                        <td className="text-ink-2">{c.name}</td>
                        <td><span className="flex items-center gap-1.5 text-ink-2"><Avatar person={p} size="xs" />{p.name}</span></td>
                        <td className="tnum text-muted">{e.controlIds.length} control{e.controlIds.length > 1 ? "s" : ""}</td>
                        <td className="pr-4"><Badge tone={stateTone(e.state)}>{e.state[0].toUpperCase() + e.state.slice(1)}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Preview */}
        {ready && current && (
          <Card className="h-fit p-4 xl:sticky xl:top-4">
            {(() => {
              const c = clients.find((x) => x.id === current.clientId)!;
              const p = person(current.uploadedBy);
              return (
                <>
                  <DocPreview e={current} client={c.name} />
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{current.name}<span className="text-faint">.{current.kind}</span></p>
                      <p className="tnum mt-0.5 text-[12px] text-muted">{fileSize(current.sizeKb)} · version {current.version}</p>
                    </div>
                    <Badge tone={stateTone(current.state)}>{current.state[0].toUpperCase() + current.state.slice(1)}</Badge>
                  </div>
                  <div className="mt-4 space-y-2 rounded-xl border border-line px-3 py-2.5 text-[12.5px]">
                    <p className="flex items-center justify-between"><span className="text-muted">Client</span><span className="flex items-center gap-1.5 font-medium text-ink"><ClientMark name={c.name} hue={c.hue} size="sm" className="!size-4 !rounded-[4px] !text-[7px]" />{c.name}</span></p>
                    <p className="flex items-center justify-between"><span className="text-muted">Uploaded by</span><span className="flex items-center gap-1.5 text-ink"><Avatar person={p} size="xs" />{p.name}{p.client ? " (client)" : ""}</span></p>
                    <p className="flex items-center justify-between"><span className="text-muted">When</span><span className="text-ink">{dateTime(current.uploadedAt)}</span></p>
                    {current.expires && <p className="flex items-center justify-between"><span className="text-muted">Refresh by</span><span className={cn(daysUntil(current.expires) < 0 ? "font-medium text-bad" : daysUntil(current.expires) <= 30 ? "font-medium text-warn" : "text-ink")}>{dateTime(current.expires).split(" at ")[0]}</span></p>}
                  </div>
                  <p className="mb-2 mt-4 text-[12px] font-medium text-muted">Used in {current.controlIds.length} control{current.controlIds.length > 1 ? "s" : ""}</p>
                  <ul className="space-y-1">
                    {current.controlIds.map((cid) => {
                      const ctl = controls[cid];
                      if (!ctl) return null;
                      const e = engagements.find((x) => x.id === ctl.engagementId)!;
                      return (
                        <li key={cid}>
                          <Link href={`/clients/${ctl.clientId}/${e.framework}?control=${cid}`} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-subtle">
                            <StatusIcon status={ctl.status} />
                            <span className="font-medium text-ink-2">{FRAMEWORKS[e.framework].short}</span>
                            <Code className="text-[11.5px]">{ctl.code}</Code>
                            <span className="flex-1 truncate text-muted">{ctl.title}</span>
                            <ArrowUpRight className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {current.version > 1 && (
                    <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><History className="size-3.5" />{current.version - 1} earlier version{current.version > 2 ? "s" : ""} kept</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1" variant="secondary" disabled={current.state === "rejected"} onClick={() => { setState(current.id, "rejected"); toast(`${current.name} rejected`, { description: "The uploader is asked for a replacement." }); }}><X /> Reject</Button>
                    <Button className="flex-1" variant="primary" disabled={current.state === "accepted"} onClick={() => { setState(current.id, "accepted"); toast.success(`${current.name} accepted`); }}><Check /> Accept</Button>
                  </div>
                </>
              );
            })()}
          </Card>
        )}
      </div>
    </div>
  );
}
