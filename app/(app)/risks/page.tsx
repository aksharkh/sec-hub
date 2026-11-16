"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, Code } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Segmented, Select, Textarea } from "@/components/ui/form";
import { Card, CardHead, PageHeader, Skeleton } from "@/components/ui/misc";
import { Sheet, SheetClose, Tip } from "@/components/ui/overlay";
import { UNIFIED } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import type { Risk, RiskStatus, RiskTreatment } from "@/lib/types";
import { cn } from "@/lib/utils";

const level = (score: number) =>
  score >= 16 ? { label: "Critical", cls: "bg-bad-dot text-white", soft: "bg-bad-soft text-bad" } : score >= 10 ? { label: "High", cls: "bg-warn-dot text-white", soft: "bg-warn-soft text-warn" } : score >= 5 ? { label: "Medium", cls: "bg-info-dot/80 text-white", soft: "bg-info-soft text-info" } : { label: "Low", cls: "bg-ok-dot/80 text-white", soft: "bg-ok-soft text-ok" };

const cellTint = (score: number) => (score >= 16 ? "bg-bad-soft" : score >= 10 ? "bg-warn-soft" : score >= 5 ? "bg-info-soft" : "bg-ok-soft");
const STATUS: Record<RiskStatus, string> = { open: "Open", treating: "Treating", accepted: "Accepted", closed: "Closed" };
const TREAT: Record<RiskTreatment, string> = { mitigate: "Mitigate", accept: "Accept", transfer: "Transfer", avoid: "Avoid" };
const LIKE = ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"];
const IMP = ["Minimal", "Minor", "Moderate", "Major", "Severe"];

function Scale({ value, onChange, labels }: { value: number; onChange: (n: number) => void; labels: string[] }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {labels.map((l, i) => (
        <button key={l} onClick={() => onChange(i + 1)} className={cn("rounded-lg border px-1 py-1.5 text-center text-[11px] font-medium transition-colors", value === i + 1 ? "border-ink bg-ink text-inverse" : "border-line text-muted hover:border-line-strong hover:text-ink")}>
          <span className="tnum block text-[13px]">{i + 1}</span>{l}
        </button>
      ))}
    </div>
  );
}

