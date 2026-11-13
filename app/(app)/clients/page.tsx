"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, LayoutGrid, Plus, Rows3, Globe } from "lucide-react";
import { Avatar, AvatarStack, ClientMark } from "@/components/ui/avatar";
import { openNewClient } from "@/components/clients/NewClientWizard";
import { Badge, FrameworkChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Segmented } from "@/components/ui/form";
import { Card, PageHeader, ProgressRing, Skeleton, StatusBar } from "@/components/ui/misc";
import { StagePill } from "@/components/ui/stage";
import { useReady } from "@/lib/hooks";
import { progressOf, usePerson, useStore } from "@/lib/store";
import { cn, dayLabel, daysUntil } from "@/lib/utils";

export default function ClientsPage() {
  const ready = useReady();
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const controls = useStore((s) => s.controls);
  const person = usePerson();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState<"all" | "active" | "certified">("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = Object.values(controls);
    return clients
      .filter((c) => (filter === "all" ? true : filter === "certified" ? c.stage === "certified" : c.stage !== "certified"))
      .filter((c) => !q || `${c.name} ${c.industry} ${c.hq}`.toLowerCase().includes(q.toLowerCase()))
      .map((c) => {
        const cs = list.filter((x) => x.clientId === c.id);
        const engs = engagements.filter((e) => e.clientId === c.id);
        const next = engs.map((e) => e.target).filter((t) => daysUntil(t) >= 0).sort()[0];
        return { c, cs, engs, p: progressOf(cs), next };
      });
  }, [clients, engagements, controls, filter, q]);

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Clients"
        description="Every client, the frameworks SecureKnots is preparing them for, and how far along each one is."
        actions={<Button variant="primary" onClick={openNewClient}><Plus /> New client</Button>}
      />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" className="w-full sm:w-[240px]" />
        <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: `All ${clients.length || ""}` }, { value: "active", label: "In progress" }, { value: "certified", label: "Certified" }]} />
        <div className="ml-auto">
          <Segmented value={view} onChange={setView} options={[{ value: "grid", label: "Grid", icon: <LayoutGrid /> }, { value: "table", label: "Table", icon: <Rows3 /> }]} />
        </div>
      </div>

      {!ready ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[230px] rounded-xl" />)}
        </div>
      ) : view === "grid" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map(({ c, cs, engs, p, next }, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <Link href={`/clients/${c.id}`} className="group block h-full">
                <Card className="flex h-full flex-col p-4 transition-[border-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <ClientMark name={c.name} hue={c.hue} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{c.name}</p>
                      <p className="truncate text-[12.5px] text-muted">{c.industry} · {c.hq}</p>
                    </div>
                    <ProgressRing value={p.pct} size={38} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <StagePill stage={c.stage} />
                    {c.trustPlan && (
                      <Badge tone="brand" dot={false} className="gap-1"><Globe className="size-3" />{c.publishedAt ? "Trust · live" : "Trust plan"}</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">{engs.map((e) => <FrameworkChip key={e.id} fw={e.framework} size="sm" />)}</div>
                  <StatusBar controls={cs} className="mt-auto pt-5" />
                  <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <Avatar person={person(c.ownerId)} size="xs" />
                      {person(c.ownerId).name.split(" ")[0]}
                    </span>
                    <span className={cn("tnum flex items-center gap-1", next && daysUntil(next) <= 30 && "font-medium text-warn")}>
                      <CalendarClock className="size-3.5" />
                      {next ? dayLabel(next) : "Certified"}
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead className="bg-raised text-left text-[12px] text-muted">
              <tr className="border-b border-line">
                <th className="h-9 pl-4 font-medium">Client</th>
                <th className="font-medium">Stage</th>
                <th className="font-medium">Frameworks</th>
                <th className="w-[200px] font-medium">Progress</th>
                <th className="font-medium">Next target</th>
                <th className="font-medium">Team</th>
                <th className="pr-4 font-medium">Trust</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, cs, engs, p, next }) => (
                <tr key={c.id} className="h-14 border-b border-line last:border-0 hover:bg-raised">
                  <td className="pl-4">
                    <Link href={`/clients/${c.id}`} className="flex items-center gap-3">
                      <ClientMark name={c.name} hue={c.hue} />
                      <span>
                        <span className="block font-medium text-ink hover:underline">{c.name}</span>
                        <span className="block text-[12px] text-muted">{c.industry}</span>
                      </span>
                    </Link>
                  </td>
                  <td><StagePill stage={c.stage} /></td>
                  <td><div className="flex flex-wrap gap-1">{engs.map((e) => <FrameworkChip key={e.id} fw={e.framework} size="sm" />)}</div></td>
                  <td className="pr-6"><div className="flex items-center gap-2.5"><StatusBar controls={cs} className="flex-1" /><span className="tnum w-8 text-right text-[12px] font-medium">{p.pct}%</span></div></td>
                  <td className="tnum text-[12.5px] text-muted">{next ? dayLabel(next) : "—"}</td>
                  <td><AvatarStack people={c.team.map(person)} size="xs" /></td>
                  <td className="pr-4">{c.trustPlan ? <Badge tone={c.publishedAt ? "ok" : "brand"}>{c.publishedAt ? "Live" : "Plan"}</Badge> : <span className="text-faint">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

