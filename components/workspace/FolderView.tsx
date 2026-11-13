"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Folder, FolderOpen, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Code, StatusIcon } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, FileIcon } from "@/components/ui/misc";
import { DOMAINS, FRAMEWORKS } from "@/lib/catalog";
import { usePerson, useStore } from "@/lib/store";
import type { Client, Control, Engagement } from "@/lib/types";
import { ago, cn, fileSize } from "@/lib/utils";
import { Dropzone } from "./Dropzone";

/** The OneDrive structure the team uses today (Client › Service › Control › Evidence), backed by the same data. */
export function FolderView({ client, engagement, controls, onOpen }: { client: Client; engagement: Engagement; controls: Control[]; onOpen: (id: string) => void }) {
  const evidence = useStore((s) => s.evidence);
  const upload = useStore((s) => s.upload);
  const person = usePerson();
  const domains = useMemo(() => DOMAINS.map((d) => ({ ...d, items: controls.filter((c) => c.domain === d.id).sort((a, b) => a.order - b.order) })).filter((d) => d.items.length), [controls]);
  const [openDomains, setOpenDomains] = useState<Set<string>>(() => new Set(domains.slice(0, 2).map((d) => d.id)));
  const [sel, setSel] = useState<string | null>(domains[0]?.items[0]?.id ?? null);
  const current = controls.find((c) => c.id === sel);
  const files = current ? current.evidenceIds.map((id) => evidence[id]).filter(Boolean) : [];

  return (
    <div className="grid overflow-hidden rounded-xl border border-line md:grid-cols-[300px_1fr]">
      <div className="max-h-[620px] overflow-y-auto border-b border-line bg-raised p-2 md:border-b-0 md:border-r">
        <p className="flex items-center gap-1.5 px-2 pb-2 pt-1 text-[12px] text-muted">
          {client.name} <ChevronRight className="size-3" /> {FRAMEWORKS[engagement.framework].short}
        </p>
        <ul>
          {domains.map((d) => {
            const open = openDomains.has(d.id);
            return (
              <li key={d.id}>
                <button
                  onClick={() => setOpenDomains((s) => { const n = new Set(s); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; })}
                  className="flex h-8 w-full items-center gap-1.5 rounded-lg px-1.5 text-[13px] font-medium text-ink-2 hover:bg-subtle"
                >
                  <ChevronRight className={cn("size-3.5 text-faint transition-transform duration-200", open && "rotate-90")} />
                  {open ? <FolderOpen className="size-4 text-brand" /> : <Folder className="size-4 text-muted" />}
                  <span className="flex-1 truncate text-left">{d.name}</span>
                  <span className="tnum text-[11.5px] font-normal text-faint">{d.items.length}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden pl-5">
                      {d.items.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => setSel(c.id)}
                            className={cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[12.5px] transition-colors", sel === c.id ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(15_23_41/0.05)]" : "text-ink-2 hover:bg-subtle")}
                          >
                            <StatusIcon status={c.status} />
                            <Code className="text-[11.5px]">{c.code}</Code>
                            <span className="flex-1 truncate text-left">{c.title}</span>
                            <span className="tnum text-[11px] text-faint">{c.evidenceIds.length}</span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-w-0 p-4 md:p-5">
        {current ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[12px] text-muted">
                  {DOMAINS.find((d) => d.id === current.domain)?.name} <ChevronRight className="size-3" /> <Code className="text-[12px]">{current.code}</Code>
                </p>
                <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-ink">{current.title}</h3>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onOpen(current.id)}>
                Open control <ArrowUpRight />
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
              {files.map((f) => (
                <motion.div key={f.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="group rounded-xl border border-line bg-surface p-3 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-sm">
                  <div className="grid h-20 place-items-center rounded-lg bg-subtle">
                    <FileIcon kind={f.kind} size="lg" />
                  </div>
                  <p className="mt-2.5 truncate text-[12.5px] font-medium text-ink" title={f.name}>{f.name}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">{person(f.uploadedBy).name.split(" ")[0]} · {ago(f.uploadedAt)} · <span className="tnum">{fileSize(f.sizeKb)}</span></p>
                </motion.div>
              ))}
            </div>
            {files.length === 0 && <EmptyState className="py-8" title="Empty folder" body="Nothing has been uploaded for this control yet. Files dropped here are linked to every mapped framework." />}
            <div className="mt-3">
              <Dropzone onDone={(f) => { upload(current.id, f); toast.success(`${f.length} file${f.length > 1 ? "s" : ""} added to ${current.code}`); }} compact />
            </div>
          </>
        ) : (
          <EmptyState title="Pick a folder" body="Choose a control on the left to see its evidence." />
        )}
      </div>
    </div>
  );
}
