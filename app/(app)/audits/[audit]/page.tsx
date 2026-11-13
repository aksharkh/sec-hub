"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CalendarPlus, Check, ChevronDown, FileArchive, Mail, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, Code, FrameworkChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Segmented } from "@/components/ui/form";
import { Card, CardHead, ProgressRing, Skeleton } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/overlay";
import { DueChip } from "@/components/workspace/ControlDetail";
import { PBC, PBC_ORDER, PHASE, PHASE_ORDER } from "@/lib/audit";
import { TONE_CLASS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import type { PbcStatus } from "@/lib/types";
import { cn, dateTime, dayLabel, daysUntil } from "@/lib/utils";

export default function AuditDetailPage() {
  const { audit: id } = useParams<{ audit: string }>();
  const ready = useReady();
  const audits = useStore((s) => s.audits);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const controls = useStore((s) => s.controls);
  const members = useStore((s) => s.members);
  const updatePbc = useStore((s) => s.updatePbc);
  const person = usePerson();
  const [filter, setFilter] = useState<PbcStatus | "all">("all");
  const [q, setQ] = useState("");

  const a = audits.find((x) => x.id === id);
  const rows = useMemo(() => (a ? a.pbc.filter((p) => (filter === "all" || p.status === filter) && (!q || p.request.toLowerCase().includes(q.toLowerCase()))) : []), [a, filter, q]);

  if (!ready) return <div className="mx-auto max-w-[1680px] px-4 pt-7 md:px-6"><Skeleton className="h-24 rounded-xl" /><Skeleton className="mt-4 h-[480px] rounded-xl" /></div>;
  if (!a) notFound();
  const c = clients.find((x) => x.id === a.clientId)!;
  const e = engagements.find((x) => x.id === a.engagementId)!;
  const counts = PBC_ORDER.map((s) => ({ s, n: a.pbc.filter((p) => p.status === s).length }));
  const accepted = counts.find((x) => x.s === "accepted")!.n;
  const pi = PHASE_ORDER.indexOf(a.phase);

  const move = (pid: string, status: PbcStatus) => {
    const prev = a.pbc.find((p) => p.id === pid)!.status;
    updatePbc(a.id, pid, { status });
    toast(`${a.pbc.find((p) => p.id === pid)!.ref} moved to ${PBC[status].label}`, { action: { label: "Undo", onClick: () => updatePbc(a.id, pid, { status: prev }) } });
  };

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <ClientMark name={c.name} hue={c.hue} size="xl" />
          <div>
            <Link href={`/clients/${c.id}`} className="text-[13px] text-muted hover:text-ink">{c.name}</Link>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink">{a.kind}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
              <FrameworkChip fw={e.framework} size="sm" /><Badge tone={PHASE[a.phase].tone}>{PHASE[a.phase].label}</Badge>
              <span>{a.firm} · {a.lead}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast.success("Status update sent to the auditor", { description: `${accepted} of ${a.pbc.length} requests accepted, ${counts.find((x) => x.s === "followup")!.n} follow-ups open.` })}><Mail /> Send status to auditor</Button>
          <Button variant="primary" onClick={() => toast.success("Auditor packet is being built", { description: "Accepted items, indexed by PBC reference, zipped for the auditor's portal." })}><FileArchive /> Build auditor packet</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <ProgressRing value={Math.round((accepted / a.pbc.length) * 100)} size={56} stroke={5} />
                <div>
                  <p className="tnum text-[14px] font-semibold text-ink">{accepted} of {a.pbc.length} accepted</p>
                  <p className="text-[12px] text-muted">Fieldwork {dayLabel(a.start)} to {dayLabel(a.end)}</p>
                </div>
              </div>
              <div className="flex min-w-[260px] flex-1 gap-1">
                {PHASE_ORDER.map((p, k) => (
                  <div key={p} className="flex-1">
                    <div className={cn("h-1.5 rounded-full", k < pi || a.phase === "complete" ? "bg-ok-dot" : k === pi ? "bg-ink" : "bg-subtle-2")} />
                    <p className={cn("mt-1.5 text-[11.5px] font-medium", k === pi ? "text-ink" : "text-faint")}>{PHASE[p].label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <h2 className="mr-auto text-[14px] font-semibold text-ink">Auditor requests <span className="font-normal text-muted">(PBC list)</span></h2>
              <SearchInput value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Search requests" className="w-full sm:w-[200px]" />
              <Segmented size="xs" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "requested", label: "New" }, { value: "followup", label: "Follow-up" }, { value: "submitted", label: "With auditor" }]} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed text-[13px]">
                <thead className="text-left text-[12px] text-muted">
                  <tr className="border-b border-line"><th className="h-9 w-[92px] pl-4 font-medium">Ref</th><th className="font-medium">Request</th><th className="w-[110px] font-medium">Control</th><th className="w-[150px] font-medium">Status</th><th className="w-[120px] font-medium">Assignee</th><th className="w-[110px] pr-4 font-medium">Due</th></tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {rows.map((p) => {
                      const ctl = p.controlId ? controls[p.controlId] : undefined;
                      const as = person(p.assigneeId);
                      return (
                        <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-12 border-b border-line last:border-0 hover:bg-raised">
                          <td className="pl-4"><Code>{p.ref}</Code></td>
                          <td className="truncate pr-3 text-ink">{p.request}{p.sample && <span className="ml-2 rounded-full bg-subtle px-1.5 py-px text-[11px] text-muted">sample of {p.sample}</span>}</td>
                          <td>{ctl ? <Link href={`/clients/${c.id}/${e.framework}?control=${ctl.id}`} className="inline-flex items-center gap-1 text-ink-2 hover:text-ink"><Code>{ctl.code}</Code><ArrowUpRight className="size-3 text-faint" /></Link> : <span className="text-faint">—</span>}</td>
                          <td>
                            <Menu>
                              <MenuTrigger className="rounded-full outline-none">
                                <span className={cn("inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[12px] font-medium", TONE_CLASS[PBC[p.status].tone].soft, TONE_CLASS[PBC[p.status].tone].fg)}>
                                  <span className={cn("size-1.5 rounded-full", TONE_CLASS[PBC[p.status].tone].dot)} />{PBC[p.status].label}<ChevronDown className="size-3 opacity-60" />
                                </span>
                              </MenuTrigger>
                              <MenuContent>
                                <MenuLabel>Move to</MenuLabel>
                                {PBC_ORDER.map((s) => (
                                  <MenuItem key={s} onSelect={() => move(p.id, s)}>
                                    <span className={cn("size-2 rounded-full", TONE_CLASS[PBC[s].tone].dot)} />{PBC[s].label}{s === p.status && <Check className="ml-auto !text-ink" />}
                                  </MenuItem>
                                ))}
                              </MenuContent>
                            </Menu>
                          </td>
                          <td>
                            <Menu>
                              <MenuTrigger className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-ink-2 outline-none hover:bg-subtle"><Avatar person={as} size="xs" />{as.name.split(" ")[0]}</MenuTrigger>
                              <MenuContent>
                                {members.filter((m) => c.team.includes(m.id)).map((m) => (
                                  <MenuItem key={m.id} onSelect={() => { updatePbc(a.id, p.id, { assigneeId: m.id }); toast(`${p.ref} assigned to ${m.name}`); }}><Avatar person={m} size="xs" />{m.name}</MenuItem>
                                ))}
                              </MenuContent>
                            </Menu>
                          </td>
                          <td className="pr-4"><DueChip due={p.due} status={p.status === "accepted" ? "approved" : undefined} /></td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHead title="Meetings" sub="Walkthroughs and checkpoints with the auditor" action={<Button size="xs" variant="ghost" onClick={() => toast("Calendar invite drafted", { description: "Sent from Outlook to the auditor, client and SecureKnots team." })}><CalendarPlus /> Schedule</Button>} />
            <ul className="px-2 pb-2">
              {a.meetings.map((m) => {
                const past = daysUntil(m.at) < 0;
                return (
                  <li key={m.at} className="flex items-start gap-3 rounded-lg px-2 py-2.5">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-center leading-none", past ? "bg-subtle text-faint" : "bg-ink text-surface")}>
                      <span><span className="block text-[9.5px] font-semibold uppercase">{new Date(m.at).toLocaleDateString("en-US", { month: "short" })}</span><span className="tnum block text-[13px] font-semibold">{new Date(m.at).getDate()}</span></span>
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-[13px] font-medium", past ? "text-muted" : "text-ink")}>{m.title}</span>
                      <span className="block text-[12px] text-muted">{dateTime(m.at).split(" at ")[1]} · {m.who}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <CardHead title="Request status" />
            <ul className="space-y-2.5 px-4 pb-4">
              {counts.map(({ s, n }) => (
                <li key={s}>
                  <div className="flex justify-between text-[12.5px]"><span className="text-ink-2">{PBC[s].label}</span><span className="tnum font-medium text-ink">{n}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle-2"><motion.div className={cn("h-full rounded-full", TONE_CLASS[PBC[s].tone].dot)} initial={{ width: 0 }} animate={{ width: `${(n / a.pbc.length) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><Users className="size-4 text-muted" />Who is involved</p>
            <p className="mt-2 text-[12.5px] leading-5 text-muted">{a.firm} ({a.lead}), {c.contacts[0].name} for {c.name}, and {c.team.map((t) => person(t).name.split(" ")[0]).join(", ")} for SecureKnots.</p>
            <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => toast.success("Auditor invited", { description: "Read-only access to accepted items for this audit only." })}><Send /> Invite auditor to view accepted items</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
