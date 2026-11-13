import { STAGES } from "@/lib/catalog";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StagePill({ stage }: { stage: Stage }) {
  const i = STAGES.findIndex((s) => s.id === stage);
  return (
    <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-line bg-surface px-2 text-[12px] font-medium text-ink-2">
      <span className="flex gap-[2px]">
        {STAGES.map((s, j) => (
          <span key={s.id} className={cn("h-2 w-[3px] rounded-[1px]", j <= i ? (stage === "certified" ? "bg-ok-dot" : "bg-brand") : "bg-subtle-2")} />
        ))}
      </span>
      {STAGES[i].label}
    </span>
  );
}
