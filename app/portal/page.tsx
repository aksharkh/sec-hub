"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Check, CircleCheck, Clock3, Hourglass, Send, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Code, FrameworkChip, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Card, CardHead, EmptyState, ProgressRing, Skeleton } from "@/components/ui/misc";
import { DueChip } from "@/components/workspace/ControlDetail";
import { Dropzone } from "@/components/workspace/Dropzone";
import { DOMAINS, FRAMEWORKS } from "@/lib/catalog";
import { useReady } from "@/lib/hooks";
import { progressOf, usePerson, useStore } from "@/lib/store";
import { ago, cn, dayLabel, daysUntil } from "@/lib/utils";

export default function PortalPage() {
  const ready = useReady();
  const viewAs = useStore((s) => s.viewAs) ?? "northwind";
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const all = useStore((s) => s.controls);
  const requests = useStore((s) => s.requests);
  const gaps = useStore((s) => s.gaps);
  const submitRequest = useStore((s) => s.submitRequest);
  const addComment = useStore((s) => s.addComment);
  const person = usePerson();
  const [msg, setMsg] = useState("");
  const [fw, setFw] = useState<string | null>(null);

  const client = clients.find((c) => c.id === viewAs);
  const engs = useMemo(() => engagements.filter((e) => e.clientId === viewAs), [engagements, viewAs]);
  const cs = useMemo(() => Object.values(all).filter((c) => c.clientId === viewAs), [all, viewAs]);
  const myReqs = requests.filter((r) => r.clientId === viewAs).sort((a, b) => Number(a.status !== "open") - Number(b.status !== "open") || a.due.localeCompare(b.due));
  const myGaps = gaps.filter((g) => g.clientId === viewAs && g.status !== "closed");
  const messages = useMemo(
    () => cs.flatMap((c) => c.comments.filter((m) => !m.internal).map((m) => ({ ...m, control: c }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
    [cs],
  );

  if (!ready || !client)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        <Skeleton className="h-10 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2"><Skeleton className="h-44 rounded-xl" /><Skeleton className="h-44 rounded-xl" /></div>
      </div>
    );

  const active = fw ?? engs[0]?.id;
  const activeControls = cs.filter((c) => c.engagementId === active);
  const buckets = [
    { key: "done", label: "Done", icon: CircleCheck, cls: "text-ok", items: activeControls.filter((c) => c.status === "approved") },
    { key: "you", label: "Waiting on you", icon: Hourglass, cls: "text-warn", items: activeControls.filter((c) => c.status === "client") },
    { key: "sk", label: "SecureKnots is working on it", icon: Wrench, cls: "text-info", items: activeControls.filter((c) => ["in_progress", "review", "revise"].includes(c.status)) },
    { key: "next", label: "Not started yet", icon: Clock3, cls: "text-faint", items: activeControls.filter((c) => c.status === "not_started") },
  ];
  const lead = person(client.ownerId);
  const open = myReqs.filter((r) => r.status === "open").length;

  return (
    <div className="fade-up mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6">
      <div id="overview" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="serif text-[38px] leading-[1.05] text-ink md:text-[44px]">Hi {client.contacts[0].name.split(" ")[0]},</h1>
          <p className="mt-2 max-w-xl text-[14.5px] leading-6 text-ink-2">
            {open > 0 ? <>SecureKnots needs <b className="font-semibold text-ink">{open} item{open > 1 ? "s" : ""}</b> from your team. </> : "Nothing is waiting on your team right now. "}
            Here is where {client.name} stands on {engs.map((e) => FRAMEWORKS[e.framework].short).join(" and ")}.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 shadow-xs">
          <Avatar person={lead} size="md" />
          <div className="text-[12.5px] leading-tight">
            <p className="text-muted">Your SecureKnots lead</p>
            <p className="font-medium text-ink">{lead.name}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {engs.map((e) => {
          const ec = cs.filter((c) => c.engagementId === e.id);
          const p = progressOf(ec);
          const days = daysUntil(e.target);
          return (
            <button key={e.id} onClick={() => setFw(e.id)} className="text-left">
              <Card className={cn("flex items-center gap-5 p-5 transition-[border-color,box-shadow]", active === e.id ? "border-brand shadow-[0_0_0_3px_var(--ring)]" : "hover:border-line-strong")}>
                <ProgressRing value={p.pct} size={76} stroke={6} />
                <div className="min-w-0">
                  <FrameworkChip fw={e.framework} />
                  <p className="mt-2 text-[17px] font-semibold tracking-[-0.015em] text-ink">{FRAMEWORKS[e.framework].name}</p>
                  <p className="tnum mt-0.5 text-[13px] text-muted">{p.done} of {p.total} controls complete</p>
                  <p className={cn("tnum mt-1.5 flex items-center gap-1 text-[12.5px]", days >= 0 && days <= 30 ? "font-medium text-warn" : "text-muted")}>
                    <CalendarClock className="size-3.5" />{days >= 0 ? `Target ${dayLabel(e.target)} · ${days} days` : `Completed ${dayLabel(e.target)}`}
                  </p>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card id="requests">
          <CardHead title="Requests from SecureKnots" sub="Upload here; your SecureKnots team is notified straight away." />
          {myReqs.length === 0 ? (
            <EmptyState title="Nothing needed" body="When SecureKnots needs a document from your team it shows up here." className="py-10" />
          ) : (
            <ul className="space-y-2 px-3 pb-3">
              <AnimatePresence initial={false}>
                {myReqs.map((r) => {
                  const ctl = all[r.controlId];
                  return (
                    <motion.li key={r.id} layout className={cn("rounded-xl border p-3.5 transition-colors", r.status === "open" ? "border-line bg-surface" : "border-transparent bg-raised")}>
                      <div className="flex items-start gap-3">
                        <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", r.status === "open" ? (daysUntil(r.due) < 0 ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn") : "bg-ok-soft text-ok")}>
                          {r.status === "open" ? <Hourglass className="size-3.5" /> : <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium leading-5 text-ink">{r.title}</p>
                          {ctl && <p className="mt-0.5 text-[12px] text-muted"><Code className="text-[11.5px]">{ctl.code}</Code> · {ctl.title}</p>}
                          {r.note && r.status === "open" && <p className="mt-2 rounded-lg bg-raised px-2.5 py-1.5 text-[12.5px] leading-5 text-ink-2">{r.note}</p>}
                        </div>
                        {r.status === "open" ? <DueChip due={r.due} /> : <span className="text-[12px] font-medium text-ok">Submitted</span>}
                      </div>
                      {r.status === "open" && (
                        <div className="mt-3 pl-9">
                          <Dropzone
                            compact
                            label="Drop the file here or browse"
                            sub="It goes straight to your SecureKnots team"
                            onDone={(files) => { submitRequest(r.id, files); toast.success("Thanks, that's with SecureKnots now", { description: `${files.map((f) => f.name).join(", ")} uploaded.` }); }}
                          />
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="Progress by area" sub={engs.find((e) => e.id === active) ? FRAMEWORKS[engs.find((e) => e.id === active)!.framework].name : undefined} />
            <ul className="px-4 pb-4">
              {buckets.map((b) => (
                <li key={b.key} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                  <b.icon className={cn("size-4", b.cls)} />
                  <span className="flex-1 text-[13px] text-ink-2">{b.label}</span>
                  <span className="tnum text-[13px] font-semibold text-ink">{b.items.length}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3">
              <p className="mb-2 text-[12px] font-medium text-muted">By domain</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {DOMAINS.filter((d) => activeControls.some((c) => c.domain === d.id)).map((d) => {
                  const dc = activeControls.filter((c) => c.domain === d.id);
                  const p = progressOf(dc);
                  return (
                    <div key={d.id}>
                      <div className="flex justify-between text-[11.5px]"><span className="truncate text-ink-2">{d.name}</span><span className="tnum text-muted">{p.pct}%</span></div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-subtle-2"><div className={cn("h-full rounded-full", p.pct === 100 ? "bg-ok-dot" : "bg-brand")} style={{ width: `${p.pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card id="gaps">
            <CardHead title="Gaps to fix on your side" sub="Found during gap analysis, with the agreed fix" />
            <ul className="px-3 pb-3">
              {myGaps.length === 0 && <li className="px-1 pb-2 text-[13px] text-muted">No open gaps.</li>}
              {myGaps.slice(0, 4).map((g) => (
                <li key={g.id} className="rounded-lg px-2 py-2.5">
                  <div className="flex items-center gap-2"><SeverityBadge severity={g.severity} /><span className="ml-auto"><DueChip due={g.due} /></span></div>
                  <p className="mt-1.5 text-[13px] font-medium text-ink">{g.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-5 text-muted">{g.plan}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card id="messages" className="mt-4">
        <CardHead title="Messages" sub="Conversations with SecureKnots about your controls" />
        <ul className="space-y-4 px-4 pb-2">
          {messages.length === 0 && <li className="text-[13px] text-muted">No messages yet.</li>}
          {messages.map((m) => {
            const p = person(m.by);
            return (
              <li key={m.id} className="flex gap-3">
                <Avatar person={p} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px]"><span className="font-medium text-ink">{p.name}</span> <span className="text-faint">· {ago(m.at)} · on {m.control.code}</span></p>
                  <p className="mt-0.5 text-[13.5px] leading-[1.55] text-ink-2">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-end gap-2 border-t border-line p-3">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Message ${lead.name.split(" ")[0]} and the SecureKnots team`} className="min-h-[44px] flex-1" />
          <Button
            variant="primary"
            disabled={!msg.trim()}
            onClick={() => {
              const target = messages[0]?.control ?? activeControls[0];
              if (target) addComment(target.id, msg.trim(), false, `client:${client.id}:0`);
              setMsg("");
              toast.success("Message sent to SecureKnots");
            }}
          >
            <Send /> Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
