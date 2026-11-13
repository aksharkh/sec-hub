"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, FileBadge, FileText, Globe, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { TRUST_URL } from "@/components/shell/nav";
import { FRAMEWORKS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { Client, Engagement } from "@/lib/types";

export function PublishDialog({ client, engagements, open, onOpenChange }: { client: Client; engagements: Engagement[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const publish = useStore((s) => s.publish);
  const [busy, setBusy] = useState(false);
  const domain = `trust.${client.contacts[0].email.split("@")[1]}`;
  const items = [
    ...engagements.map((e) => ({ icon: FileBadge, title: `${FRAMEWORKS[e.framework].short} ${e.framework === "soc2" ? "report" : e.framework === "gdpr" || e.framework === "dpdpa" ? "readiness summary" : "certificate"}`, sub: e.framework === "soc2" ? "Issued by the client's CPA firm · restricted" : "Issued by the independent body · public", locked: e.framework === "soc2" })),
    { icon: FileText, title: "14 approved policies", sub: "Summaries public, full text restricted", locked: true },
    { icon: ShieldCheck, title: "Security overview and contacts", sub: "Public page content", locked: false },
  ];
  const go = () => {
    setBusy(true);
    setTimeout(() => {
      publish(client.id);
      setBusy(false);
      onOpenChange(false);
      toast.success(`${client.name} published to SecureKnots Trust`, {
        description: `Live at ${domain}. Agencies and customers can request access to restricted documents.`,
        action: { label: "Open", onClick: () => window.open(TRUST_URL, "_blank") },
      });
    }, 1300);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Publish to SecureKnots Trust" description={`Approved material moves to ${client.name}'s trust center. Raw evidence and internal notes stay in Workspace.`} wide>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3.5 py-3">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Globe className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{domain}</p>
              <p className="text-[12px] text-muted">Client-branded address · SSL managed by SecureKnots</p>
            </div>
            <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] font-medium text-ok">Trust plan active</span>
          </div>
          <p className="mb-2 mt-5 text-[12px] font-medium text-muted">What gets published</p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {items.map((it, i) => (
              <motion.li key={it.title} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 px-3.5 py-2.5">
                <it.icon className="size-4 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">{it.title}</span>
                  <span className="block text-[12px] text-muted">{it.sub}</span>
                </span>
                {it.locked ? <Lock className="size-3.5 text-faint" /> : <Globe className="size-3.5 text-faint" />}
              </motion.li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-5 text-muted">
            SecureKnots Trust is a managed information-sharing service. Publishing does not certify the client; reports and certificates come from their independent auditors.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={go} disabled={busy} className="min-w-[132px]">
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-on-brand/30 border-t-on-brand" />
                Publishing
              </span>
            ) : (
              <><Check /> Publish {client.publishedAt ? "update" : "now"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
