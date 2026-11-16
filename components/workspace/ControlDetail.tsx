"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, CalendarDays, Check, ChevronDown, Link2, Lock, Paperclip, RotateCcw, Send, ShieldCheck, X, Eye, CircleAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Badge, Code, FrameworkChip, StatusBadge, StatusIcon } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch, Tabs } from "@/components/ui/form";
import { FileIcon } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger, SheetClose, Tip } from "@/components/ui/overlay";
import { FRAMEWORKS, STATUS, STATUS_ORDER, UNIFIED, domainName } from "@/lib/catalog";
import { usePerson, useStore } from "@/lib/store";
import type { Control, FrameworkKey } from "@/lib/types";
import { ago, cn, dateTime, dayLabel, daysUntil, fileSize } from "@/lib/utils";
import { Dropzone } from "./Dropzone";
import { checksFor, precheck } from "@/lib/ai";
import type { Evidence } from "@/lib/types";

function AiChip({ e }: { e: Evidence }) {
  const cs = checksFor(e);
  const ok = cs.filter((x) => x.pass).length;
  return (
    <Tip content={<span className="block space-y-0.5">{cs.map((x) => <span key={x.label} className="flex items-center gap-1.5">{x.pass ? "✓" : "✕"} {x.label}</span>)}</span>}>
      <span className={cn("inline-flex h-[22px] items-center gap-1 rounded-full px-1.5 text-[11px] font-semibold", ok === cs.length ? "bg-subtle text-ink-2" : "bg-warn-soft text-warn")}>
        <Sparkles className="size-3" />{ok}/{cs.length}
      </span>
    </Tip>
  );
}

function Precheck({ files, clientName, contact, onRequest }: { files: Evidence[]; clientName: string; contact: string; onRequest: (text: string) => void }) {
  const r = precheck(files);
  const clean = r.failed.length === 0;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-2.5 rounded-xl border px-3.5 py-3", clean ? "border-line bg-raised" : "border-warn/30 bg-warn-soft/40")}>
      <div className="flex items-center gap-2">
        <span className={cn("grid size-6 place-items-center rounded-md", clean ? "bg-ink text-inverse" : "bg-warn text-white")}><Sparkles className="size-3.5" /></span>
        <p className="text-[13px] font-semibold text-ink">Automatic pre-check · {r.passed} of {r.total} passed</p>
        <span className="ml-auto text-[11.5px] text-muted">{clean ? "Ready for QA" : "Likely to be sent back"}</span>
      </div>
      {!clean && (
        <>
          <ul className="mt-2 space-y-1">
            {r.failed.slice(0, 3).map((f) => (
              <li key={f.file.id + f.label} className="flex gap-2 text-[12.5px] leading-5 text-ink-2"><span className="text-warn">✕</span><span><b className="font-medium text-ink">{f.file.name}</b>: {f.note}</span></li>
            ))}
          </ul>
          <Button size="xs" variant="secondary" className="mt-2.5" onClick={() => onRequest(`Hi ${contact.split(" ")[0]}, the pre-check found: ${r.failed.slice(0, 3).map((f) => `${f.file.name}: ${f.note?.toLowerCase()}`).join("; ")}. Could you send updated versions for ${clientName}?`)}>
            <Send /> Ask the client to fix it
          </Button>
        </>
      )}
    </motion.div>
  );
}
import { ApproveDialog, SendBackDialog } from "./ReviewDialogs";

