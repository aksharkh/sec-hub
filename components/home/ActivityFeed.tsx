"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleAlert, MessageSquare, Rocket, Upload, UserRound, ArrowRightLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePerson, useStore } from "@/lib/store";
import type { ActivityKind } from "@/lib/types";
import { ago, cn } from "@/lib/utils";

const ICON: Record<ActivityKind, { I: typeof Check; cls: string }> = {
  approve: { I: Check, cls: "bg-ok-soft text-ok" },
  revise: { I: CircleAlert, cls: "bg-bad-soft text-bad" },
  upload: { I: Upload, cls: "bg-info-soft text-info" },
  comment: { I: MessageSquare, cls: "bg-subtle-2 text-muted" },
  status: { I: ArrowRightLeft, cls: "bg-rev-soft text-rev" },
  assign: { I: UserRound, cls: "bg-subtle-2 text-muted" },
  gap: { I: CircleAlert, cls: "bg-warn-soft text-warn" },
  publish: { I: Rocket, cls: "bg-brand-soft text-brand" },
};

export function ActivityFeed({ clientId, limit = 9 }: { clientId?: string; limit?: number }) {
  const activity = useStore((s) => s.activity);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const controls = useStore((s) => s.controls);
  const person = usePerson();
  const items = (clientId ? activity.filter((a) => a.clientId === clientId) : activity).slice(0, limit);

  return (
    <ul className="relative px-4 pb-3">
      <AnimatePresence initial={false}>
        {items.map((a, i) => {
          const p = person(a.by);
          const client = clients.find((c) => c.id === a.clientId);
          const ctl = a.controlId ? controls[a.controlId] : undefined;
          const eng = ctl ? engagements.find((e) => e.id === ctl.engagementId) : undefined;
          const href = ctl && eng ? `/clients/${a.clientId}/${eng.framework}?control=${ctl.id}` : `/clients/${a.clientId}`;
          const { I, cls } = ICON[a.kind];
          return (
            <motion.li key={a.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="relative flex gap-3 py-2">
              {i < items.length - 1 && <span className="absolute left-[13px] top-9 h-[calc(100%-24px)] w-px bg-line" />}
              <span className="relative">
                <Avatar person={p} size="md" />
                <span className={cn("absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full ring-2 ring-surface", cls)}>
                  <I className="size-2.5" strokeWidth={2.5} />
                </span>
              </span>
              <Link href={href} className="group min-w-0 flex-1 text-[13px] leading-5">
                <span className="font-medium text-ink">{p.name}</span>{" "}
                <span className="text-ink-2 group-hover:text-ink">{a.text}</span>
                {!clientId && client && <span className="text-muted"> · {client.name}</span>}
                <span className="block text-[11.5px] text-faint">{ago(a.at)}</span>
              </Link>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
