"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarClock, Download, FileArchive, FileSpreadsheet, FolderTree, Kanban, ListFilter, MailPlus, Rows3, UserRound, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarStack, ClientMark } from "@/components/ui/avatar";
import { StatusIcon } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Segmented } from "@/components/ui/form";
import { ProgressRing, Skeleton, StatusBar, Dot } from "@/components/ui/misc";
import { Menu, MenuCheck, MenuContent, MenuItem, MenuLabel, MenuTrigger, Sheet } from "@/components/ui/overlay";
import { Board } from "@/components/workspace/Board";
import { ControlDetail } from "@/components/workspace/ControlDetail";
import { ControlTable } from "@/components/workspace/ControlTable";
import { FolderView } from "@/components/workspace/FolderView";
import { RequestDialog } from "@/components/workspace/RequestDialog";
import { DOMAINS, FRAMEWORKS, STATUS, STATUS_ORDER, TONE_CLASS } from "@/lib/catalog";
import { setQuery, useQuery, useReady } from "@/lib/hooks";
import { progressOf, usePerson, useStore } from "@/lib/store";
import type { ControlStatus, DomainId, FrameworkKey } from "@/lib/types";
import { cn, dayLabel, daysUntil } from "@/lib/utils";

type View = "board" | "table" | "folders";