export function DueChip({ due, status, className }: { due: string; status?: Control["status"]; className?: string }) {
  const d = daysUntil(due);
  const done = status === "approved";
  const late = !done && d < 0;
  const soon = !done && d >= 0 && d <= 3;
  return (
    <span className={cn("tnum inline-flex items-center gap-1 whitespace-nowrap text-[12px]", late ? "font-medium text-bad" : soon ? "font-medium text-warn" : "text-muted", className)}>
      <CalendarDays className="size-3.5 opacity-80" />
      {late ? `${-d}d overdue` : dayLabel(due)}
    </span>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-3 py-1.5">
      <span className="text-[12.5px] text-muted">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Step({ done, active, label, by, at, last }: { done: boolean; active: boolean; label: string; by?: string; at?: string; last?: boolean }) {
  const person = usePerson();
  return (
    <li className="relative flex flex-1 flex-col items-start gap-2">
      <div className="flex w-full items-center">
        <span
          className={cn(
            "relative z-10 grid size-6 place-items-center rounded-full border text-[11px] font-semibold transition-colors",
            done ? "border-ok bg-ok text-inverse" : active ? "border-brand bg-brand-soft text-brand" : "border-line-strong bg-surface text-faint",
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={3} /> : active ? <span className="size-1.5 animate-pulse rounded-full bg-brand" /> : null}
        </span>
        {!last && <span className={cn("mx-1.5 h-px flex-1", done ? "bg-ok" : "bg-line-strong")} />}
      </div>
      <div className="pr-2">
        <p className={cn("text-[12.5px] font-medium", done || active ? "text-ink" : "text-faint")}>{label}</p>
        {by && at ? (
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted">
            <Avatar person={person(by)} size="xs" className="!size-4 !text-[7px]" />
            {person(by).name.split(" ")[0]} · {ago(at)}
          </p>
        ) : (
          <p className="mt-0.5 text-[11.5px] text-faint">{active ? "Waiting" : "Not yet"}</p>
        )}
      </div>
    </li>
  );
}

function Composer({ onSend, mentions, clientFacing }: { onSend: (body: string, internal: boolean) => void; mentions: { id: string; name: string; hue: number }[]; clientFacing: boolean }) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(true);
  const [mq, setMq] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const hits = mq !== null ? mentions.filter((m) => m.name.toLowerCase().includes(mq.toLowerCase())).slice(0, 5) : [];

  const onChange = (v: string) => {
    setBody(v);
    const m = /@([\w]*)$/.exec(v.slice(0, ref.current?.selectionStart ?? v.length));
    setMq(m ? m[1] : null);
  };
  const pickMention = (name: string) => {
    setBody((b) => b.replace(/@[\w]*$/, `@${name} `));
    setMq(null);
    ref.current?.focus();
  };
  const send = () => {
    if (!body.trim()) return;
    onSend(body.trim(), clientFacing ? internal : true);
    setBody("");
  };
  return (
    <div className={cn("relative rounded-xl border bg-surface shadow-xs transition-colors focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--ring)]", internal || !clientFacing ? "border-line-strong" : "border-warn/50")}>
      <AnimatePresence>
        {hits.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-2 z-10 mb-1.5 w-56 rounded-xl border border-line bg-surface p-1 shadow-pop">
            {hits.map((m) => (
              <li key={m.id}>
                <button onMouseDown={(e) => { e.preventDefault(); pickMention(m.name); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-2 hover:bg-subtle">
                  <Avatar person={m} size="xs" />
                  {m.name}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <textarea
        ref={ref}
        value={body}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
          if (e.key === "Escape") setMq(null);
        }}
        rows={2}
        placeholder={clientFacing && !internal ? "Write to the client. They will see this." : "Add a note for the team. Type @ to mention someone."}
        className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[13.5px] leading-5 text-ink outline-none placeholder:text-faint"
      />
      <div className="flex items-center gap-2 px-2.5 pb-2 pt-1">
        {clientFacing && (
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted">
            <Switch checked={internal} onCheckedChange={setInternal} />
            {internal ? (
              <span className="flex items-center gap-1"><Lock className="size-3" /> Internal note</span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-warn"><Eye className="size-3" /> Visible to client</span>
            )}
          </label>
        )}
        <span className="ml-auto text-[11px] text-faint">Ctrl + Enter</span>
        <Button size="xs" variant={body.trim() ? "primary" : "secondary"} disabled={!body.trim()} onClick={send}>
          <Send />
          Send
        </Button>
      </div>
    </div>
  );
}

export function ControlDetail({ id, onClose }: { id: string; onClose?: () => void }) {
  const c = useStore((s) => s.controls[id]);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const members = useStore((s) => s.members);
  const evidenceMap = useStore((s) => s.evidence);
  const allControls = useStore((s) => s.controls);
  const { setStatus, assign, qaPass, addComment, upload, setDue, requestEvidence } = useStore.getState();
  const person = usePerson();
  const [tab, setTab] = useState<"comments" | "history">("comments");
  const [approveOpen, setApproveOpen] = useState(false);
  const [backOpen, setBackOpen] = useState(false);

  const client = clients.find((x) => x.id === c?.clientId);
  const eng = engagements.find((e) => e.id === c?.engagementId);

  const mappings = useMemo(() => {
    if (!c) return [];
    const u = UNIFIED.find((x) => x.id === c.unifiedId);
    if (!u) return [];
    return (Object.entries(u.map) as [FrameworkKey, string][])
      .filter(([fw]) => fw !== eng?.framework)
      .map(([fw, code]) => {
        const sibling = Object.values(allControls).find((x) => x.clientId === c.clientId && x.unifiedId === c.unifiedId && x.engagementId.endsWith(`-${fw}`));
        return { fw, code, sibling };
      })
      .sort((a, b) => Number(!!b.sibling) - Number(!!a.sibling));
  }, [c, eng, allControls]);

  if (!c || !client || !eng) return null;
  const evidence = c.evidenceIds.map((e) => evidenceMap[e]).filter(Boolean);
  const owner = person(c.ownerId);
  const a = c.approvals;
  const stage = c.status === "approved" ? 4 : c.status === "review" ? (a.reviewed ? 2 : 1) : 0;

  const change = (s: Control["status"]) => {
    const prev = c.status;
    setStatus(c.id, s);
    toast(`${c.code} moved to ${STATUS[s].label}`, { action: { label: "Undo", onClick: () => setStatus(c.id, prev) } });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <ClientMark name={client.name} hue={client.hue} size="sm" />
        <span className="truncate text-[13px] text-muted">{client.name}</span>
        <FrameworkChip fw={eng.framework} size="sm" />
        <div className="ml-auto flex items-center gap-1">
          <Tip content="Copy link">
            <Button variant="ghost" size="icon-sm" aria-label="Copy link" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/clients/${client.id}/${eng.framework}?control=${c.id}`); toast("Link copied"); }}>
              <Link2 />
            </Button>
          </Tip>
          {onClose ? (
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X /></Button>
          ) : (
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button>
            </SheetClose>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 pb-6 pt-5">
          <div className="flex items-center gap-2">
            <Code className="rounded-md border border-line bg-subtle px-1.5 py-0.5 text-[12px]">{c.code}</Code>
            <span className="text-[12px] text-faint">{c.unifiedId}</span>
          </div>
          <h2 className="mt-2 text-[20px] font-semibold leading-snug tracking-[-0.02em] text-ink">{c.title}</h2>
          <p className="mt-2 text-[13.5px] leading-6 text-ink-2">{c.summary}</p>

          <AnimatePresence>
            {c.status === "revise" && c.reviseReason && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 flex gap-2.5 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-3">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-bad" />
                  <div className="text-[13px] leading-5">
                    <p className="font-medium text-bad">Sent back for revision</p>
                    <p className="mt-0.5 text-ink-2">{c.reviseReason}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Properties */}
          <div className="mt-5 rounded-xl border border-line px-4 py-2">
            <Meta label="Status">
              <Menu>
                <MenuTrigger className="rounded-full outline-none transition-opacity hover:opacity-80">
                  <span className="flex items-center gap-1"><StatusBadge status={c.status} /><ChevronDown className="size-3.5 text-faint" /></span>
                </MenuTrigger>
                <MenuContent>
                  {STATUS_ORDER.map((s) => (
                    <MenuItem key={s} onSelect={() => change(s)}>
                      <StatusIcon status={s} />
                      {STATUS[s].label}
                      {s === c.status && <Check className="ml-auto !text-brand" />}
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            </Meta>
            <Meta label="Owner">
              <Menu>
                <MenuTrigger className="flex items-center gap-2 rounded-md px-1 py-0.5 text-[13px] text-ink outline-none hover:bg-subtle">
                  <Avatar person={owner} size="sm" />
                  {owner.name}
                  <ChevronDown className="size-3.5 text-faint" />
                </MenuTrigger>
                <MenuContent>
                  <MenuLabel>Assign to</MenuLabel>
                  {members.filter((m) => !["sales", "marketing"].includes(m.role)).map((m) => (
                    <MenuItem key={m.id} onSelect={() => { assign([c.id], m.id); toast(`Assigned to ${m.name}`); }}>
                      <Avatar person={m} size="xs" />
                      {m.name}
                      {m.id === c.ownerId && <Check className="ml-auto !text-brand" />}
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            </Meta>
            <Meta label="Reviewer">
              <span className="flex items-center gap-2 px-1 text-[13px] text-ink">
                <Avatar person={person(c.reviewerId)} size="sm" />
                {person(c.reviewerId).name}
              </span>
            </Meta>
            <Meta label="Due">
              <Menu>
                <MenuTrigger className="rounded-md px-1 py-0.5 outline-none hover:bg-subtle">
                  <DueChip due={c.due} status={c.status} className="text-[13px]" />
                </MenuTrigger>
                <MenuContent>
                  {[["Tomorrow", 1], ["In 3 days", 3], ["Next week", 7], ["In two weeks", 14]].map(([l, d]) => (
                    <MenuItem key={l} onSelect={() => { setDue(c.id, new Date(Date.now() + Number(d) * 864e5).toISOString()); toast(`Due date moved to ${dayLabel(new Date(Date.now() + Number(d) * 864e5).toISOString())}`); }}>
                      <CalendarDays />
                      {l}
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            </Meta>
            <Meta label="Domain">
              <span className="px-1 text-[13px] text-ink-2">{domainName(c.domain)}</span>
            </Meta>
          </div>

          {/* Mappings */}
          {mappings.length > 0 && (
            <section className="mt-6">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                Also satisfies
                <span className="text-[12px] font-normal text-muted">evidence here is reused, never uploaded twice</span>
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {mappings.map((m) =>
                  m.sibling ? (
                    <Link key={m.fw} href={`/clients/${client.id}/${m.fw}?control=${m.sibling.id}`} className="group inline-flex h-7 items-center gap-1.5 rounded-lg border border-brand/25 bg-brand-soft pl-2 pr-1.5 text-[12px] font-medium text-brand-ink transition-colors hover:border-brand/50">
                      <span className="size-1.5 rounded-full" style={{ background: `hsl(${FRAMEWORKS[m.fw].hue} 62% 52%)` }} />
                      {FRAMEWORKS[m.fw].short} <span className="font-mono">{m.code}</span>
                      <StatusIcon status={m.sibling.status} className="ml-0.5" />
                      <ArrowUpRight className="size-3 opacity-60 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                    </Link>
                  ) : (
                    <span key={m.fw} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-line px-2 text-[12px] text-muted">
                      <span className="size-1.5 rounded-full opacity-60" style={{ background: `hsl(${FRAMEWORKS[m.fw].hue} 62% 52%)` }} />
                      {FRAMEWORKS[m.fw].short} <span className="font-mono">{m.code}</span>
                    </span>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Approval chain */}
          <section className="mt-6 rounded-xl border border-line bg-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <ShieldCheck className="size-4 text-brand" />
                Approval chain
              </h3>
              <div className="flex gap-1.5">
                {(c.status === "not_started" || c.status === "in_progress" || c.status === "client" || c.status === "revise") && (
                  <Button size="xs" variant="primary" onClick={() => { setStatus(c.id, "review"); toast.success(`${c.code} sent for QA review`, { description: `${person(c.reviewerId).name} has been notified.` }); }}>
                    <Send /> Send for review
                  </Button>
                )}
                {c.status === "review" && (
                  <>
                    <Button size="xs" variant="secondary" onClick={() => setBackOpen(true)}>
                      <RotateCcw /> Send back
                    </Button>
                    {a.reviewed ? (
                      <Button size="xs" variant="primary" onClick={() => setApproveOpen(true)}>
                        <Check /> Approve
                      </Button>
                    ) : (
                      <Button size="xs" variant="primary" onClick={() => { qaPass(c.id); toast.success("QA review passed", { description: "Now waiting for admin approval." }); }}>
                        <Check /> Pass QA
                      </Button>
                    )}
                  </>
                )}
                {c.status === "approved" && (
                  <Button size="xs" variant="secondary" onClick={() => change("in_progress")}>
                    <RotateCcw /> Reopen
                  </Button>
                )}
              </div>
            </div>
            <ol className="mt-4 flex">
              <Step label="Prepared" done={stage >= 1} active={stage === 0 && c.status !== "not_started"} by={a.prepared?.by} at={a.prepared?.at} />
              <Step label="QA review" done={stage >= 2} active={stage === 1} by={a.reviewed?.by} at={a.reviewed?.at} />
              <Step label="Admin approval" done={stage >= 4} active={stage === 2} by={a.approved?.by} at={a.approved?.at} last />
            </ol>
          </section>

          {/* Evidence */}
          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Paperclip className="size-4 text-muted" />
              Evidence
              <span className="tnum font-normal text-muted">{evidence.length}</span>
            </h3>
            {evidence.length > 0 && <Precheck files={evidence} clientName={client.name} contact={client.contacts[0].name} onRequest={(text) => { requestEvidence(c.id, `${c.title}: replacement evidence`, text, 7); toast.success(`Request sent to ${client.contacts[0].name}`, { description: "Drafted from the pre-check findings." }); }} />}
            <ul className="mt-2.5 space-y-1.5">
              <AnimatePresence initial={false}>
                {evidence.map((e) => {
                  const up = person(e.uploadedBy);
                  return (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 transition-colors hover:border-line-strong"
                    >
                      <FileIcon kind={e.kind} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {e.name}
                          <span className="text-faint">.{e.kind}</span>
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-muted">
                          <span>{up.client ? `${up.name} (client)` : up.name}</span>·<span>{ago(e.uploadedAt)}</span>·<span className="tnum">{fileSize(e.sizeKb)}</span>
                          {e.version > 1 && <>·<span>v{e.version}</span></>}
                          {e.controlIds.length > 1 && (
                            <>·<span className="font-medium text-brand-ink">used in {e.controlIds.length} controls</span></>
                          )}
                        </p>
                      </div>
                      <AiChip e={e} />
                      <Badge tone={e.state === "accepted" ? "ok" : e.state === "rejected" ? "bad" : "warn"}>
                        {e.state === "accepted" ? "Accepted" : e.state === "rejected" ? "Rejected" : "Pending"}
                      </Badge>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            <div className="mt-2">
              <Dropzone
                compact
                onDone={(files) => {
                  upload(c.id, files);
                  toast.success(files.length === 1 ? `${files[0].name} uploaded` : `${files.length} files uploaded`, {
                    description: mappings.some((m) => m.sibling) ? `Also linked to ${mappings.filter((m) => m.sibling).map((m) => `${FRAMEWORKS[m.fw].short} ${m.code}`).join(", ")}.` : "Virus scan passed.",
                  });
                }}
              />
            </div>
          </section>

          {/* Discussion */}
          <section className="mt-7">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "comments", label: "Comments", count: c.comments.length },
                { value: "history", label: "History", count: c.history.length },
              ]}
            />
            {tab === "comments" ? (
              <div className="pt-4">
                <ul className="space-y-4">
                  {c.comments.length === 0 && <li className="text-[13px] text-muted">No comments yet. Notes marked internal are never shown to the client.</li>}
                  {c.comments.map((cm) => {
                    const p = person(cm.by);
                    return (
                      <motion.li key={cm.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                        <Avatar person={p} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 text-[12.5px]">
                            <span className="font-medium text-ink">{p.name}</span>
                            {p.client && <span className="text-muted">{client.name}</span>}
                            <span className="text-faint">{ago(cm.at)}</span>
                            {cm.internal && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-1.5 py-px text-[11px] text-muted"><Lock className="size-2.5" />Internal</span>
                            )}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-[1.55] text-ink-2">
                            {cm.body.split(/(@[A-Z][a-z]+ [A-Z][a-z]+)/g).map((part, i) =>
                              part.startsWith("@") ? <span key={i} className="rounded bg-brand-soft px-0.5 font-medium text-brand-ink">{part}</span> : part,
                            )}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
                <div className="mt-4">
                  <Composer
                    clientFacing
                    mentions={members}
                    onSend={(body, internal) => {
                      addComment(c.id, body, internal);
                      if (!internal) toast("Comment sent to the client", { description: `${client.contacts[0].name} will get an email.` });
                    }}
                  />
                </div>
              </div>
            ) : (
              <ol className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-line">
                {[...c.history].reverse().map((h, i) => {
                  const p = person(h.by);
                  return (
                    <li key={i} className="relative flex gap-3">
                      <Avatar person={p} size="sm" ring />
                      <div className="text-[13px] leading-5">
                        <span className="font-medium text-ink">{p.name}</span> <span className="text-ink-2">{h.text.charAt(0).toLowerCase() + h.text.slice(1)}</span>
                        <p className="text-[11.5px] text-faint">{dateTime(h.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>

      <ApproveDialog control={c} open={approveOpen} onOpenChange={setApproveOpen} />
      <SendBackDialog control={c} open={backOpen} onOpenChange={setBackOpen} />
    </div>
  );
}
