"use client";

import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Bell, Check, Download, GitCommitHorizontal, PenLine, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, FrameworkChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";
import { Card, CardHead, ProgressRing, Skeleton } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { useReady } from "@/lib/hooks";
import { POLICY_STATUS } from "@/lib/policy";
import { usePerson, useStore } from "@/lib/store";
import { ago, cn, dayLabel } from "@/lib/utils";

const BODY: Record<string, string> = {
  "Purpose and scope": "This policy sets out how {client} protects the confidentiality, integrity and availability of the information it holds for customers and for itself. It applies to all employees, contractors and systems that store, process or transmit company or customer data.",
  "Roles and responsibilities": "The Head of Security owns this policy and reports on it to leadership each quarter. System owners keep their systems in line with it; managers make sure their teams complete training; every employee reports suspected incidents within one hour.",
  "Multi-factor authentication": "Multi-factor authentication is required for every workforce account, every administrative console and all remote access. Phishing-resistant methods such as security keys or passkeys are required for administrators.",
  "Access reviews": "System owners review every user's access each quarter. Access that is no longer needed is removed within five business days of the review, and the review is signed off in the identity provider.",
};

export default function PolicyPage() {
  const { policy: id } = useParams<{ policy: string }>();
  const ready = useReady();
  const policies = useStore((s) => s.policies);
  const clients = useStore((s) => s.clients);
  const publish = useStore((s) => s.publishPolicy);
  const updatePolicy = useStore((s) => s.updatePolicy);
  const person = usePerson();
  const [pub, setPub] = useState(false);
  const [note, setNote] = useState("");
  const [section, setSection] = useState(0);

  const p = policies.find((x) => x.id === id);
  if (!ready) return <div className="mx-auto max-w-[1400px] px-4 pt-7 md:px-6"><Skeleton className="h-20 rounded-xl" /><Skeleton className="mt-4 h-[600px] rounded-xl" /></div>;
  if (!p) notFound();
  const c = clients.find((x) => x.id === p.clientId)!;
  const owner = person(p.ownerId);
  const fill = (t: string) => t.replace("{client}", c.name);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-12 pt-7 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[13px] text-muted"><ClientMark name={c.name} hue={c.hue} size="sm" />{c.name} · {p.category}</p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">{p.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={POLICY_STATUS[p.status].tone}>{POLICY_STATUS[p.status].label}</Badge>
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11.5px] text-ink-2">v{p.version}</span>
            {p.frameworks.map((f) => <FrameworkChip key={f} fw={f} size="sm" />)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast.success("PDF exported", { description: `${p.title} v${p.version}, with approval page and version history.` })}><Download /> Export PDF</Button>
          {p.status !== "approved" ? (
            <Button variant="secondary" onClick={() => { updatePolicy(p.id, { status: "in_review" }); toast.success(`Sent to ${c.contacts[0].name} for approval`); }}><Send /> Send to client for approval</Button>
          ) : (
            <Button variant="secondary" onClick={() => toast.success("Reminder sent", { description: `${Math.round(p.employees * (1 - p.ackRate / 100))} employees who haven't acknowledged v${p.version}.` })}><Bell /> Remind employees</Button>
          )}
          <Button variant="primary" onClick={() => setPub(true)}><PenLine /> Publish new version</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <nav className="hidden lg:block">
          <p className="mb-2 px-2 text-[11.5px] font-medium text-faint">Contents</p>
          <ul className="space-y-px">
            {p.sections.map((s, i) => (
              <li key={s}>
                <a href={`#s${i}`} onClick={() => setSection(i)} className={cn("block rounded-lg px-2 py-1.5 text-[13px] transition-colors", section === i ? "bg-subtle font-medium text-ink" : "text-muted hover:text-ink")}>{i + 1}. {s}</a>
              </li>
            ))}
          </ul>
        </nav>

        <Card className="px-6 py-8 md:px-12 md:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{c.name}</p>
          <h2 className="serif mt-2 text-[34px] leading-tight text-ink">{p.title}</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 border-y border-line py-3 text-[12px] sm:grid-cols-4">
            <span className="text-muted">Version <b className="block font-mono font-medium text-ink">{p.version}</b></span>
            <span className="text-muted">Owner <b className="block font-medium text-ink">{owner.name}</b></span>
            <span className="text-muted">Effective <b className="block font-medium text-ink">{dayLabel(p.updatedAt)}</b></span>
            <span className="text-muted">Next review <b className="block font-medium text-ink">{dayLabel(p.reviewDue)}</b></span>
          </div>
          {p.sections.map((s, i) => (
            <section key={s} id={`s${i}`} className="scroll-mt-24">
              <h3 className="mt-8 text-[17px] font-semibold tracking-[-0.01em] text-ink">{i + 1}. {s}</h3>
              <p className="mt-2.5 text-[14.5px] leading-7 text-ink-2">
                {fill(BODY[s] ?? `{client} maintains documented procedures for ${s.toLowerCase()}. Responsibilities, required records and review frequency are set out below, and exceptions need written approval from the policy owner.`)}
              </p>
              <ul className="mt-2.5 list-disc space-y-1 pl-5 text-[14px] leading-6 text-ink-2 marker:text-faint">
                <li>Records are kept for at least three years and are available to auditors on request.</li>
                <li>Exceptions are logged with an owner, an expiry date and compensating controls.</li>
              </ul>
            </section>
          ))}
          <div className="mt-10 rounded-xl border border-dashed border-line-strong p-4 text-[12.5px] text-muted">
            Approved by {p.status === "approved" ? `${c.contacts[0].name}, ${c.contacts[0].title}` : "pending"} · {p.words.toLocaleString()} words · prepared with SecureKnots
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-[13px] font-semibold text-ink">Employee acknowledgment</p>
            <div className="mt-3 flex items-center gap-4">
              <ProgressRing value={p.ackRate} size={60} stroke={5} />
              <div className="text-[12.5px] leading-5 text-muted">
                <p className="tnum"><b className="text-ink">{Math.round((p.employees * p.ackRate) / 100)}</b> of {p.employees} employees</p>
                <p>{p.status === "approved" ? `have signed v${p.version}` : "Opens once approved"}</p>
              </div>
            </div>
          </Card>
          <Card>
            <CardHead title="Version history" />
            <ol className="relative px-4 pb-4 before:absolute before:bottom-6 before:left-[27px] before:top-1 before:w-px before:bg-line">
              {p.versions.map((v, i) => (
                <motion.li key={`${v.v}-${v.at}`} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative flex gap-3 py-2">
                  <span className={cn("z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border", i === 0 ? "border-ink bg-ink text-inverse" : "border-line-strong bg-surface text-faint")}>
                    {i === 0 ? <Check className="size-3" strokeWidth={3} /> : <GitCommitHorizontal className="size-3" />}
                  </span>
                  <div className="min-w-0 text-[12.5px] leading-5">
                    <p className="font-medium text-ink"><span className="font-mono">v{v.v}</span> <span className="font-normal text-muted">· {ago(v.at)}</span></p>
                    <p className="text-ink-2">{v.note}</p>
                    <p className="flex items-center gap-1 text-muted"><Avatar person={person(v.by)} size="xs" className="!size-4 !text-[7px]" />{person(v.by).name}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Dialog open={pub} onOpenChange={setPub}>
        <DialogContent title={`Publish ${p.title}`} description={`Creates a new version, records the approval and asks ${p.employees} employees to acknowledge it.`}>
          <div className="px-5 py-4">
            <Label>What changed?</Label>
            <Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: added passkeys as an approved MFA method." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPub(false)}>Cancel</Button>
            <Button variant="primary" disabled={note.trim().length < 4} onClick={() => { publish(p.id, note.trim()); setPub(false); setNote(""); toast.success("New version published", { description: "Employees have been asked to acknowledge it." }); }}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
