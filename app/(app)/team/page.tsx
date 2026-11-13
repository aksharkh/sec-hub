"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Card, PageHeader, Skeleton } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { ROLES, STATUS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TeamPage() {
  const ready = useReady();
  const members = useStore((s) => s.members);
  const clients = useStore((s) => s.clients);
  const controls = useStore((s) => s.controls);
  const [invite, setInvite] = useState(false);
  const [role, setRole] = useState<Role>("consultant");

  const stats = useMemo(() => {
    const list = Object.values(controls);
    return Object.fromEntries(
      members.map((m) => {
        const mine = list.filter((c) => c.ownerId === m.id);
        return [m.id, {
          open: mine.filter((c) => c.status !== "approved").length,
          review: list.filter((c) => c.reviewerId === m.id && c.status === "review" && !c.approvals.reviewed).length,
          approvals: m.role === "admin" ? list.filter((c) => c.status === "review" && c.approvals.reviewed).length : 0,
          revise: mine.filter((c) => c.status === "revise").length,
        }];
      }),
    );
  }, [members, controls]);

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Team"
        description="Seven people across Wilmington, London and Bengaluru. Each role sees only what it needs; sales and marketing never see client evidence."
        actions={
          <>
            <Button variant="secondary" asChild><Link href="/team/roles"><ShieldCheck /> Roles & permissions</Link></Button>
            <Button variant="primary" onClick={() => setInvite(true)}><Plus /> Invite</Button>
          </>
        }
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {!ready
          ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[196px] rounded-xl" />)
          : members.map((m, i) => {
              const s = stats[m.id];
              const theirs = clients.filter((c) => c.team.includes(m.id));
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="h-full p-4">
                    <div className="flex items-start gap-3">
                      <Avatar person={m} size="xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{m.name}</p>
                        <p className="truncate text-[12.5px] text-muted">{m.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-[12px] text-faint"><MapPin className="size-3" />{m.location}</p>
                      </div>
                      <Badge tone={m.role === "admin" ? "brand" : m.role === "sales" || m.role === "marketing" ? "neutral" : "info"} dot={false}>{ROLES[m.role].label}</Badge>
                    </div>
                    {["sales", "marketing"].includes(m.role) ? (
                      <p className="mt-4 rounded-lg bg-raised px-3 py-2.5 text-[12.5px] leading-5 text-muted">{ROLES[m.role].blurb}.</p>
                    ) : (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {[
                          { l: m.role === "admin" ? "To approve" : m.role === "reviewer" ? "To QA" : "Open", n: m.role === "admin" ? s.approvals : m.role === "reviewer" ? s.review : s.open },
                          { l: STATUS.revise.label, n: s.revise },
                          { l: "Clients", n: theirs.length || (m.role === "admin" ? clients.length : 0) },
                        ].map((x) => (
                          <div key={x.l} className="rounded-lg bg-raised px-2.5 py-2">
                            <p className="tnum text-[17px] font-semibold text-ink">{x.n}</p>
                            <p className="text-[11.5px] text-muted">{x.l}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={cn("mt-3 flex flex-wrap gap-1", !theirs.length && "hidden")}>
                      {theirs.slice(0, 4).map((c) => (
                        <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2 text-[11.5px] text-ink-2 hover:bg-subtle">
                          <ClientMark name={c.name} hue={c.hue} size="sm" className="!size-4 !rounded-full !text-[7px]" />
                          {c.name.split(" ")[0]}
                        </Link>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      <Dialog open={invite} onOpenChange={setInvite}>
        <DialogContent title="Invite a team member" description="They sign in with their SecureKnots Microsoft 365 account.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email");
              toast.success("Invitation sent", { description: `${email} joins as ${ROLES[role].label}.` });
              setInvite(false);
            }}
          >
            <div className="space-y-4 px-5 py-4">
              <div><Label htmlFor="iname">Name</Label><Input id="iname" name="name" required placeholder="Full name" /></div>
              <div><Label htmlFor="iemail">Work email</Label><Input id="iemail" name="email" type="email" required placeholder="name@secureknots.com" /></div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)} options={(Object.keys(ROLES) as Role[]).map((r) => ({ value: r, label: ROLES[r].label }))} />
                <p className="mt-1.5 text-[12px] text-muted">{ROLES[role].blurb}.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setInvite(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Send invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
