"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { motion } from "motion/react";
import { STATUS, STATUS_ORDER, TONE_CLASS } from "@/lib/catalog";
import type { Control, FileKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Tip } from "./overlay";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/shell/nav";
import { useDesign } from "@/lib/useDesign";

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-xl border border-line bg-surface shadow-xs", className)} {...p} />;
}

export function CardHead({ title, action, sub, className }: { title: ReactNode; action?: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div data-slot="card-head" className={cn("flex items-center gap-3 px-4 pb-2 pt-3.5", className)}>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Section name for the current route, used by the page header variants. */
function useSection() {
  const pathname = usePathname();
  const hit = NAV.filter((n) => (n.href === "/" ? pathname === "/" : pathname === n.href || pathname.startsWith(n.href + "/"))).sort((a, b) => b.href.length - a.href.length)[0];
  return { label: hit?.label ?? "Workspace", path: pathname };
}

type HeaderProps = { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string };

/** Every design lays its page header out differently; the content is the same. */
export function PageHeader({ title, description, actions, eyebrow, className }: HeaderProps) {
  const design = useDesign().id;
  const section = useSection();
  const act = actions && <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>;

  if (design === "meridian")
    return (
      <div className={cn("border-b border-ink pb-6", className)}>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
          <span className="text-brand">{section.label}</span>
          <span className="h-px flex-1 bg-line-strong" />
          <span className="hidden text-muted sm:inline">SecureKnots Workspace</span>
        </div>
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            {eyebrow && <div className="mb-2">{eyebrow}</div>}
            <h1 data-ph className="serif text-[42px] leading-[0.98] tracking-[-0.015em] text-ink md:text-[54px]">{title}</h1>
            {description && <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-ink-2">{description}</p>}
          </div>
          {act}
        </div>
      </div>
    );

  if (design === "boardroom")
    return (
      <div className={cn("relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface py-5 pl-7 pr-5 shadow-xs", className)}>
        <span className="absolute inset-y-0 left-0 w-1.5 bg-brand" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand">{section.label}</p>
            {eyebrow && <div className="mt-2">{eyebrow}</div>}
            <h1 data-ph className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.02em] text-ink">{title}</h1>
            {description && <p className="mt-1.5 max-w-3xl text-[15px] leading-[1.6] text-ink-2">{description}</p>}
          </div>
          {act}
        </div>
      </div>
    );

  if (design === "aurora")
    return (
      <div className={cn("relative", className)}>
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-56 w-[460px] max-w-full rounded-full bg-[radial-gradient(closest-side,rgb(236_72_153/0.22),transparent)] blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] font-medium text-brand-ink shadow-xs">
            <span className="size-1.5 rounded-full bg-[linear-gradient(135deg,#7c3aed,#ec4899)]" />
            {section.label}
          </span>
          {eyebrow && <div className="mt-3">{eyebrow}</div>}
          <h1 data-ph className="mt-3 bg-[linear-gradient(100deg,#1d1033_10%,#7c3aed_55%,#db2777)] bg-clip-text pb-1 text-[38px] font-semibold leading-[1.02] tracking-[-0.045em] text-transparent md:text-[48px]" style={{ fontFamily: "var(--font-space)" }}>
            {title}
          </h1>
          {description && <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-ink-2">{description}</p>}
          {actions && <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    );

  if (design === "brutal")
    return (
      <div className={cn("flex flex-col gap-4 border-b-[3px] border-ink pb-6 md:flex-row md:items-end md:justify-between", className)}>
        <div className="min-w-0">
          <span className="inline-block -rotate-2 border-2 border-ink bg-[#ff9ad5] px-2 py-0.5 text-[11px] font-bold uppercase text-ink shadow-[2px_2px_0_var(--ink)]">{section.label}</span>
          {eyebrow && <div className="mt-3">{eyebrow}</div>}
          <h1 data-ph className="mt-3 text-[40px] font-bold uppercase leading-[0.95] tracking-[-0.055em] text-ink md:text-[58px]">
            <span className="box-decoration-clone bg-[linear-gradient(transparent_55%,#c6f432_55%,#c6f432_92%,transparent_92%)]">{title}</span>
          </h1>
          {description && <p className="mt-4 max-w-2xl border-l-[3px] border-ink pl-3 text-[14px] font-medium leading-[1.55] text-ink-2">{description}</p>}
        </div>
        {act}
      </div>
    );

  if (design === "spatial")
    return (
      <div className={cn("flex flex-col items-center pb-2 pt-6 text-center", className)}>
        <p className="text-[11.5px] font-medium uppercase tracking-[0.32em] text-muted">{section.label}</p>
        {eyebrow && <div className="mt-3">{eyebrow}</div>}
        <h1 data-ph className="mt-3 text-[40px] font-light leading-none tracking-[-0.045em] text-ink md:text-[54px]">{title}</h1>
        {description && <p className="mt-4 max-w-xl text-[14.5px] leading-[1.6] text-muted">{description}</p>}
        {actions && (
          <div className="mt-6 flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-[26px] border border-white/10 bg-white/[0.05] p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl">{actions}</div>
        )}
      </div>
    );

  if (design === "nocturne")
    return (
      <div className={cn("font-[family-name:var(--font-jet)]", className)}>
        <p className="truncate text-[12px] text-faint">
          <span className="text-brand">❯</span> cd ~{section.path === "/" ? "" : section.path} <span className="opacity-60">&amp;&amp; cat README.md</span>
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            {eyebrow && <div className="mb-2">{eyebrow}</div>}
            <h1 data-ph className="text-[26px] font-semibold tracking-[-0.03em] text-ink">
              <span className="text-brand"># </span>
              {title}
              <span className="ml-1.5 inline-block h-[0.85em] w-[0.5em] translate-y-[2px] animate-pulse bg-brand/80" />
            </h1>
            {description && <p className="mt-2 max-w-3xl text-[12.5px] leading-[1.7] text-muted"><span className="text-faint">{"// "}</span>{description}</p>}
          </div>
          {act}
        </div>
        <div aria-hidden className="mt-5 overflow-hidden whitespace-nowrap text-[11px] leading-none text-faint opacity-40">{"─".repeat(260)}</div>
      </div>
    );

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 data-ph className="text-[22px] font-semibold leading-tight tracking-[-0.022em] text-ink md:text-[24px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-[1.55] text-muted">{description}</p>}
      </div>
      {act}
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
    <div data-slot="progress" className={cn("h-1.5 w-full overflow-hidden rounded-full bg-subtle-2", className)}>
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
export function Sparkline({ data, className, tone = "brand", stretch = false }: { data: number[]; className?: string; tone?: "brand" | "ok" | "bad" | "warn"; stretch?: boolean }) {
  const gid = useId().replace(/:/g, "");
  const w = stretch ? 320 : 96;
  const h = stretch ? 36 : 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const color = `var(--${tone})`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={stretch ? "none" : undefined} className={cn("h-7 w-24 overflow-visible", className)} aria-hidden>
      {stretch && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.22} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={stretch ? `url(#${gid})` : color} opacity={stretch ? 1 : 0.08} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
      {!stretch && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} stroke="var(--surface)" strokeWidth={1.5} />}
    </svg>
  );
}

const BLOCKS = "▁▂▃▄▅▆▇█";
const ascii = (d: number[]) => {
  const max = Math.max(...d);
  const min = Math.min(...d);
  return d.map((v) => BLOCKS[Math.round(((v - min) / (max - min || 1)) * 7)]).join("");
};
const BRUTAL_TONE = { brand: "#c6f432", ok: "#8ef0b4", warn: "#ffd23f", bad: "#ff9ab8" } as const;
const GRAD_TONE = { brand: "from-[#7c3aed] to-[#db2777]", ok: "from-[#059669] to-[#0ea5e9]", warn: "from-[#ea580c] to-[#db2777]", bad: "from-[#e11d48] to-[#9333ea]" } as const;
const STRIPE = { brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" } as const;

type StatProps = { label: string; value: ReactNode; delta?: string; deltaGood?: boolean; spark?: number[]; tone?: "brand" | "ok" | "bad" | "warn"; hint?: string };

/** One number with context. Each design draws it its own way. */
export function Stat({ label, value, delta, deltaGood = true, spark, tone = "brand", hint }: StatProps) {
  const design = useDesign().id;
  const foot = (delta || hint) && (
    <>
      {delta && <span className={cn("tnum mr-1 font-medium", deltaGood ? "text-ok" : "text-bad")}>{delta}</span>}
      {hint}
    </>
  );

  if (design === "meridian")
    return (
      <div data-stat className="border-t-2 border-ink pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="serif tnum mt-2 text-[50px] leading-[0.95] text-ink">{value}</p>
        {foot && <p className="mt-2 text-[12.5px] text-muted">{foot}</p>}
      </div>
    );

  if (design === "boardroom")
    return (
      <Card className="relative overflow-hidden py-4 pl-6 pr-4">
        <span className={cn("absolute inset-y-0 left-0 w-1.5", STRIPE[tone])} />
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-2">{label}</p>
        <p className="tnum mt-2 text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</p>
        {foot && <p className="mt-2 text-[13.5px] text-muted">{foot}</p>}
      </Card>
    );

  if (design === "brutal")
    return (
      <div data-stat className="flex flex-col justify-between rounded-[6px] border-2 border-[#111] p-4 text-[#111] shadow-[4px_4px_0_#111] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5" style={{ background: BRUTAL_TONE[tone] }}>
        <p className="text-[11.5px] font-bold uppercase tracking-[0.02em]">{label}</p>
        <p className="tnum mt-3 text-[46px] font-bold leading-none tracking-[-0.05em]">{value}</p>
        {foot && <p className="mt-2 text-[12px] font-semibold [&_span]:!text-[#111]">{foot}</p>}
      </div>
    );

  if (design === "aurora")
    return (
      <Card className="relative flex flex-col justify-between overflow-hidden p-5">
        <p className="text-[12.5px] font-medium text-muted">{label}</p>
        <p className={cn("tnum mt-3 bg-gradient-to-r bg-clip-text text-[40px] font-semibold leading-none tracking-[-0.05em] text-transparent", GRAD_TONE[tone])} style={{ fontFamily: "var(--font-space)" }}>{value}</p>
        {foot && <p className="mt-2 text-[12px] text-muted">{foot}</p>}
        {spark && <Sparkline data={spark} tone={tone} stretch className="mt-3 h-8 w-full" />}
      </Card>
    );

  if (design === "spatial")
    return (
      <Card className="flex flex-col justify-between p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">{label}</p>
        <p className="tnum mt-4 text-[42px] font-extralight leading-none tracking-[-0.04em] text-ink">{value}</p>
        {foot && <p className="mt-2 text-[12px] text-muted">{foot}</p>}
        {spark && <Sparkline data={spark} tone={tone} stretch className="mt-4 h-9 w-full" />}
      </Card>
    );

  if (design === "nocturne")
    return (
      <Card className="flex flex-col justify-between p-4 font-[family-name:var(--font-jet)]">
        <p className="text-[11.5px] text-faint">$ {label.toLowerCase()}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="tnum text-[34px] font-semibold leading-none text-brand [text-shadow:0_0_18px_rgb(52_245_164/0.45)]">{value}</p>
          {spark && <span className="hidden text-[15px] leading-none tracking-[1px] text-brand opacity-70 sm:block">{ascii(spark)}</span>}
        </div>
        {foot && <p className="mt-2 text-[11.5px] text-muted"><span className="text-faint">{"// "}</span>{foot}</p>}
      </Card>
    );

  return (
    <Card className="flex flex-col justify-between p-4">
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="tnum text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink">{value}</p>
          {foot && <p className="mt-2 text-[12px] text-muted">{foot}</p>}
        </div>
        {spark && <Sparkline data={spark} tone={tone} className="hidden sm:block" />}
      </div>
    </Card>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-[3px] rounded-full bg-faint", className)} />;
}
