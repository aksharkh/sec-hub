"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lock, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Segmented } from "@/components/ui/form";
import { Card, PageHeader, Skeleton, Stat } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { useReady } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { Integration } from "@/lib/types";
import { ago, cn } from "@/lib/utils";

const CATS = ["All", "Identity", "Cloud", "Collaboration", "Engineering", "HR & devices", "Ticketing"] as const;

function Mark({ i, size = "md" }: { i: Integration; size?: "md" | "lg" }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-xl font-bold tracking-tight text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]", size === "lg" ? "size-12 text-[14px]" : "size-10 text-[12px]")} style={{ background: i.color }}>
      {i.mark}
    </span>
  );
}

function ConnectDialog({ i, onClose }: { i: Integration | null; onClose: () => void }) {
  const set = useStore((s) => s.setIntegration);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step === 0 || step >= 3) return;
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [step]);
  if (!i) return null;
  const steps = ["Authorize read-only access", "Check permissions", "First sync"];
  const done = step >= 3;
  return (
    <Dialog open={!!i} onOpenChange={(o) => { if (!o) { setStep(0); onClose(); } }}>
      <DialogContent title={`Connect ${i.name}`} description={i.description}>
        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
            <Mark i={i} />
            <div className="text-[12.5px] leading-5 text-muted"><p className="font-medium text-ink">Read-only, least privilege</p>SecureKnots never changes anything in {i.name}. Access can be revoked from either side at any time.</div>
          </div>
          {i.collects.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-muted">Evidence collected automatically</p>
              <div className="flex flex-wrap gap-1.5">{i.collects.map((c) => <span key={c} className="rounded-full border border-line px-2 py-0.5 text-[12px] text-ink-2">{c}</span>)}</div>
            </div>
          )}
          <ol className="space-y-2">
            {steps.map((s, k) => {
              const state = step > k + 1 || done ? "done" : step === k + 1 ? "doing" : "wait";
              return (
                <li key={s} className="flex items-center gap-3 text-[13px]">
                  <span className={cn("grid size-5 place-items-center rounded-full border", state === "done" ? "border-ok bg-ok text-surface" : state === "doing" ? "border-ink" : "border-line-strong")}>
                    {state === "done" ? <Check className="size-3" strokeWidth={3} /> : state === "doing" ? <span className="size-2.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" /> : null}
                  </span>
                  <span className={state === "wait" ? "text-faint" : "text-ink"}>{s}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <DialogFooter>
          {done ? (
            <Button variant="primary" onClick={() => { set(i.id, true); toast.success(`${i.name} connected`, { description: i.collects.length ? `${i.collects.length} evidence types will refresh daily.` : "Notifications are on." }); setStep(0); onClose(); }}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setStep(0); onClose(); }}>Cancel</Button>
              <Button variant="primary" disabled={step > 0} onClick={() => setStep(1)}><Lock /> Authorize</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function IntegrationsPage() {
  const ready = useReady();
  const list = useStore((s) => s.integrations);
  const set = useStore((s) => s.setIntegration);
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [q, setQ] = useState("");
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const shown = list.filter((i) => (cat === "All" || i.category === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  const connected = list.filter((i) => i.connected);

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Integrations"
        description="Connect the tools SecureKnots and its clients already use. Microsoft 365 and OneDrive run the Workspace today; cloud, identity and engineering connections collect evidence automatically so clients upload less by hand."
      />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Connected" value={connected.length} hint={`of ${list.length} available`} />
        <Stat label="Items synced" value={connected.reduce((n, i) => n + i.items, 0).toLocaleString()} hint="documents and settings" />
        <Stat label="Auto-collected evidence types" value={connected.reduce((n, i) => n + i.collects.length, 0)} hint="refreshed daily" tone="ok" />
        <Stat label="Access" value="Read-only" hint="least privilege, revocable" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integrations" className="w-full sm:w-[220px]" />
        <div className="no-scrollbar max-w-full overflow-x-auto"><Segmented value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c }))} /></div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {!ready
          ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[190px] rounded-xl" />)
          : (
            <AnimatePresence initial={false}>
              {shown.map((i, k) => (
                <motion.div key={i.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.03 }}>
                  <Card className="flex h-full flex-col p-4">
                    <div className="flex items-start gap-3">
                      <Mark i={i} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold tracking-[-0.01em] text-ink">{i.name}</p>
                        <p className="text-[12px] text-muted">{i.category}</p>
                      </div>
                      {i.connected ? <Badge tone="ok">Connected</Badge> : i.collects.length > 0 ? <Badge tone="neutral" dot={false}>Evidence</Badge> : null}
                    </div>
                    <p className="mt-3 text-[13px] leading-5 text-ink-2">{i.description}</p>
                    {i.connected && i.collects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">{i.collects.map((c) => <span key={c} className="flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] text-ok"><ShieldCheck className="size-3" />{c}</span>)}</div>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <span className="text-[12px] text-muted">{i.connected ? <span className="tnum">{i.items.toLocaleString()} items · synced {i.lastSync ? ago(i.lastSync) : "now"}</span> : i.collects.length ? `${i.collects.length} evidence types` : "Notifications"}</span>
                      {i.connected ? (
                        <div className="flex gap-1">
                          <Button size="xs" variant="ghost" onClick={() => toast("Sync started", { description: `${i.name} will refresh in the background.` })}><RefreshCcw /> Sync</Button>
                          <Button size="xs" variant="secondary" onClick={() => { set(i.id, false); toast(`${i.name} disconnected`); }}>Disconnect</Button>
                        </div>
                      ) : (
                        <Button size="xs" variant="primary" onClick={() => setConnecting(i)}>Connect</Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
      </div>
      <ConnectDialog i={connecting} onClose={() => setConnecting(null)} />
    </div>
  );
}
