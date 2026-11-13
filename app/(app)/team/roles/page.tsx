"use client";

import { Fragment, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/form";
import { Card, PageHeader } from "@/components/ui/misc";
import { Tip } from "@/components/ui/overlay";
import { ROLES } from "@/lib/catalog";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_ORDER: Role[] = ["admin", "lead", "consultant", "reviewer", "sales", "marketing"];

const GROUPS: { name: string; perms: { id: string; label: string; hint: string; on: Role[] }[] }[] = [
  {
    name: "Clients",
    perms: [
      { id: "client.view", label: "See the client list and stages", hint: "Names, frameworks, stage, plan", on: ["admin", "lead", "consultant", "reviewer", "sales"] },
      { id: "client.create", label: "Create and onboard clients", hint: "Pick frameworks, invite client admins", on: ["admin", "lead"] },
    ],
  },
  {
    name: "Engagement work",
    perms: [
      { id: "control.edit", label: "Prepare controls", hint: "Edit status, owner and due dates", on: ["admin", "lead", "consultant"] },
      { id: "evidence.view", label: "Open client evidence", hint: "Files uploaded by clients and the team", on: ["admin", "lead", "consultant", "reviewer"] },
      { id: "evidence.upload", label: "Upload evidence", hint: "Linked to every mapped framework", on: ["admin", "lead", "consultant"] },
      { id: "gap.manage", label: "Manage the gap register", hint: "Create, assign and close gaps", on: ["admin", "lead", "consultant"] },
    ],
  },
  {
    name: "Reviews",
    perms: [
      { id: "review.qa", label: "QA review", hint: "Pass or send back prepared controls", on: ["admin", "lead", "reviewer"] },
      { id: "review.approve", label: "Final approval", hint: "Locks evidence for the audit packet", on: ["admin", "lead"] },
    ],
  },
  {
    name: "Clients and Trust",
    perms: [
      { id: "client.message", label: "Message clients", hint: "Comments marked visible to the client", on: ["admin", "lead", "consultant"] },
      { id: "trust.publish", label: "Publish to SecureKnots Trust", hint: "Only certified clients on the Trust plan", on: ["admin"] },
      { id: "trust.view", label: "See published trust pages", hint: "Read-only", on: ["admin", "lead", "consultant", "reviewer", "sales", "marketing"] },
    ],
  },
  {
    name: "Administration",
    perms: [
      { id: "team.manage", label: "Manage team and roles", hint: "Invite, remove, change roles", on: ["admin"] },
      { id: "settings", label: "Workspace settings", hint: "Integrations, security, billing", on: ["admin"] },
    ],
  },
];

export default function RolesPage() {
  const [grid, setGrid] = useState(() => Object.fromEntries(GROUPS.flatMap((g) => g.perms).map((p) => [p.id, new Set(p.on)])));
  const toggle = (perm: string, role: Role) => {
    setGrid((g) => {
      const s = new Set(g[perm]);
      if (s.has(role)) s.delete(role);
      else s.add(role);
      return { ...g, [perm]: s };
    });
    toast.success("Permission updated", { description: `${ROLES[role].label} · change applies on their next page load.` });
  };

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader title="Roles & permissions" description="Level-wise access for the SecureKnots team. Admin always keeps every permission so nobody can lock the workspace." />
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[880px] text-[13px]">
          <thead className="sticky top-0 bg-raised">
            <tr className="border-b border-line">
              <th className="h-14 pl-4 text-left text-[12px] font-medium text-muted">Permission</th>
              {ROLE_ORDER.map((r) => (
                <th key={r} className="w-[110px] px-2 text-center">
                  <span className="block text-[12.5px] font-semibold text-ink">{ROLES[r].label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.name}>
                <tr><td colSpan={7} className="bg-subtle/60 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{g.name}</td></tr>
                {g.perms.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-raised">
                    <td className="py-3 pl-4">
                      <p className="font-medium text-ink">{p.label}</p>
                      <p className="text-[12px] text-muted">{p.hint}</p>
                    </td>
                    {ROLE_ORDER.map((r) => (
                      <td key={r} className="text-center">
                        {r === "admin" ? (
                          <Tip content="Admin always has this">
                            <span className={cn("inline-flex size-6 items-center justify-center rounded-full bg-subtle text-faint")}><Lock className="size-3" /></span>
                          </Tip>
                        ) : (
                          <Switch checked={grid[p.id].has(r)} onCheckedChange={() => toggle(p.id, r)} aria-label={`${p.label} for ${ROLES[r].label}`} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
