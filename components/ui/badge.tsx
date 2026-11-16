import type { ReactNode } from "react";
import { FRAMEWORKS, GAP_STATUS, SEVERITY, STATUS, TONE_CLASS, type Tone } from "@/lib/catalog";
import type { ControlStatus, FrameworkKey, GapStatus, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Badge({ tone = "neutral", dot = true, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  const t = TONE_CLASS[tone];
  return (
    <span data-slot="badge" className={cn("inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[12px] font-medium", t.soft, t.fg, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

const STATUS_GLYPH: Record<ControlStatus, (cls: string) => ReactNode> = {
  not_started: (c) => <circle cx="7" cy="7" r="5.25" className={c} fill="none" strokeWidth="1.5" strokeDasharray="2.2 2.2" />,
  in_progress: (c) => (
    <>
      <circle cx="7" cy="7" r="5.25" className={c} fill="none" strokeWidth="1.5" />
      <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" className={c} fill="currentColor" stroke="none" />
    </>
  ),
  client: (c) => (
    <>
      <circle cx="7" cy="7" r="5.25" className={c} fill="none" strokeWidth="1.5" />
      <path d="M7 4.6v2.6l1.6 1" className={c} fill="none" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  review: (c) => (
    <>
      <circle cx="7" cy="7" r="5.25" className={c} fill="none" strokeWidth="1.5" />
      <path d="M7 3.5a3.5 3.5 0 1 1-3.03 1.75L7 7z" className={c} fill="currentColor" stroke="none" />
    </>
  ),
  revise: (c) => (
    <>
      <circle cx="7" cy="7" r="5.25" className={c} fill="currentColor" stroke="none" />
      <path d="M7 4.3v3.2M7 9.4v.1" style={{ stroke: "var(--inverse)" }} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  approved: (c) => (
    <>
      <circle cx="7" cy="7" r="5.75" className={c} fill="currentColor" stroke="none" />
      <path d="m4.6 7.1 1.6 1.6 3.2-3.3" style={{ stroke: "var(--inverse)" }} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

/** Linear-style status glyph: shape changes with progress, so it reads without color. */
export function StatusIcon({ status, className }: { status: ControlStatus; className?: string }) {
  const t = TONE_CLASS[STATUS[status].tone];
  return (
    <svg viewBox="0 0 14 14" className={cn("size-3.5 shrink-0", t.fg, className)} stroke="currentColor" aria-hidden>
      {STATUS_GLYPH[status]("")}
    </svg>
  );
}

export function StatusBadge({ status, className }: { status: ControlStatus; className?: string }) {
  const s = STATUS[status];
  const t = TONE_CLASS[s.tone];
  return (
    <span data-slot="badge" className={cn("inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-1.5 pr-2 text-[12px] font-medium", t.soft, t.fg, className)}>
      <StatusIcon status={status} />
      {s.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY[severity];
  const t = TONE_CLASS[s.tone];
  const bars = 4 - s.rank;
  return (
    <span data-slot="badge" className={cn("inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[12px] font-medium", t.soft, t.fg)}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px]", i < bars ? t.dot : "bg-current opacity-20")} style={{ height: 4 + i * 2 }} />
        ))}
      </span>
      {s.label}
    </span>
  );
}

export function GapStatusBadge({ status }: { status: GapStatus }) {
  const s = GAP_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Framework identity chip: neutral surface + a colored dot. */
export function FrameworkChip({ fw, className, size = "md" }: { fw: FrameworkKey; className?: string; size?: "sm" | "md" }) {
  const f = FRAMEWORKS[fw];
  return (
    <span data-slot="chip"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface font-medium text-ink-2",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-[22px] px-2 text-[12px]",
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: `hsl(${f.hue} 62% 52%)` }} />
      {f.short}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] border border-line-strong bg-surface px-1 font-sans text-[10.5px] font-medium text-muted shadow-[0_1px_0_var(--line-strong)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] tracking-tight text-ink-2", className)}>{children}</span>;
}