export default function RisksPage() {
  const ready = useReady();
  const risks = useStore((s) => s.risks);
  const clients = useStore((s) => s.clients);
  const updateRisk = useStore((s) => s.updateRisk);
  const person = usePerson();
  const [client, setClient] = useState("all");
  const [mode, setMode] = useState<"inherent" | "residual">("residual");
  const [cell, setCell] = useState<[number, number] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const scoped = useMemo(() => risks.filter((r) => client === "all" || r.clientId === client), [risks, client]);
  const L = (r: Risk) => (mode === "inherent" ? r.likelihood : r.residualLikelihood);
  const I = (r: Risk) => (mode === "inherent" ? r.impact : r.residualImpact);
  const rows = scoped.filter((r) => !cell || (L(r) === cell[0] && I(r) === cell[1])).sort((a, b) => I(b) * L(b) - I(a) * L(a));
  const r = risks.find((x) => x.id === open);
  const reduction = scoped.length ? Math.round((1 - scoped.reduce((n, x) => n + x.residualImpact * x.residualLikelihood, 0) / scoped.reduce((n, x) => n + x.impact * x.likelihood, 0)) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Risk register"
        description="Risks for each client, scored by likelihood and impact before and after their controls. Every risk links to the library controls that treat it, so remediation work lowers the score you show the client."
        actions={<Button variant="primary" onClick={() => toast("New risk", { description: "Opens the risk form with a likelihood and impact picker and suggested controls." })}><Plus /> Add risk</Button>}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Select size="sm" className="w-[200px]" value={client} onValueChange={(v) => { setClient(v); setCell(null); }} options={[{ value: "all", label: "All clients" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
        <Segmented value={mode} onChange={(m) => { setMode(m); setCell(null); }} options={[{ value: "inherent", label: "Inherent" }, { value: "residual", label: "Residual" }]} />
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-medium text-ok"><ArrowDownRight className="size-3.5" />Controls cut total risk by {reduction}%</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-ink">{mode === "inherent" ? "Inherent risk" : "Residual risk"}</p>
            {cell && <Button size="xs" variant="ghost" onClick={() => setCell(null)}><X /> Clear</Button>}
          </div>
          {!ready ? <Skeleton className="mt-4 aspect-square rounded-xl" /> : (
            <div className="mt-4 grid grid-cols-[22px_1fr] gap-2">
              <div className="flex items-center justify-center"><span className="-rotate-90 whitespace-nowrap text-[11px] font-medium text-muted">Likelihood</span></div>
              <div>
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map((l) =>
                    [1, 2, 3, 4, 5].map((im) => {
                      const n = scoped.filter((x) => L(x) === l && I(x) === im).length;
                      const on = cell?.[0] === l && cell?.[1] === im;
                      return (
                        <Tip key={`${l}-${im}`} content={`Likelihood ${l} × impact ${im} = ${l * im} · ${n} risk${n === 1 ? "" : "s"}`}>
                          <button
                            onClick={() => setCell(on ? null : [l, im])}
                            className={cn("relative grid aspect-square place-items-center rounded-lg transition-[box-shadow,transform] hover:scale-[1.04]", cellTint(l * im), on && "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--ink)]")}
                          >
                            {n > 0 && (
                              <motion.span layout className={cn("tnum grid size-7 place-items-center rounded-full text-[12px] font-semibold shadow-sm", level(l * im).cls)}>{n}</motion.span>
                            )}
                          </button>
                        </Tip>
                      );
                    }),
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-5 text-center text-[10.5px] text-faint">{IMP.map((x) => <span key={x}>{x}</span>)}</div>
                <p className="mt-1 text-center text-[11px] font-medium text-muted">Impact</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3">
            {[["Critical", "bg-bad-dot"], ["High", "bg-warn-dot"], ["Medium", "bg-info-dot"], ["Low", "bg-ok-dot"]].map(([l, c]) => <span key={l} className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className={cn("size-2 rounded-full", c)} />{l}</span>)}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHead title={cell ? `Risks scored ${cell[0]} × ${cell[1]}` : "All risks"} sub={`${rows.length} shown, sorted by ${mode} score`} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-[13px]">
              <thead className="text-left text-[12px] text-muted"><tr className="border-y border-line bg-raised"><th className="h-9 w-[70px] pl-4 font-medium">Ref</th><th className="font-medium">Risk</th><th className="w-[180px] font-medium">Client</th><th className="w-[150px] font-medium">Inherent → residual</th><th className="w-[100px] font-medium">Treatment</th><th className="w-[100px] pr-4 font-medium">Owner</th></tr></thead>
              <tbody>
                {rows.map((x) => {
                  const c = clients.find((k) => k.id === x.clientId)!;
                  const inh = x.likelihood * x.impact;
                  const res = x.residualLikelihood * x.residualImpact;
                  return (
                    <tr key={x.id} onClick={() => setOpen(x.id)} className="h-14 cursor-pointer border-b border-line last:border-0 hover:bg-raised">
                      <td className="pl-4"><Code>{x.ref}</Code></td>
                      <td className="truncate pr-3"><span className="font-medium text-ink">{x.title}</span><span className="block text-[12px] text-muted">{x.category} · {STATUS[x.status]}</span></td>
                      <td><span className="flex items-center gap-2 truncate text-ink-2"><ClientMark name={c.name} hue={c.hue} size="sm" /><span className="truncate">{c.name}</span></span></td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          <span className={cn("tnum rounded-md px-1.5 py-0.5 text-[12px] font-semibold", level(inh).soft)}>{inh}</span>
                          <ArrowDownRight className="size-3.5 text-faint" />
                          <span className={cn("tnum rounded-md px-1.5 py-0.5 text-[12px] font-semibold", level(res).soft)}>{res}</span>
                        </span>
                      </td>
                      <td className="text-ink-2">{TREAT[x.treatment]}</td>
                      <td className="pr-4"><span className="flex items-center gap-1.5 text-ink-2"><Avatar person={person(x.ownerId)} size="xs" />{person(x.ownerId).name.split(" ")[0]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Sheet open={!!r} onOpenChange={(o) => !o && setOpen(null)} title="Risk" className="w-[min(560px,calc(100vw-16px))]">
        {r && (() => {
          const c = clients.find((k) => k.id === r.clientId)!;
          const res = r.residualLikelihood * r.residualImpact;
          return (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                <ClientMark name={c.name} hue={c.hue} size="sm" /><span className="text-[13px] text-muted">{c.name}</span><Code className="ml-1">{r.ref}</Code>
                <SheetClose asChild><Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Close"><X /></Button></SheetClose>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <div>
                  <Badge tone="neutral" dot={false}>{r.category}</Badge>
                  <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink">{r.title}</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-line p-3"><p className="text-[12px] text-muted">Inherent</p><p className={cn("tnum mt-1 inline-block rounded-md px-2 py-0.5 text-[18px] font-semibold", level(r.likelihood * r.impact).soft)}>{r.likelihood * r.impact}</p><p className="mt-1 text-[11.5px] text-muted">{level(r.likelihood * r.impact).label}</p></div>
                  <div className="rounded-xl border border-line p-3"><p className="text-[12px] text-muted">Residual</p><motion.p key={res} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={cn("tnum mt-1 inline-block rounded-md px-2 py-0.5 text-[18px] font-semibold", level(res).soft)}>{res}</motion.p><p className="mt-1 text-[11.5px] text-muted">{level(res).label}</p></div>
                </div>
                <div><Label>Residual likelihood</Label><Scale value={r.residualLikelihood} labels={LIKE} onChange={(n) => updateRisk(r.id, { residualLikelihood: n })} /></div>
                <div><Label>Residual impact</Label><Scale value={r.residualImpact} labels={IMP} onChange={(n) => updateRisk(r.id, { residualImpact: n })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Treatment</Label><Select value={r.treatment} onValueChange={(v) => updateRisk(r.id, { treatment: v as RiskTreatment })} options={(Object.keys(TREAT) as RiskTreatment[]).map((k) => ({ value: k, label: TREAT[k] }))} /></div>
                  <div><Label>Status</Label><Select value={r.status} onValueChange={(v) => updateRisk(r.id, { status: v as RiskStatus })} options={(Object.keys(STATUS) as RiskStatus[]).map((k) => ({ value: k, label: STATUS[k] }))} /></div>
                </div>
                <div>
                  <Label>Treated by library controls</Label>
                  <ul className="space-y-1">
                    {r.unifiedIds.map((u) => {
                      const uc = UNIFIED.find((x) => x.id === u);
                      return uc ? <li key={u} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px]"><Code className="text-[11.5px]">{u}</Code><span className="text-ink">{uc.title}</span></li> : null;
                    })}
                  </ul>
                </div>
                <div><Label>Notes</Label><Textarea defaultValue={r.notes} onBlur={(e) => e.target.value !== r.notes && (updateRisk(r.id, { notes: e.target.value }), toast("Notes saved"))} /></div>
              </div>
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}
