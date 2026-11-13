"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Plus, Workflow, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Switch } from "@/components/ui/form";
import { Card, CardHead, PageHeader, Skeleton, Stat } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { useReady } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ago, cn } from "@/lib/utils";

const TRIGGERS = ["Control moves to In review", "Control is sent back for revision", "Control is approved", "Gap is created", "Client request is overdue", "Evidence expires in 14 days", "Client uploads evidence", "Policy review is due in 30 days", "Every Friday at 4 PM"];
const CONDITIONS = ["Any client", "Severity is Critical", "Client is on the Trust plan", "Framework is FedRAMP 20x", "Overdue by 3 days", "Evidence type is access review or scan", "Engagement is in Audit stage"];
const ACTIONS = ["Notify the control's QA reviewer", "Notify admin and the engagement owner", "Send an evidence request to the client", "Email the client contact and CC the owner", "Create a task for the policy owner", "Post to Microsoft Teams", "Lock linked evidence and add it to the audit packet", "Move the control to Waiting on client"];

function Step({ k, text, icon }: { k: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-raised px-3 py-2">
      <span className="mt-px w-11 shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{k}</span>
      <span className="flex items-center gap-1.5 text-[13px] text-ink">{icon}{text}</span>
    </div>
  );
}

export default function AutomationsPage() {
  const ready = useReady();
  const automations = useStore((s) => s.automations);
  const toggle = useStore((s) => s.toggleAutomation);
  const add = useStore((s) => s.addAutomation);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", trigger: TRIGGERS[0], condition: CONDITIONS[0], action: ACTIONS[0] });
  const on = automations.filter((a) => a.enabled);
  const runs = automations.reduce((n, a) => n + a.runs, 0);

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Automations"
        description="Rules that do the routine follow-up for the team: notify the right person, chase clients, refresh expiring evidence and lock approved work. Each rule runs on events in the Workspace."
        actions={<Button variant="primary" onClick={() => setOpen(true)}><Plus /> New automation</Button>}
      />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active rules" value={on.length} hint={`of ${automations.length}`} />
        <Stat label="Runs, all time" value={runs.toLocaleString()} hint="since the Workspace started" />
        <Stat label="Hours saved" value={Math.round(runs * 0.12)} hint="estimated at 7 min per run" tone="ok" />
        <Stat label="Client chasers sent" value={automations.find((a) => a.id === "au4")?.runs ?? 0} hint="overdue request reminders" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {!ready
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[200px] rounded-xl" />)
          : (
            <AnimatePresence initial={false}>
              {automations.map((a, i) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={cn("p-4 transition-opacity", !a.enabled && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", a.enabled ? "bg-ink text-surface" : "bg-subtle text-muted")}><Workflow className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold tracking-[-0.01em] text-ink">{a.name}</p>
                        <p className="text-[12px] text-muted">{a.runs.toLocaleString()} runs{a.lastRun ? ` · last ${ago(a.lastRun)}` : ""}</p>
                      </div>
                      <Switch checked={a.enabled} onCheckedChange={() => { toggle(a.id); toast(a.enabled ? `"${a.name}" paused` : `"${a.name}" is on`); }} aria-label={`Turn ${a.name} ${a.enabled ? "off" : "on"}`} />
                    </div>
                    <div className="mt-3 space-y-1">
                      <Step k="When" text={a.trigger} icon={<Zap className="size-3.5 text-warn" />} />
                      <div className="flex justify-center"><ArrowDown className="size-3 text-faint" /></div>
                      <Step k="If" text={a.condition} />
                      <div className="flex justify-center"><ArrowDown className="size-3 text-faint" /></div>
                      <Step k="Then" text={a.action} />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
      </div>

      <Card className="mt-4">
        <CardHead title="Coming with the backend" sub="Rules that need live integrations" />
        <div className="grid gap-2 px-4 pb-4 sm:grid-cols-3">
          {["When AWS shows an IAM user without MFA, reopen UC-ACC-02 for that client", "When a GitHub repo loses branch protection, raise a Critical gap", "When an Okta deprovision is late, add it to the access review evidence"].map((t) => (
            <div key={t} className="rounded-xl border border-dashed border-line-strong p-3 text-[12.5px] leading-5 text-muted"><Badge tone="neutral" dot={false} className="mb-2">Needs integration</Badge><p>{t}</p></div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="New automation" description="Pick what starts the rule, when it applies and what it does.">
          <div className="space-y-4 px-5 py-4">
            <div><Label>Name</Label><Input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="For example: Chase FedRAMP clients faster" /></div>
            <div><Label>When</Label><Select value={draft.trigger} onValueChange={(v) => setDraft({ ...draft, trigger: v })} options={TRIGGERS.map((t) => ({ value: t, label: t }))} /></div>
            <div><Label>If</Label><Select value={draft.condition} onValueChange={(v) => setDraft({ ...draft, condition: v })} options={CONDITIONS.map((t) => ({ value: t, label: t }))} /></div>
            <div><Label>Then</Label><Select value={draft.action} onValueChange={(v) => setDraft({ ...draft, action: v })} options={ACTIONS.map((t) => ({ value: t, label: t }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={draft.name.trim().length < 3} onClick={() => { add({ ...draft, name: draft.name.trim(), enabled: true }); setOpen(false); setDraft({ ...draft, name: "" }); toast.success("Automation created and switched on"); }}>Create automation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
