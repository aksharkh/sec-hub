"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Code, Kbd } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/form";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/overlay";
import { ControlDetail } from "@/components/workspace/ControlDetail";
import { ApproveDialog, SendBackDialog } from "@/components/workspace/ReviewDialogs";
import { FRAMEWORKS } from "@/lib/catalog";
import { useQuery, useReady } from "@/lib/hooks";
import { usePerson, useStore } from "@/lib/store";
import type { Control } from "@/lib/types";
import { ago, cn } from "@/lib/utils";

type Tab = "approval" | "qa" | "revise";

function Inbox() {
  const ready = useReady();
  const all = useStore((s) => s.controls);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const person = usePerson();
  const search = useQuery();
  const [tabState, setTab] = useState<Tab | null>(null);
  const [selState, setSel] = useState<string | null>(search.get("c"));
  const [approve, setApprove] = useState(false);
  const [back, setBack] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const lists = useMemo(() => {
    const l = Object.values(all);
    const by = (k: (c: Control) => string) => (a: Control, b: Control) => k(a).localeCompare(k(b));
    return {
      approval: l.filter((c) => c.status === "review" && c.approvals.reviewed).sort(by((c) => c.approvals.reviewed!.at)),
      qa: l.filter((c) => c.status === "review" && !c.approvals.reviewed).sort(by((c) => c.approvals.prepared?.at ?? c.due)),
      revise: l.filter((c) => c.status === "revise").sort(by((c) => c.due)),
    };
  }, [all]);
  // A control linked from elsewhere (?c=) opens on its own tab; otherwise "Needs approval".
  const linked = search.get("c");
  const linkedTab: Tab | null = linked && all[linked] ? (all[linked].status === "revise" ? "revise" : all[linked].approvals.reviewed ? "approval" : "qa") : null;
  const tab: Tab = tabState ?? linkedTab ?? "approval";
  const items = lists[tab];
  // Keep a valid selection when the list changes (e.g. right after approving).
  const sel = selState && items.some((c) => c.id === selState) ? selState : (items[0]?.id ?? null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || e.ctrlKey || e.metaKey || approve || back) return;
      const i = items.findIndex((c) => c.id === sel);
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setSel(items[Math.min(items.length - 1, i + 1)]?.id ?? sel); }
      if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); setSel(items[Math.max(0, i - 1)]?.id ?? sel); }
      if (e.key === "a" && sel && tab === "approval") setApprove(true);
      if (e.key === "r" && sel && tab !== "revise") setBack(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, sel, tab, approve, back]);

  const current = sel ? all[sel] : null;

  return (
    <div className="flex h-[calc(100dvh-52px)] flex-col lg:h-[calc(100dvh-16px-52px-2px)]">
      <div className="border-b border-line px-4 pt-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.022em] text-ink">Reviews</h1>
            <p className="mt-1 text-[13px] text-muted">Prepared controls move through QA review, then admin approval, then on to the next owner.</p>
          </div>
          <p className="hidden items-center gap-1.5 text-[12px] text-faint md:flex">
            <Kbd>J</Kbd><Kbd>K</Kbd> move <span className="mx-1">·</span><Kbd>A</Kbd> approve <span className="mx-1">·</span><Kbd>R</Kbd> send back
          </p>
        </div>
        <Tabs
          className="mt-4 border-b-0"
          value={tab}
          onChange={(t) => { setTab(t); setSel(lists[t][0]?.id ?? null); }}
          tabs={[
            { value: "approval", label: "Needs approval", count: lists.approval.length },
            { value: "qa", label: "Needs QA", count: lists.qa.length },
            { value: "revise", label: "Sent back", count: lists.revise.length },
          ]}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto border-line lg:border-r">
          {!ready ? (
            <div className="space-y-2 p-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}</div>
          ) : items.length === 0 ? (
            <EmptyState title="Inbox zero" body="Nothing in this queue. New items appear here as soon as they are sent." />
          ) : (
            <ul className="p-2">
              <AnimatePresence initial={false}>
                {items.map((c) => {
                  const client = clients.find((x) => x.id === c.clientId)!;
                  const e = engagements.find((x) => x.id === c.engagementId)!;
                  const on = c.id === sel;
                  const who = tab === "approval" ? c.approvals.reviewed! : tab === "qa" ? c.approvals.prepared : null;
                  return (
                    <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}>
                      <button
                        onClick={() => { setSel(c.id); setMobileOpen(true); }}
                        className={cn("relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors", on ? "bg-brand-soft/70" : "hover:bg-raised")}
                      >
                        {on && <motion.span layoutId="rv-sel" className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-brand" />}
                        <ClientMark name={client.name} hue={client.hue} size="sm" className="mt-0.5" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <Code className="text-[11.5px] text-muted">{c.code}</Code>
                            <span className="truncate text-[12px] text-faint">{client.name} · {FRAMEWORKS[e.framework].short}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[13.5px] font-medium text-ink">{c.title}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                            {tab === "revise" ? (
                              <span className="truncate text-bad">{c.reviseReason}</span>
                            ) : who ? (
                              <>
                                <Avatar person={person(who.by)} size="xs" className="!size-4 !text-[7px]" />
                                {tab === "approval" ? "QA passed by" : "Prepared by"} {person(who.by).name.split(" ")[0]} · {ago(who.at)}
                              </>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <div className="hidden min-h-0 flex-col lg:flex">
          {current ? (
            <>
              <div className="min-h-0 flex-1">
                <ControlDetail key={current.id} id={current.id} onClose={() => setSel(null)} />
              </div>
              {tab !== "revise" && (
                <div className="flex items-center justify-end gap-2 border-t border-line bg-raised px-5 py-3">
                  <Button variant="secondary" onClick={() => setBack(true)}><RotateCcw /> Send back <Kbd className="ml-1">R</Kbd></Button>
                  {tab === "approval" && <Button variant="primary" onClick={() => setApprove(true)}><Check /> Approve <Kbd className="ml-1 border-white/20 bg-white/10 text-white/80 shadow-none">A</Kbd></Button>}
                </div>
              )}
            </>
          ) : (
            ready && <EmptyState title="Pick something to review" body="Select a control on the left. Use J and K to move through the queue." className="flex-1" />
          )}
        </div>
      </div>

      <div className="lg:hidden">
        <Sheet open={mobileOpen && !!current} onOpenChange={setMobileOpen} title="Review">
          {current && <ControlDetail id={current.id} />}
        </Sheet>
      </div>
      <ApproveDialog control={current} open={approve} onOpenChange={setApprove} />
      <SendBackDialog control={current} open={back} onOpenChange={setBack} />
    </div>
  );
}

export default function ReviewsPage() {
  return <Inbox />;
}