function Loading() {
  return (
    <div className="px-4 py-6 md:px-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-64" />
        </div>
      </div>
      <Skeleton className="mt-8 h-2 w-full" />
      <div className="mt-8 flex gap-3 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[272px] shrink-0 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Workspace() {
  const params = useParams<{ client: string; framework: FrameworkKey }>();
  const ready = useReady();
  const search = useQuery();
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const all = useStore((s) => s.controls);
  const members = useStore((s) => s.members);
  const person = usePerson();

  const [view, setView] = useState<View>("board");
  const [q, setQ] = useState("");
  const [statuses, setStatuses] = useState<Set<ControlStatus>>(new Set());
  const [owners, setOwners] = useState<Set<string>>(new Set());
  const [domains, setDomains] = useState<Set<DomainId>>(new Set());
  const [overdue, setOverdue] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const client = clients.find((c) => c.id === params.client);
  const engagement = engagements.find((e) => e.clientId === params.client && e.framework === params.framework);
  const controls = useMemo(() => Object.values(all).filter((c) => c.engagementId === engagement?.id), [all, engagement]);
  const filtered = useMemo(
    () =>
      controls.filter(
        (c) =>
          (!q || `${c.code} ${c.title}`.toLowerCase().includes(q.toLowerCase())) &&
          (!statuses.size || statuses.has(c.status)) &&
          (!owners.size || owners.has(c.ownerId)) &&
          (!domains.size || domains.has(c.domain)) &&
          (!overdue || (c.status !== "approved" && daysUntil(c.due) < 0)),
      ),
    [controls, q, statuses, owners, domains, overdue],
  );

  const open = search.get("control");
  const setOpen = (id: string | null) => setQuery("control", id);

  if (!ready) return <Loading />;
  if (!client || !engagement) notFound();

  const prog = progressOf(controls);
  const counts = STATUS_ORDER.map((s) => ({ s, n: controls.filter((c) => c.status === s).length }));
  const overdueCount = controls.filter((c) => c.status !== "approved" && daysUntil(c.due) < 0).length;
  const days = daysUntil(engagement.target);
  const filtersOn = statuses.size + owners.size + domains.size + (overdue ? 1 : 0) + (q ? 1 : 0);
  const clientEngs = engagements.filter((e) => e.clientId === client.id);
  const toggleSet = <T,>(set: Set<T>, v: T, fn: (s: Set<T>) => void) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); fn(n); };

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-10 pt-5 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <ClientMark name={client.name} hue={client.hue} size="lg" className="mt-0.5" />
          <div className="min-w-0">
            <Link href={`/clients/${client.id}`} className="text-[13px] text-muted transition-colors hover:text-ink">{client.name}</Link>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink">{FRAMEWORKS[engagement.framework].name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted">
              <span className={cn("flex items-center gap-1", days >= 0 && days <= 30 && "font-medium text-warn")}>
                <CalendarClock className="size-3.5" />
                {days >= 0 ? `Target ${dayLabel(engagement.target)} · ${days} days left` : `Completed ${dayLabel(engagement.target)}`}
              </span>
              <Dot />
              <span>{engagement.auditor}</span>
              <Dot />
              <AvatarStack people={client.team.map(person)} size="xs" />
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-3 rounded-xl border border-line bg-raised py-1.5 pl-1.5 pr-4">
            <ProgressRing value={prog.pct} size={40} />
            <div className="leading-tight">
              <p className="tnum text-[13px] font-semibold text-ink">{prog.done} of {prog.total} approved</p>
              <p className="tnum text-[12px] text-muted">{overdueCount ? <span className="text-bad">{overdueCount} overdue</span> : "Nothing overdue"}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setRequestOpen(true)}>
            <MailPlus /> Request evidence
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Export"><Download /></Button>
            </MenuTrigger>
            <MenuContent align="end">
              <MenuLabel>Export</MenuLabel>
              <MenuItem onSelect={() => toast.success("Control register exported", { description: `${client.name} ${FRAMEWORKS[engagement.framework].short} register.xlsx` })}><FileSpreadsheet />Control register (Excel)</MenuItem>
              <MenuItem onSelect={() => toast.success("Auditor packet is being prepared", { description: "Approved controls and accepted evidence, zipped by domain." })}><FileArchive />Auditor packet (ZIP)</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>

      {/* Engagement switcher */}
      {clientEngs.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {clientEngs.map((e) => {
            const on = e.id === engagement.id;
            const p = progressOf(Object.values(all).filter((c) => c.engagementId === e.id));
            return (
              <Link
                key={e.id}
                href={`/clients/${client.id}/${e.framework}`}
                className={cn("flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[12.5px] font-medium transition-colors", on ? "border-ink bg-ink text-surface" : "border-line text-ink-2 hover:border-line-strong hover:bg-subtle")}
              >
                <span className="size-1.5 rounded-full" style={{ background: `hsl(${FRAMEWORKS[e.framework].hue} 62% 58%)` }} />
                {FRAMEWORKS[e.framework].short}
                <span className={cn("tnum", on ? "text-surface/60" : "text-faint")}>{p.pct}%</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Distribution */}
      <div className="mt-6">
        <StatusBar controls={controls} height={8} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {counts.map(({ s, n }) => {
            const on = statuses.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSet(statuses, s, setStatuses)}
                className={cn("flex h-7 items-center gap-1.5 rounded-full border pl-2 pr-2.5 text-[12px] font-medium transition-colors", on ? cn(TONE_CLASS[STATUS[s].tone].soft, "border-transparent text-ink") : "border-line text-ink-2 hover:bg-subtle")}
              >
                <StatusIcon status={s} />
                {STATUS[s].label}
                <span className="tnum text-faint">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-4 mt-4 flex flex-wrap items-center gap-2 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur-xl md:-mx-6 md:px-6">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter controls" className="w-full sm:w-[220px]" />
        <Menu>
          <MenuTrigger asChild>
            <Button size="sm" variant={owners.size ? "soft" : "ghost"}><UserRound /> Owner{owners.size ? ` · ${owners.size}` : ""}</Button>
          </MenuTrigger>
          <MenuContent>
            {members.filter((m) => client.team.includes(m.id)).map((m) => (
              <MenuCheck key={m.id} checked={owners.has(m.id)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggleSet(owners, m.id, setOwners)}>
                <Avatar person={m} size="xs" />{m.name}
              </MenuCheck>
            ))}
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger asChild>
            <Button size="sm" variant={domains.size ? "soft" : "ghost"}><ListFilter /> Domain{domains.size ? ` · ${domains.size}` : ""}</Button>
          </MenuTrigger>
          <MenuContent className="max-h-[340px] overflow-y-auto">
            {DOMAINS.filter((d) => controls.some((c) => c.domain === d.id)).map((d) => (
              <MenuCheck key={d.id} checked={domains.has(d.id)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggleSet(domains, d.id, setDomains)}>
                {d.name}
              </MenuCheck>
            ))}
          </MenuContent>
        </Menu>
        <Button size="sm" variant={overdue ? "soft" : "ghost"} onClick={() => setOverdue((o) => !o)}>
          {overdue && <Check />}Overdue{overdueCount ? ` · ${overdueCount}` : ""}
        </Button>
        {filtersOn > 0 && (
          <Button size="sm" variant="ghost" className="text-muted" onClick={() => { setQ(""); setStatuses(new Set()); setOwners(new Set()); setDomains(new Set()); setOverdue(false); }}>
            <X /> Clear
          </Button>
        )}
        <span className="tnum ml-auto hidden text-[12px] text-faint sm:inline">{filtered.length} of {controls.length}</span>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "board", label: "Board", icon: <Kanban /> },
            { value: "table", label: "Table", icon: <Rows3 /> },
            { value: "folders", label: "Folders", icon: <FolderTree /> },
          ]}
        />
      </div>

      <div className="mt-5">
        {view === "board" && <Board controls={filtered} onOpen={setOpen} />}
        {view === "table" && <ControlTable controls={filtered} onOpen={setOpen} />}
        {view === "folders" && <FolderView client={client} engagement={engagement} controls={filtered} onOpen={setOpen} />}
      </div>

      <Sheet open={!!open && !!all[open]} onOpenChange={(o) => !o && setOpen(null)} title="Control details">
        {open && all[open] && <ControlDetail id={open} />}
      </Sheet>
      <RequestDialog client={client} controls={controls} open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}

export default function EngagementPage() {
  return <Workspace />;
}
