"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { useStore } from "@/lib/store";
import type { Client, Control } from "@/lib/types";

export function RequestDialog({ client, controls, open, onOpenChange }: { client: Client; controls: Control[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const requestEvidence = useStore((s) => s.requestEvidence);
  const options = useMemo(() => controls.filter((c) => c.status !== "approved").sort((a, b) => a.order - b.order), [controls]);
  const [cid, setCid] = useState<string>("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [due, setDue] = useState("7");
  const c = options.find((x) => x.id === cid);

  const submit = () => {
    if (!c) return;
    requestEvidence(c.id, title || `${c.title}: supporting evidence`, note, Number(due));
    toast.success(`Request sent to ${client.contacts[0].name}`, { description: `${c.code} moved to Waiting on client. They see it in their dashboard.` });
    setCid(""); setTitle(""); setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Request evidence from the client" description={`${client.contacts[0].name} (${client.contacts[0].title}) gets an email and sees the request in the ${client.name} dashboard.`}>
        <div className="space-y-4 px-5 py-4">
          <div>
            <Label>Control</Label>
            <Select
              value={cid}
              onValueChange={(v) => { setCid(v); const x = options.find((o) => o.id === v); if (x && !title) setTitle(`${x.title}: supporting evidence`); }}
              placeholder="Choose a control"
              options={options.map((o) => ({ value: o.id, label: `${o.code} · ${o.title}` }))}
            />
          </div>
          <div>
            <Label>What do you need?</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Q3 access review sign-off export" />
          </div>
          <div>
            <Label hint="Shown to the client">Instructions</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Export from the admin console with the date visible, covering the full audit period." />
          </div>
          <div>
            <Label>Due</Label>
            <Select value={due} onValueChange={setDue} options={[{ value: "3", label: "In 3 days" }, { value: "7", label: "In 1 week" }, { value: "14", label: "In 2 weeks" }]} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!c} onClick={submit}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
