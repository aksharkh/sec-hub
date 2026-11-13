"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";
import { STATUS, STATUS_ORDER, TONE_CLASS } from "@/lib/catalog";
import type { Control, FileKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Tip } from "./overlay";

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-line bg-surface shadow-xs", className)} {...p} />;
}

export function CardHead({ title, action, sub, className }: { title: ReactNode; action?: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 pb-2 pt-3.5", className)}>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.022em] text-ink md:text-[24px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-[1.55] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function EmptyState({ title, body, action, className }: { title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="relative mb-5 grid size-[88px] place-items-center rounded-full">
        <div className="dot-grid absolute inset-0 rounded-full [mask-image:radial-gradient(circle,black_40%,transparent_72%)]" />
        <div className="relative grid size-12 place-items-center rounded-2xl border border-line bg-surface shadow-sm">
          <SecureKnotsLogo variant="knot" className="h-6 text-faint" />
        </div>
      </div>
      <p className="serif text-[24px] leading-tight text-ink">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressRing({ value, size = 36, stroke = 3.5, className, label = true }: { value: number; size?: number; stroke?: number; className?: string; label?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = value >= 100;
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--subtle-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? "var(--ok)" : "var(--brand)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.min(value, 100)) / 100 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {label && <span className="tnum absolute text-[10px] font-semibold text-ink">{value}</span>}
    </span>
  );
}

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "ok" }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-subtle-2", className)}>
      <motion.div
        className={cn("h-full rounded-full", tone === "ok" || value >= 100 ? "bg-ok" : "bg-brand")}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/** Stacked status distribution with 2px gaps; hover each segment for its count. */
export function StatusBar({ controls, className, height = 6 }: { controls: Control[]; className?: string; height?: number }) {
  const total = controls.length || 1;
  const parts = STATUS_ORDER.map((s) => ({ s, n: controls.filter((c) => c.status === s).length })).filter((p) => p.n > 0);
  return (
    <div className={cn("flex w-full gap-[2px]", className)} style={{ height }}>
      {parts.map((p) => (
        <Tip key={p.s} content={`${STATUS[p.s].label}: ${p.n}`}>
          <motion.span
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: p.n / total }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={cn("block min-w-[3px] basis-0 rounded-full", p.s === "not_started" ? "bg-subtle-2" : TONE_CLASS[STATUS[p.s].tone].dot)}
          />
        </Tip>
      ))}
    </div>
  );
}

const FILE_TONE: Record<FileKind, { label: string; cls: string }> = {
  pdf: { label: "PDF", cls: "text-[#c2410c] bg-[#fff1e8] dark:bg-[#c2410c]/15 dark:text-[#fb923c]" },
  docx: { label: "DOC", cls: "text-[#1d4ed8] bg-[#ebf1ff] dark:bg-[#1d4ed8]/20 dark:text-[#93b4ff]" },
  xlsx: { label: "XLS", cls: "text-[#15803d] bg-[#e9f8ee] dark:bg-[#15803d]/20 dark:text-[#6ee7a0]" },
  csv: { label: "CSV", cls: "text-[#0f766e] bg-[#e6f6f4] dark:bg-[#0f766e]/20 dark:text-[#5eead4]" },
  png: { label: "IMG", cls: "text-[#7c3aed] bg-[#f2edff] dark:bg-[#7c3aed]/20 dark:text-[#c4b5fd]" },
  zip: { label: "ZIP", cls: "text-[#57534e] bg-[#f1efed] dark:bg-white/10 dark:text-[#d6d3d1]" },
};

export function FileIcon({ kind, size = "md" }: { kind: FileKind; size?: "sm" | "md" | "lg" }) {
  const t = FILE_TONE[kind];
  const s = { sm: "h-7 w-[24px] text-[7.5px]", md: "h-9 w-[30px] text-[8.5px]", lg: "h-14 w-[46px] text-[11px]" }[size];
  return (
    <span className={cn("relative inline-flex shrink-0 items-end justify-center rounded-[5px] pb-1 font-bold tracking-wide", t.cls, s)}>
      <span className="absolute right-0 top-0 size-2 rounded-bl-[3px] bg-black/5 dark:bg-white/10" />
      {t.label}
    </span>
  );
}

/** Small trend line for stat tiles; single series, no legend. */
export function Sparkline({ data, className, tone = "brand" }: { data: number[]; className?: string; tone?: "brand" | "ok" | "bad" | "warn" }) {
  const w = 96;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const color = `var(--${tone})`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-24 overflow-visible", className)} aria-hidden>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={color} opacity={0.08} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  );
}

export function Stat({ label, value, delta, deltaGood = true, spark, tone = "brand", hint }: { label: string; value: ReactNode; delta?: string; deltaGood?: boolean; spark?: number[]; tone?: "brand" | "ok" | "bad" | "warn"; hint?: string }) {
  return (
    <Card className="flex flex-col justify-between p-4">
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="tnum text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink">{value}</p>
          {(delta || hint) && (
            <p className="mt-2 text-[12px] text-muted">
              {delta && <span className={cn("tnum mr-1 font-medium", deltaGood ? "text-ok" : "text-bad")}>{delta}</span>}
              {hint}
            </p>
          )}
        </div>
        {spark && <Sparkline data={spark} tone={tone} className="hidden sm:block" />}
      </div>
    </Card>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-[3px] rounded-full bg-faint", className)} />;
}
