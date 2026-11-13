"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Globe, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Switch } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { FRAMEWORKS, FRAMEWORK_ORDER, UNIFIED } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { FrameworkKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Company", "Frameworks", "Team", "Access & plan"];
const INDUSTRIES = ["SaaS & cloud", "Government cloud SaaS", "Payments", "Digital health", "AI & data", "Defense manufacturing", "EdTech", "Logistics", "Financial services"];

export function NewClientWizard() {
  const router = useRouter();
  const members = useStore((s) => s.members);
  const addClient = useStore((s) => s.addClient);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", industry: INDUSTRIES[0], hq: "", contactName: "", contactTitle: "", contactEmail: "", frameworks: new Set<FrameworkKey>(["soc2"]), target: "120", ownerId: "m_arjun", team: new Set<string>(["m_fatima"]), trustPlan: false, invite: true });

  useEffect(() => {
    const on = () => { setOpen(true); setStep(0); setDone(null); };
    window.addEventListener("sk:new-client", on);
    return () => window.removeEventListener("sk:new-client", on);
  }, []);

  const reuse = useMemo(() => {
    const fws = [...f.frameworks];
    const separate = fws.reduce((n, fw) => n + UNIFIED.filter((u) => u.map[fw]).length, 0);
    const unified = UNIFIED.filter((u) => fws.some((fw) => u.map[fw])).length;
    return { separate, unified, saved: separate ? Math.round((1 - unified / separate) * 100) : 0 };
  }, [f.frameworks]);

  const valid = [f.name.trim().length > 1 && f.contactName.trim() && /.+@.+\..+/.test(f.contactEmail), f.frameworks.size > 0, !!f.ownerId, true][step];
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const create = () => {
    const id = addClient({
      name: f.name.trim(), industry: f.industry, hq: f.hq.trim() || "Remote", frameworks: [...f.frameworks], ownerId: f.ownerId, team: [...f.team],
      trustPlan: f.trustPlan, contact: { name: f.contactName.trim(), title: f.contactTitle.trim() || "Client admin", email: f.contactEmail.trim() }, targetDays: Number(f.target),
    });
    setDone(id);
    toast.success(`${f.name} is set up`, { description: `${reuse.unified} controls created from the unified library${f.invite ? `; invitation sent to ${f.contactEmail}` : ""}.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="Onboard a new client" description="Creates the client, its engagements and controls from the SecureKnots library, and invites their admin." wide>
        {done ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="grid size-14 place-items-center rounded-full bg-ok-soft text-ok">
              <Check className="size-7" strokeWidth={2.5} />
            </motion.span>
            <p className="serif mt-5 text-[30px] leading-tight text-ink">{f.name} is ready</p>
            <p className="mt-2 max-w-sm text-[13.5px] leading-6 text-muted">
              {f.frameworks.size} engagement{f.frameworks.size > 1 ? "s" : ""} and {reuse.unified} controls created. Stage is Onboarding; the gap assessment starts with the kickoff.
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => { setDone(null); setStep(0); setF((x) => ({ ...x, name: "", hq: "", contactName: "", contactTitle: "", contactEmail: "" })); }}>Onboard another</Button>
              <Button variant="primary" onClick={() => { setOpen(false); router.push(`/clients/${done}`); }}>Open client <ArrowRight /></Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold transition-colors", i < step ? "bg-ok text-surface" : i === step ? "bg-ink text-surface" : "bg-subtle-2 text-muted")}>
                    {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("hidden truncate text-[12.5px] font-medium sm:block", i === step ? "text-ink" : "text-muted")}>{s}</span>
                  {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
                </div>
              ))}
            </div>

            <div className="min-h-[360px] px-5 py-5">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                  {step === 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2"><Label>Company name</Label><Input autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="For example: Meridian Health Cloud" /></div>
                      <div><Label>Industry</Label><Select value={f.industry} onValueChange={(v) => set("industry", v)} options={INDUSTRIES.map((x) => ({ value: x, label: x }))} /></div>
                      <div><Label>Headquarters</Label><Input value={f.hq} onChange={(e) => set("hq", e.target.value)} placeholder="City, country" /></div>
                      <div className="mt-2 sm:col-span-2"><p className="text-[12.5px] font-semibold text-ink">Client admin</p><p className="text-[12px] text-muted">The person who invites the rest of their team and receives evidence requests.</p></div>
                      <div><Label>Name</Label><Input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Full name" /></div>
                      <div><Label>Title</Label><Input value={f.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} placeholder="Head of Security" /></div>
                      <div className="sm:col-span-2"><Label>Work email</Label><Input type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="name@company.com" /></div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {FRAMEWORK_ORDER.map((fw) => {
                          const on = f.frameworks.has(fw);
                          return (
                            <button
                              key={fw}
                              onClick={() => { const n = new Set(f.frameworks); if (on) n.delete(fw); else n.add(fw); set("frameworks", n); }}
                              className={cn("relative rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow]", on ? "border-ink bg-raised shadow-[0_0_0_1px_var(--ink)]" : "border-line hover:border-line-strong")}
                            >
                              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                                <span className="size-2 rounded-full" style={{ background: `hsl(${FRAMEWORKS[fw].hue} 62% 52%)` }} />
                                {FRAMEWORKS[fw].short}
                              </span>
                              <span className="mt-0.5 block text-[11.5px] text-muted">{FRAMEWORKS[fw].family} · {UNIFIED.filter((u) => u.map[fw]).length} controls</span>
                              {on && <Check className="absolute right-2.5 top-2.5 size-3.5 text-ink" strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px]">
                        <div className="rounded-xl border border-line bg-raised p-3.5">
                          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><Sparkles className="size-3.5" /> One control set</p>
                          <p className="mt-1 text-[12.5px] leading-5 text-muted">
                            Separately these frameworks need <b className="tnum text-ink">{reuse.separate}</b> controls. From the unified library it is <b className="tnum text-ink">{reuse.unified}</b>
                            {reuse.saved > 0 ? <>, <b className="tnum text-ok">{reuse.saved}% less work</b> for the client.</> : "."}
                          </p>
                          <div className="mt-2.5 flex h-2 gap-[2px]">
                            <motion.span className="rounded-full bg-ink" animate={{ flexGrow: reuse.unified || 1 }} style={{ flexBasis: 0 }} />
                            <motion.span className="rounded-full bg-subtle-2" animate={{ flexGrow: Math.max(0, reuse.separate - reuse.unified) }} style={{ flexBasis: 0 }} />
                          </div>
                        </div>
                        <div><Label>Target date</Label><Select value={f.target} onValueChange={(v) => set("target", v)} options={[{ value: "90", label: "In 3 months" }, { value: "120", label: "In 4 months" }, { value: "180", label: "In 6 months" }, { value: "270", label: "In 9 months" }]} /></div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label>Engagement owner</Label>
                        <Select value={f.ownerId} onValueChange={(v) => set("ownerId", v)} options={members.filter((m) => ["lead", "consultant", "admin"].includes(m.role)).map((m) => ({ value: m.id, label: m.name, hint: m.title }))} />
                      </div>
                      <div>
                        <Label hint="Fatima Khan reviews by default">Team</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {members.filter((m) => !["sales", "marketing", "admin"].includes(m.role) && m.id !== f.ownerId).map((m) => {
                            const on = f.team.has(m.id);
                            return (
                              <button key={m.id} onClick={() => { const n = new Set(f.team); if (on) n.delete(m.id); else n.add(m.id); set("team", n); }} className={cn("flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors", on ? "border-ink bg-raised" : "border-line hover:border-line-strong")}>
                                <Avatar person={m} size="md" />
                                <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-ink">{m.name}</span><span className="block text-[12px] text-muted">{m.title} · {m.location}</span></span>
                                <span className={cn("grid size-4 place-items-center rounded-[5px] border", on ? "border-ink bg-ink text-surface" : "border-line-strong")}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-ink"><Mail className="size-4" /></span>
                        <span className="flex-1"><span className="block text-[13.5px] font-medium text-ink">Invite {f.contactName || "the client admin"} now</span><span className="block text-[12.5px] text-muted">They get a sign-in link with MFA setup and see their own dashboard.</span></span>
                        <Switch checked={f.invite} onCheckedChange={(v) => set("invite", v)} />
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-ink"><Globe className="size-4" /></span>
                        <span className="flex-1"><span className="block text-[13.5px] font-medium text-ink">SecureKnots Trust plan</span><span className="block text-[12.5px] text-muted">Once certified, approved reports and policies can be published to a client-branded trust center.</span></span>
                        <Switch checked={f.trustPlan} onCheckedChange={(v) => set("trustPlan", v)} />
                      </label>
                      <div className="rounded-xl bg-raised p-3.5 text-[12.5px] leading-6 text-ink-2">
                        <p className="font-semibold text-ink">Summary</p>
                        <p>{f.name || "New client"} · {f.industry} · {[...f.frameworks].map((x) => FRAMEWORKS[x].short).join(", ")}</p>
                        <p>{reuse.unified} controls · owner {members.find((m) => m.id === f.ownerId)?.name} · target in {Math.round(Number(f.target) / 30)} months</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-line bg-raised px-5 py-3">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft /> Back</Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" disabled={!valid} onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight /></Button>
              ) : (
                <Button variant="primary" onClick={create}><Check /> Create client</Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const openNewClient = () => window.dispatchEvent(new CustomEvent("sk:new-client"));
