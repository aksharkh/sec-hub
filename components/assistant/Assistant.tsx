"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowUpRight, Copy, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Kbd } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose } from "@/components/ui/overlay";
import { FRAMEWORKS, SEVERITY } from "@/lib/catalog";
import { useStore, type Store } from "@/lib/store";
import { cn, dayLabel, daysUntil } from "@/lib/utils";

type Msg = { id: number; role: "user" | "assistant"; text: string; actions?: { label: string; href: string }[]; draft?: boolean };

const SUGGESTIONS = [
  "What is blocking Northwind Cloud's FedRAMP audit?",
  "Which clients have critical gaps?",
  "Draft an evidence request for Kestrel Pay",
  "What changed this week?",
  "What needs my approval?",
];

/** Answers are composed from Workspace data, so the demo responds to what is actually on screen. */
function answer(q: string, s: Store): Omit<Msg, "id" | "role"> {
  const t = q.toLowerCase();
  const ctl = Object.values(s.controls);
  const client = s.clients.find((c) => t.includes(c.name.toLowerCase()) || t.includes(c.name.split(" ")[0].toLowerCase()));

  if (/draft|request|email|write/.test(t)) {
    const c = client ?? s.clients.find((x) => x.id === "kestrel")!;
    const pending = ctl.filter((x) => x.clientId === c.id && (x.status === "client" || x.status === "in_progress")).slice(0, 3);
    return {
      draft: true,
      text: `Subject: Evidence needed for ${c.name}, due ${dayLabel(new Date(Date.now() + 7 * 864e5).toISOString())}\n\nHi ${c.contacts[0].name.split(" ")[0]},\n\nTo keep the ${s.engagements.filter((e) => e.clientId === c.id).map((e) => FRAMEWORKS[e.framework].short).join(" and ")} work on track, we need the following from your team:\n${pending.map((p) => `- ${p.title} (${p.code}): an export showing the full period, with dates and system names visible`).join("\n")}\n\nYou can upload each item from your SecureKnots dashboard; it links to every framework that needs it, so nothing is sent twice.\n\nThanks,\nSeema`,
      actions: [{ label: `Open ${c.name}`, href: `/clients/${c.id}` }],
    };
  }

  if (client) {
    const engs = s.engagements.filter((e) => e.clientId === client.id);
    const lines = engs.map((e) => {
      const ec = ctl.filter((x) => x.engagementId === e.id);
      const done = ec.filter((x) => x.status === "approved").length;
      return `- **${FRAMEWORKS[e.framework].short}**: ${done} of ${ec.length} approved, target ${dayLabel(e.target)} (${Math.max(0, daysUntil(e.target))} days)`;
    });
    const cc = ctl.filter((x) => x.clientId === client.id);
    const revise = cc.filter((x) => x.status === "revise");
    const waiting = cc.filter((x) => x.status === "client");
    const overdue = cc.filter((x) => x.status !== "approved" && daysUntil(x.due) < 0);
    const gaps = s.gaps.filter((g) => g.clientId === client.id && g.status !== "closed").sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank);
    return {
      text: `**${client.name}** is in ${client.stage}.\n${lines.join("\n")}\n\nWhat is holding it back:\n- **${waiting.length}** controls are waiting on the client${waiting[0] ? `, oldest: ${waiting[0].title}` : ""}\n- **${revise.length}** were sent back for revision${revise[0] ? ` (${revise[0].reviseReason?.replace(/\.$/, "").toLowerCase()})` : ""}\n- **${overdue.length}** are overdue\n- **${gaps.length}** open gaps${gaps[0] ? `, most severe: ${gaps[0].title} (${SEVERITY[gaps[0].severity].label})` : ""}\n\nSuggested next step: chase the client requests first; they block ${waiting.length} controls at once.`,
      actions: [{ label: "Open workspace", href: `/clients/${client.id}/${engs[0]?.framework ?? ""}` }, { label: "Gap register", href: `/gaps?client=${client.id}` }],
    };
  }

  if (/gap|critical|risk/.test(t)) {
    const crit = s.gaps.filter((g) => g.status !== "closed" && (g.severity === "critical" || g.severity === "high"));
    const by = s.clients.map((c) => ({ c, n: crit.filter((g) => g.clientId === c.id) })).filter((x) => x.n.length).sort((a, b) => b.n.length - a.n.length);
    return {
      text: `${crit.length} critical or high gaps are open across ${by.length} clients:\n${by.map(({ c, n }) => `- **${c.name}**: ${n.length}, e.g. ${n[0].title}`).join("\n")}`,
      actions: [{ label: "Open gap register", href: "/gaps" }],
    };
  }

  if (/overdue|late|behind/.test(t)) {
    const od = ctl.filter((x) => x.status !== "approved" && daysUntil(x.due) < 0).sort((a, b) => a.due.localeCompare(b.due));
    return {
      text: `${od.length} controls are past their due date. The oldest:\n${od.slice(0, 5).map((x) => `- ${s.clients.find((c) => c.id === x.clientId)?.name} · ${x.code} ${x.title}, ${-daysUntil(x.due)} days late`).join("\n")}`,
      actions: [{ label: "Open Home", href: "/" }],
    };
  }

  if (/approv|review|queue/.test(t)) {
    const w = ctl.filter((x) => x.status === "review" && x.approvals.reviewed);
    const by = s.clients.map((c) => ({ c, n: w.filter((x) => x.clientId === c.id).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    return { text: `**${w.length}** controls passed QA and are waiting for you:\n${by.map(({ c, n }) => `- ${c.name}: ${n}`).join("\n")}\n\nTip: in Reviews, press A to approve and J to move to the next one.`, actions: [{ label: "Open Reviews", href: "/reviews" }] };
  }

  if (/week|changed|happen|update/.test(t)) {
    const recent = s.activity.filter((a) => Date.now() - +new Date(a.at) < 7 * 864e5);
    const n = (k: string) => recent.filter((a) => a.kind === k).length;
    return { text: `In the last 7 days:\n- **${n("approve")}** controls approved\n- **${n("upload")}** files uploaded by clients\n- **${n("revise")}** controls sent back for revision\n- **${n("comment")}** comments\n\nMost active client: ${s.clients.map((c) => ({ c, k: recent.filter((a) => a.clientId === c.id).length })).sort((a, b) => b.k - a.k)[0]?.c.name}.` };
  }

  return {
    text: "I can answer questions about clients, controls, gaps, reviews and deadlines in this Workspace, and draft client emails. Try naming a client, or ask what is overdue, what needs approval or what changed this week.",
  };
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const bullet = line.startsWith("- ");
        const parts = (bullet ? line.slice(2) : line).split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") ? <b key={j} className="font-semibold text-ink">{p.slice(2, -2)}</b> : <Fragment key={j}>{p}</Fragment>));
        if (!line.trim()) return <div key={i} className="h-2" />;
        return bullet ? (
          <div key={i} className="flex gap-2 pl-1"><span className="mt-[9px] size-1 shrink-0 rounded-full bg-faint" /><span>{parts}</span></div>
        ) : (
          <p key={i}>{parts}</p>
        );
      })}
    </>
  );
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    const on = () => setOpen(true);
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("sk:assistant", on);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("sk:assistant", on); window.removeEventListener("keydown", key); };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const ask = (text: string) => {
    if (!text.trim() || typing) return;
    seq.current += 2;
    const id = seq.current;
    const a = answer(text, useStore.getState());
    setMsgs((m) => [...m, { id, role: "user", text }, { id: id + 1, role: "assistant", text: "", actions: a.actions, draft: a.draft }]);
    setQ("");
    setTyping(true);
    let i = 0;
    const tick = setInterval(() => {
      i = Math.min(a.text.length, i + Math.ceil(a.text.length / 55));
      setMsgs((m) => m.map((x) => (x.id === id + 1 ? { ...x, text: a.text.slice(0, i) } : x)));
      if (i >= a.text.length) { clearInterval(tick); setTyping(false); }
    }, 24);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Assistant" className="w-[min(480px,calc(100vw-16px))]">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="grid size-7 place-items-center rounded-lg bg-ink text-inverse"><Sparkles className="size-3.5" /></span>
          <p className="text-[14px] font-semibold text-ink">Assistant</p>
          <Badge tone="neutral" dot={false}>Preview</Badge>
          <span className="ml-auto hidden items-center gap-1 text-[11.5px] text-faint sm:flex"><Kbd>Ctrl</Kbd><Kbd>/</Kbd></span>
          <SheetClose asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></SheetClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {msgs.length === 0 ? (
            <div className="pt-6">
              <p className="serif text-[30px] leading-tight text-ink">What do you need to know?</p>
              <p className="mt-2 text-[13px] leading-5 text-muted">Ask about any client, deadline, gap or review. Answers come from this Workspace and can be drafted into client emails.</p>
              <div className="mt-6 space-y-1.5">
                {SUGGESTIONS.map((sug, i) => (
                  <motion.button key={sug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} onClick={() => ask(sug)} className="group flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-left text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:bg-raised hover:text-ink">
                    <span className="flex-1">{sug}</span>
                    <ArrowUpRight className="size-3.5 text-faint transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {msgs.map((m) =>
                  m.role === "user" ? (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ml-10 rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[13.5px] leading-5 text-inverse">
                      {m.text}
                    </motion.div>
                  ) : (
                    <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-subtle text-ink"><Sparkles className="size-3" /></span>
                      <div className="min-w-0 flex-1">
                        <div className={cn("space-y-1 text-[13.5px] leading-6 text-ink-2", m.draft && "whitespace-pre-wrap rounded-xl border border-line bg-raised p-3 font-[450]")}>
                          {m.draft ? m.text : <Rich text={m.text} />}
                          {m.text.length === 0 && <span className="inline-flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: `${i * 150}ms` }} />)}</span>}
                        </div>
                        {!typing && (m.actions?.length || m.draft) && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 flex flex-wrap gap-1.5">
                            {m.draft && <Button size="xs" variant="secondary" onClick={() => { navigator.clipboard?.writeText(m.text); toast("Draft copied"); }}><Copy /> Copy draft</Button>}
                            {m.actions?.map((a) => (
                              <Button key={a.href} size="xs" variant="secondary" asChild><Link href={a.href} onClick={() => setOpen(false)}>{a.label} <ArrowUpRight /></Link></Button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ),
                )}
              </AnimatePresence>
              <div ref={end} />
            </div>
          )}
        </div>

        <div className="border-t border-line p-3">
          <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-surface p-1.5 pl-3 shadow-xs focus-within:border-ink">
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q); } }}
              rows={1}
              placeholder="Ask about a client, a deadline or a gap"
              className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-[13.5px] text-ink outline-none placeholder:text-faint"
            />
            <Button size="icon" variant="primary" disabled={!q.trim() || typing} onClick={() => ask(q)} aria-label="Send"><ArrowUp /></Button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-faint">Drafted from Workspace data. Review before sending anything to a client.</p>
        </div>
      </div>
    </Sheet>
  );
}

export const openAssistant = () => window.dispatchEvent(new CustomEvent("sk:assistant"));
