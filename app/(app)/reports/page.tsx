"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, Download, FileBarChart, Mail, Presentation, ScrollText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { ClientMark } from "@/components/ui/avatar";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Card, PageHeader, Skeleton, StatusBar } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { FRAMEWORKS, SEVERITY, STATUS, STATUS_ORDER, TONE_CLASS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { progressOf, usePerson, useStore } from "@/lib/store";
import { cn, dayLabel, daysUntil } from "@/lib/utils";

const TEMPLATES = [
  { id: "readiness", name: "Readiness report", desc: "Client-facing progress by framework, open items and next 30 days", icon: FileBarChart },
  { id: "board", name: "Board pack", desc: "One page for the client's leadership: status, risk and dates", icon: Presentation },
  { id: "gaps", name: "Gap analysis report", desc: "Every finding with severity, owner and remediation plan", icon: ShieldAlert },
  { id: "auditor", name: "Auditor packet index", desc: "Approved controls and accepted evidence, indexed for the auditor", icon: ScrollText },
] as const;

export default function ReportsPage() {
  const ready = useReady();
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const controls = useStore((s) => s.controls);
  const gaps = useStore((s) => s.gaps);
  const risks = useStore((s) => s.risks);
  const evidence = useStore((s) => s.evidence);
  const person = usePerson();
  const [tpl, setTpl] = useState<(typeof TEMPLATES)[number]["id"]>("readiness");
  const [cid, setCid] = useState("northwind");
  const [schedule, setSchedule] = useState(false);

  const c = clients.find((x) => x.id === cid);
  const data = useMemo(() => {
    const cs = Object.values(controls).filter((x) => x.clientId === cid);
    const engs = engagements.filter((e) => e.clientId === cid);
    return {
      cs, engs,
      overall: progressOf(cs),
      openGaps: gaps.filter((g) => g.clientId === cid && g.status !== "closed").sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank),
      topRisks: risks.filter((r) => r.clientId === cid).sort((a, b) => b.residualImpact * b.residualLikelihood - a.residualImpact * a.residualLikelihood).slice(0, 4),
      next: cs.filter((x) => x.status !== "approved" && daysUntil(x.due) >= 0 && daysUntil(x.due) <= 30).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6),
      approved: cs.filter((x) => x.status === "approved"),
    };
  }, [controls, engagements, gaps, risks, cid]);
  const t = TEMPLATES.find((x) => x.id === tpl)!;

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Reports"
        description="Client-ready reports built from live Workspace data, in SecureKnots branding. Preview, export to PDF or schedule them to arrive in the client's inbox."
        actions={
          <>
            <Select size="sm" className="w-[200px]" value={cid} onValueChange={setCid} options={clients.map((x) => ({ value: x.id, label: x.name }))} />
            <Button variant="secondary" onClick={() => setSchedule(true)}><CalendarClock /> Schedule</Button>
            <Button variant="primary" onClick={() => toast.success(`${t.name} exported`, { description: `${c?.name} ${t.name.toLowerCase()}.pdf` })}><Download /> Export PDF</Button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-2">
          {TEMPLATES.map((x) => (
            <button key={x.id} onClick={() => setTpl(x.id)} className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-[border-color,background-color]", tpl === x.id ? "border-ink bg-surface shadow-sm" : "border-line hover:border-line-strong hover:bg-surface")}>
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tpl === x.id ? "bg-ink text-inverse" : "bg-subtle text-muted")}><x.icon className="size-4" /></span>
              <span><span className="block text-[13.5px] font-semibold text-ink">{x.name}</span><span className="mt-0.5 block text-[12px] leading-[1.45] text-muted">{x.desc}</span></span>
            </button>
          ))}
        </div>

        {!ready || !c ? <Skeleton className="h-[760px] rounded-xl" /> : (
          <motion.div key={`${tpl}-${cid}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="mx-auto max-w-[860px] overflow-hidden">
              <div className="relative overflow-hidden bg-[#0a0a0a] px-8 py-10 text-white md:px-12">
                <div className="absolute -right-16 -top-20 size-72 rounded-full bg-white/[0.06] blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-white/80"><SecureKnotsLogo className="h-7" onDark />SecureKnots</span>
                  <span className="text-[12px] text-white/50">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <p className="relative mt-12 text-[12px] font-medium uppercase tracking-[0.16em] text-white/50">{t.name}</p>
                <p className="serif relative mt-2 text-[44px] leading-[1.02]">{c.name}</p>
                <p className="relative mt-3 text-[13.5px] text-white/60">{data.engs.map((e) => FRAMEWORKS[e.framework].name).join(" · ")} · prepared by {person(c.ownerId).name}</p>
              </div>

              <div className="space-y-8 px-8 py-8 md:px-12">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Overall readiness", `${data.overall.pct}%`],
                    ["Controls approved", `${data.overall.done}/${data.overall.total}`],
                    ["Open gaps", String(data.openGaps.length)],
                    ["Next target", data.engs.length ? dayLabel(data.engs.map((e) => e.target).sort()[0]) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-line p-3"><p className="text-[11.5px] text-muted">{k}</p><p className="tnum mt-1 text-[22px] font-semibold tracking-[-0.02em] text-ink">{v}</p></div>
                  ))}
                </div>

                {tpl !== "auditor" && (
                  <section>
                    <h3 className="text-[15px] font-semibold text-ink">Progress by framework</h3>
                    <div className="mt-3 space-y-3">
                      {data.engs.map((e) => {
                        const ec = data.cs.filter((x) => x.engagementId === e.id);
                        const p = progressOf(ec);
                        return (
                          <div key={e.id}>
                            <div className="flex justify-between text-[13px]"><span className="font-medium text-ink">{FRAMEWORKS[e.framework].name}</span><span className="tnum text-muted">{p.pct}% · target {dayLabel(e.target)}</span></div>
                            <StatusBar controls={ec} className="mt-1.5" height={8} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                      {STATUS_ORDER.map((s) => <span key={s} className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className={cn("size-2 rounded-[2px]", s === "not_started" ? "bg-subtle-2" : TONE_CLASS[STATUS[s].tone].dot)} />{STATUS[s].label}</span>)}
                    </div>
                  </section>
                )}

                {(tpl === "readiness" || tpl === "gaps" || tpl === "board") && (
                  <section>
                    <h3 className="text-[15px] font-semibold text-ink">{tpl === "gaps" ? "All open findings" : "Top open gaps"}</h3>
                    <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                      {data.openGaps.slice(0, tpl === "gaps" ? 20 : 4).map((g) => (
                        <li key={g.id} className="flex items-start gap-3 px-3.5 py-2.5">
                          <SeverityBadge severity={g.severity} />
                          <div className="min-w-0 flex-1 text-[13px]"><p className="font-medium text-ink">{g.title}</p>{tpl === "gaps" && <p className="mt-0.5 text-[12.5px] text-muted">{g.plan}</p>}</div>
                          <span className="text-[12px] text-muted">{dayLabel(g.due)}</span>
                        </li>
                      ))}
                      {data.openGaps.length === 0 && <li className="px-3.5 py-3 text-[13px] text-muted">No open gaps.</li>}
                    </ul>
                  </section>
                )}

                {tpl === "board" && (
                  <section>
                    <h3 className="text-[15px] font-semibold text-ink">Highest residual risks</h3>
                    <ul className="mt-2 space-y-1.5">
                      {data.topRisks.map((r) => (
                        <li key={r.id} className="flex items-center gap-3 text-[13px]"><span className="tnum w-8 rounded-md bg-subtle py-0.5 text-center font-semibold text-ink">{r.residualImpact * r.residualLikelihood}</span><span className="text-ink-2">{r.title}</span></li>
                      ))}
                    </ul>
                  </section>
                )}

                {tpl === "readiness" && (
                  <section>
                    <h3 className="text-[15px] font-semibold text-ink">Next 30 days</h3>
                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {data.next.map((x) => <li key={x.id} className="flex items-center justify-between gap-2 rounded-lg bg-raised px-3 py-2 text-[12.5px]"><span className="truncate text-ink">{x.title}</span><span className="shrink-0 text-muted">{dayLabel(x.due)}</span></li>)}
                    </ul>
                  </section>
                )}

                {tpl === "auditor" && (
                  <section>
                    <h3 className="text-[15px] font-semibold text-ink">Approved controls and evidence</h3>
                    <table className="mt-2 w-full text-[12.5px]">
                      <thead className="text-left text-muted"><tr className="border-b border-line"><th className="py-2 font-medium">Control</th><th className="font-medium">Framework</th><th className="text-right font-medium">Evidence</th></tr></thead>
                      <tbody>
                        {data.approved.slice(0, 14).map((x) => {
                          const e = data.engs.find((k) => k.id === x.engagementId)!;
                          return <tr key={x.id} className="border-b border-line"><td className="py-1.5 text-ink"><span className="mr-2 font-mono text-muted">{x.code}</span>{x.title}</td><td className="text-ink-2">{FRAMEWORKS[e.framework].short}</td><td className="tnum text-right text-ink-2">{x.evidenceIds.filter((id) => evidence[id]?.state === "accepted").length} files</td></tr>;
                        })}
                      </tbody>
                    </table>
                  </section>
                )}

                <p className="border-t border-line pt-4 text-[11.5px] leading-5 text-muted">
                  Prepared by SecureKnots from the {c.name} workspace. SecureKnots prepares clients for audits and coordinates with their auditors; reports and certificates are issued by the independent auditor.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      <Dialog open={schedule} onOpenChange={setSchedule}>
        <DialogContent title={`Schedule the ${t.name.toLowerCase()}`} description={`Built fresh from Workspace data each time and emailed as a PDF.`}>
          <div className="space-y-4 px-5 py-4">
            <div><Label>Send to</Label><Input defaultValue={c?.contacts.map((x) => x.email).join(", ")} /></div>
            <div><Label>How often</Label><Select value="weekly" onValueChange={() => {}} options={[{ value: "weekly", label: "Every Monday at 9 AM" }, { value: "biweekly", label: "Every other Monday" }, { value: "monthly", label: "First of every month" }]} /></div>
            {c && <p className="flex items-center gap-2 rounded-lg bg-raised px-3 py-2 text-[12.5px] text-muted"><ClientMark name={c.name} hue={c.hue} size="sm" />Branded for {c.name}, signed by {person(c.ownerId).name}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSchedule(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setSchedule(false); toast.success("Report scheduled", { description: "First one goes out on Monday at 9 AM." }); }}><Mail /> Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
