"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { useStore } from "@/lib/store";
import type { Control } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK = [
  "Evidence does not cover the full audit period.",
  "Screenshot has no date or system name visible.",
  "Policy version does not match the approved version.",
  "Population list missing; a sample alone is not enough.",
];

export function SendBackDialog({ control, open, onOpenChange, onDone }: { control: Control | null; open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  const [reason, setReason] = useState("");
  const sendBack = useStore((s) => s.sendBack);
  const setStatus = useStore((s) => s.setStatus);
  if (!control) return null;
  const submit = () => {
    const prev = control.status;
    sendBack(control.id, reason.trim());
    toast(`${control.code} sent back for revision`, {
      description: "The owner sees your reason at the top of the control.",
      action: { label: "Undo", onClick: () => setStatus(control.id, prev) },
    });
    setReason("");
    onOpenChange(false);
    onDone?.();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Send ${control.code} back for revision`} description="The control moves to Revise and returns to its owner with your note.">
        <div className="space-y-3 px-5 py-4">
          <div>
            <Label htmlFor="reason">What needs to change?</Label>
            <Textarea id="reason" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Be specific so the owner can fix it in one pass." />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => setReason(q)} className={cn("rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 transition-colors hover:border-line-strong hover:bg-subtle", reason === q && "border-brand bg-brand-soft text-brand-ink")}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger" disabled={reason.trim().length < 6} onClick={submit}>Send back</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApproveDialog({ control, open, onOpenChange, onDone }: { control: Control | null; open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  const members = useStore((s) => s.members);
  const approve = useStore((s) => s.approve);
  const setStatus = useStore((s) => s.setStatus);
  const [to, setTo] = useState("keep");
  const [note, setNote] = useState("");
  if (!control) return null;
  const owner = members.find((m) => m.id === control.ownerId);
  const submit = () => {
    const prev = control.status;
    approve(control.id, to === "keep" ? undefined : to, note.trim() || undefined);
    const who = members.find((m) => m.id === to);
    toast.success(`${control.code} approved`, {
      description: who ? `Handed to ${who.name}${note ? ` · ${note}` : ""}` : "Evidence is locked for the audit packet.",
      action: { label: "Undo", onClick: () => setStatus(control.id, prev) },
    });
    setNote("");
    setTo("keep");
    onOpenChange(false);
    onDone?.();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Approve ${control.code}`} description={control.title}>
        <div className="space-y-4 px-5 py-4">
          <div>
            <Label>Hand off to</Label>
            <Select
              value={to}
              onValueChange={setTo}
              options={[
                { value: "keep", label: `Keep with ${owner?.name ?? "current owner"}`, hint: "No hand-off" },
                ...members.filter((m) => !["sales", "marketing"].includes(m.role)).map((m) => ({ value: m.id, label: m.name, hint: m.title })),
              ]}
            />
            <p className="mt-1.5 text-[12px] text-muted">The next person gets a notification and the control in their work list.</p>
          </div>
          <div>
            <Label hint="Optional">Note for the next step</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: add to the auditor walkthrough on Thursday." className="min-h-[64px]" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-[12.5px] text-ok">
            {owner && <Avatar person={owner} size="xs" />}
            Evidence is locked once approved. Anyone can reopen it with a reason.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Approve{to !== "keep" ? " and hand off" : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
