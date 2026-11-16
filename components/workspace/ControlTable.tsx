"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronsUpDown, MessageSquare, Paperclip, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Code, StatusBadge, StatusIcon } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/overlay";
import { STATUS, STATUS_ORDER, domainName } from "@/lib/catalog";
import { usePerson, useStore } from "@/lib/store";
import type { Control } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DueChip } from "./ControlDetail";

type SortKey = "code" | "status" | "due" | "owner";
type Sort = { key: SortKey; dir: 1 | -1 };

function Head({ k, sort, onSort, children, className }: { k: SortKey; sort: Sort; onSort: (s: Sort) => void; children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("h-9 px-2 text-left font-medium", className)}>
      <button onClick={() => onSort({ key: k, dir: sort.key === k ? (-sort.dir as 1 | -1) : 1 })} className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-subtle-2/70 hover:text-ink">
        {children}
        {sort.key === k ? (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 opacity-50" />}
      </button>
    </th>
  );
}

export function ControlTable({ controls, onOpen }: { controls: Control[]; onOpen: (id: string) => void }) {
  const person = usePerson();
  const members = useStore((s) => s.members);
  const assign = useStore((s) => s.assign);
  const bulkStatus = useStore((s) => s.bulkStatus);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>({ key: "status", dir: 1 });

  const rows = useMemo(() => {
    const val = (c: Control) =>
      sort.key === "code" ? c.order : sort.key === "status" ? STATUS_ORDER.indexOf(c.status) : sort.key === "due" ? c.due : person(c.ownerId).name;
    return [...controls].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, sort]);

  const allSel = sel.size > 0 && sel.size === rows.length;
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="relative">
      <div className="-mx-4 overflow-x-auto md:mx-0 md:rounded-xl md:border md:border-line">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-raised text-[12px] text-muted shadow-[inset_0_-1px_0_var(--line)]">
            <tr>
              <th className="w-10 pl-4 pr-1">
                <Checkbox checked={allSel ? true : sel.size ? "indeterminate" : false} onCheckedChange={() => setSel(allSel ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Select all" />
              </th>
              <Head k="code" sort={sort} onSort={setSort} className="w-[110px]">Control</Head>
              <th className="h-9 px-2 text-left font-medium">Title</th>
              <Head k="status" sort={sort} onSort={setSort} className="w-[170px]">Status</Head>
              <Head k="owner" sort={sort} onSort={setSort} className="w-[160px]">Owner</Head>
              <Head k="due" sort={sort} onSort={setSort} className="w-[120px]">Due</Head>
              <th className="w-[84px] px-2 pr-4 text-right font-medium">Activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const o = person(c.ownerId);
              const on = sel.has(c.id);
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className={cn("group h-11 cursor-pointer border-b border-line transition-colors last:border-0", on ? "bg-brand-soft/60" : "hover:bg-raised")}
                >
                  <td className="pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={on} onCheckedChange={() => toggle(c.id)} aria-label={`Select ${c.code}`} />
                  </td>
                  <td className="px-2"><Code>{c.code}</Code></td>
                  <td className="max-w-0 px-2">
                    <p className="truncate font-medium text-ink">{c.title}</p>
                    <p className="truncate text-[12px] text-muted">{domainName(c.domain)}</p>
                  </td>
                  <td className="px-2"><StatusBadge status={c.status} /></td>
                  <td className="px-2">
                    <span className="flex items-center gap-2 text-ink-2"><Avatar person={o} size="sm" />{o.name}</span>
                  </td>
                  <td className="px-2"><DueChip due={c.due} status={c.status} /></td>
                  <td className="px-2 pr-4">
                    <span className="flex items-center justify-end gap-2.5 text-[12px] text-faint">
                      <span className="tnum flex items-center gap-0.5"><Paperclip className="size-3" />{c.evidenceIds.length}</span>
                      <span className="tnum flex items-center gap-0.5"><MessageSquare className="size-3" />{c.comments.length}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {sel.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            data-bulkbar className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-line-strong bg-surface p-1.5 pl-3.5 shadow-pop"
          >
            <span className="tnum mr-2 text-[13px] font-medium text-ink">{sel.size} selected</span>
            <Menu>
              <MenuTrigger asChild>
                <Button size="sm" variant="ghost"><UserRound /> Assign</Button>
              </MenuTrigger>
              <MenuContent side="top">
                <MenuLabel>Assign {sel.size} controls to</MenuLabel>
                {members.filter((m) => !["sales", "marketing"].includes(m.role)).map((m) => (
                  <MenuItem key={m.id} onSelect={() => { assign([...sel], m.id); toast.success(`${sel.size} controls assigned to ${m.name}`); setSel(new Set()); }}>
                    <Avatar person={m} size="xs" />{m.name}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            <Menu>
              <MenuTrigger asChild>
                <Button size="sm" variant="ghost"><StatusIcon status="in_progress" /> Status</Button>
              </MenuTrigger>
              <MenuContent side="top">
                <MenuLabel>Move {sel.size} controls to</MenuLabel>
                {STATUS_ORDER.map((s) => (
                  <MenuItem key={s} onSelect={() => { bulkStatus([...sel], s); toast.success(`${sel.size} controls moved to ${STATUS[s].label}`); setSel(new Set()); }}>
                    <StatusIcon status={s} />{STATUS[s].label}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            <div className="mx-1 h-5 w-px bg-line" />
            <Button size="icon-sm" variant="ghost" onClick={() => setSel(new Set())} aria-label="Clear selection"><X /></Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
