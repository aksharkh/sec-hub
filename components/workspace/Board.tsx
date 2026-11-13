"use client";

import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { motion } from "motion/react";
import { MessageSquare, Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Code, StatusIcon } from "@/components/ui/badge";
import { STATUS, STATUS_ORDER } from "@/lib/catalog";
import { usePerson, useStore } from "@/lib/store";
import type { Control, ControlStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DueChip } from "./ControlDetail";

function Card({ c, onOpen, overlay, dragging }: { c: Control; onOpen?: () => void; overlay?: boolean; dragging?: boolean }) {
  const person = usePerson();
  const owner = person(c.ownerId);
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group cursor-pointer rounded-xl border border-line bg-surface p-3 shadow-xs transition-[border-color,box-shadow,opacity] hover:border-line-strong hover:shadow-sm",
        overlay && "rotate-[1.5deg] cursor-grabbing border-line-strong shadow-pop",
        dragging && "opacity-35",
      )}
    >
      <div className="flex items-center gap-2">
        <Code className="text-[11.5px] text-muted">{c.code}</Code>
        {c.status === "review" && c.approvals.reviewed && <span className="rounded-full bg-rev-soft px-1.5 text-[10.5px] font-medium leading-[18px] text-rev">QA passed</span>}
        <span className="ml-auto">
          <Avatar person={owner} size="xs" />
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-[1.4] text-ink">{c.title}</p>
      {c.status === "revise" && c.reviseReason && <p className="mt-1.5 line-clamp-2 rounded-md bg-bad-soft px-2 py-1 text-[11.5px] leading-4 text-bad">{c.reviseReason}</p>}
      <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-faint">
        <DueChip due={c.due} status={c.status} className="text-[11.5px]" />
        {c.evidenceIds.length > 0 && (
          <span className="tnum flex items-center gap-0.5"><Paperclip className="size-3" />{c.evidenceIds.length}</span>
        )}
        {c.comments.length > 0 && (
          <span className="tnum flex items-center gap-0.5"><MessageSquare className="size-3" />{c.comments.length}</span>
        )}
      </div>
    </div>
  );
}

function Draggable({ c, onOpen }: { c: Control; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: c.id });
  return (
    <motion.div ref={setNodeRef} layout layoutId={c.id} transition={{ type: "spring", bounce: 0.1, duration: 0.35 }} {...attributes} {...listeners} className="touch-none outline-none">
      <Card c={c} onOpen={onOpen} dragging={isDragging} />
    </motion.div>
  );
}

function Column({ status, items, onOpen }: { status: ControlStatus; items: Control[]; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-[272px] shrink-0 snap-start flex-col">
      <div className="flex items-center gap-2 px-1 pb-2.5">
        <StatusIcon status={status} />
        <span className="text-[13px] font-medium text-ink">{STATUS[status].label}</span>
        <span className="tnum text-[12px] text-faint">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-2xl p-1.5 transition-colors duration-200",
          isOver ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_var(--brand)]" : "bg-subtle/70",
        )}
      >
        {items.map((c) => (
          <Draggable key={c.id} c={c} onOpen={() => onOpen(c.id)} />
        ))}
        {items.length === 0 && <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line-strong py-6 text-[12px] text-faint">Drop here</div>}
      </div>
    </div>
  );
}

export function Board({ controls, onOpen }: { controls: Control[]; onOpen: (id: string) => void }) {
  const setStatus = useStore((s) => s.setStatus);
  const [active, setActive] = useState<Control | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const onStart = (e: DragStartEvent) => setActive(controls.find((c) => c.id === e.active.id) ?? null);
  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    const to = e.over?.id as ControlStatus | undefined;
    const c = controls.find((x) => x.id === e.active.id);
    if (!to || !c || c.status === to) return;
    const prev = c.status;
    setStatus(c.id, to);
    toast(`${c.code} moved to ${STATUS[to].label}`, {
      description: to === "review" ? "The QA reviewer has been notified." : to === "client" ? "The client sees this as a request in their dashboard." : undefined,
      action: { label: "Undo", onClick: () => setStatus(c.id, prev) },
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        {STATUS_ORDER.map((s) => (
          <Column key={s} status={s} items={controls.filter((c) => c.status === s).sort((a, b) => a.due.localeCompare(b.due))} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.16,1,0.3,1)" }}>{active ? <Card c={active} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
