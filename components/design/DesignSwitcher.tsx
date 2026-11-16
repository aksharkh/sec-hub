"use client";

import { HoverCard } from "radix-ui";
import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { DESIGNS, type DesignId } from "@/lib/designs";
import { applyDesign, useDesign } from "@/lib/useDesign";
import { cn } from "@/lib/utils";

/** A tiny rendering of each design's own frame (navigation, header, home). Tokens are scoped to this element. */
function Preview({ id, dark }: { id: DesignId; dark: boolean }) {
  const line = (w: string, cls = "bg-ink/15") => <div className={cn("h-1 rounded-full", cls)} style={{ width: w }} />;
  return (
    <div
      data-design={id}
      className={cn("font-sans relative h-[104px] overflow-hidden rounded-[10px] bg-canvas", dark && "dark")}
      style={{ backgroundImage: "var(--app-bg)" } as CSSProperties}
    >
      {id === "meridian" && (
        <>
          <div className="flex h-4 items-center gap-1.5 border-b border-line bg-surface px-2">
            <span className="size-2 rounded-full bg-ink" />
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-[3px] w-4 rounded-full", i === 0 ? "bg-brand" : "bg-ink/20")} />)}
          </div>
          <p className="serif mt-1.5 text-center text-[15px] leading-none text-ink">The Brief</p>
          <div className="mx-2 mt-1 border-t-[3px] border-double border-ink" />
          <div className="mx-2 mt-1.5 grid grid-cols-[1.6fr_1fr] gap-2">
            <div className="space-y-1">
              <p className="serif text-[10px] leading-[1.05] text-ink">21 controls wait for you</p>
              {line("90%")}
              {line("75%")}
              {line("82%")}
            </div>
            <div className="border-l border-line pl-1.5">
              <p className="serif text-[16px] leading-none text-ink">12</p>
              {line("70%")}
              <p className="serif mt-1 text-[16px] leading-none text-ink">32</p>
            </div>
          </div>
        </>
      )}
      {id === "mono" && (
        <>
          <div className="absolute inset-y-2 left-2 w-[22%] space-y-1.5 rounded-md p-1.5">
            <div className="h-1.5 w-3/4 rounded-full bg-ink/80" />
            {[0, 1, 2, 3].map((i) => <div key={i} className={cn("h-1.5 rounded-full", i === 1 ? "bg-brand" : "bg-ink/15")} style={{ width: `${55 + i * 9}%` }} />)}
          </div>
          <div className="absolute inset-y-2 left-[26%] right-2 rounded-lg border border-line bg-surface p-2 shadow-xs">
            <div className="serif text-[11px] leading-none text-ink">Good morning</div>
            <div className="mt-2.5 grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, i) => <span key={i} className={cn("size-1.5 rounded-full", i % 5 === 0 ? "bg-ink/15" : "bg-ink/70")} />)}
            </div>
            <div className="mt-2 space-y-1">{line("80%")}{line("60%")}</div>
          </div>
        </>
      )}
      {id === "boardroom" && (
        <>
          <div className="absolute inset-y-0 left-0 w-[24%] space-y-1.5 bg-[#13294b] p-2">
            <div className="h-1.5 w-3/4 rounded-full bg-white/80" />
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className={cn("h-1.5 rounded-sm", i === 0 ? "bg-white/30" : "bg-white/15")} />)}
          </div>
          <div className="absolute left-[28%] right-2 top-2 rounded-md bg-[#13294b] p-1.5">
            <p className="text-[7px] font-bold uppercase tracking-wide text-[#d4b25c]">Executive summary</p>
            <p className="text-[10px] font-bold text-white">Good morning</p>
            <div className="mt-0.5 flex gap-2 text-[11px] font-bold"><span className="text-[#7ee2a8]">3</span><span className="text-[#ffd479]">1</span><span className="text-[#ff9b9b]">3</span></div>
          </div>
          <div className="absolute bottom-2 left-[28%] right-2 space-y-[3px] rounded-md border border-line bg-surface p-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", ["bg-bad", "bg-warn", "bg-ok"][i])} />
                <span className="h-1 flex-1 rounded-full bg-ink/15" />
              </div>
            ))}
          </div>
        </>
      )}
      {id === "aurora" && (
        <>
          <div className="absolute inset-x-2 top-1.5 h-3.5 rounded-full bg-white/70" />
          <div className="absolute left-2 top-7 h-[52px] w-[52%] rounded-[14px] bg-[linear-gradient(135deg,#7c3aed,#c026d3_52%,#f97316)] p-1.5">
            <p className="text-[10px] font-semibold leading-[1.05] text-white" style={{ fontFamily: "var(--font-space)" }}>Good<br />morning</p>
          </div>
          <div className="absolute right-2 top-7 grid w-[38%] grid-cols-2 gap-1">
            {["#7c3aed", "#059669", "#ea580c", "#e11d48"].map((c) => (
              <div key={c} className="h-[24px] rounded-lg bg-white/70 p-1"><span className="block text-[9px] font-semibold leading-none" style={{ color: c }}>12</span></div>
            ))}
          </div>
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-white/60 p-1">
            {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("size-2.5 rounded-[5px]", i === 0 ? "bg-[linear-gradient(135deg,#7c3aed,#db2777)]" : "bg-white")} />)}
          </div>
        </>
      )}
      {id === "brutal" && (
        <>
          <div className="flex h-4 border-b-2 border-[#111] bg-surface">
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn("w-7 border-r-2 border-[#111]", i === 0 && "bg-[#111]")} />)}
          </div>
          <div className="h-2.5 overflow-hidden whitespace-nowrap bg-[#111] px-1 text-[6px] font-bold leading-[10px] text-[#c6f432]">21 WAITING ✦ 23 SENT BACK ✦ TARGET IN 24 DAYS</div>
          <p className="mx-2 mt-1 text-[14px] font-bold uppercase leading-[0.95] tracking-[-0.05em] text-[#111]">
            Tuesday.<br /><span className="bg-[#c6f432]">21 to approve</span>
          </p>
          <div className="mx-2 mt-1.5 flex gap-1">
            {["#c6f432", "#8ef0b4", "#ffd23f", "#ff9ab8"].map((c) => <span key={c} className="h-4 flex-1 border-[1.5px] border-[#111] shadow-[1.5px_1.5px_0_#111]" style={{ background: c }} />)}
          </div>
        </>
      )}
      {id === "spatial" && (
        <>
          <div className="absolute left-1.5 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-full bg-white/10 p-1">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className={cn("size-2 rounded-full", i === 0 ? "bg-white" : "bg-white/25")} />)}
          </div>
          <div className="absolute left-1/2 top-1.5 h-2.5 w-[40%] -translate-x-1/2 rounded-full bg-white/10" />
          <div className="absolute bottom-1.5 left-[16%] right-1.5 top-5 rounded-[12px] border border-white/10 bg-white/[0.05] p-1.5 text-center">
            <p className="text-[11px] font-extralight tracking-[-0.03em] text-white">Good morning</p>
            <svg viewBox="0 0 80 30" className="mx-auto mt-1 h-[34px]" aria-hidden>
              {[10, 18, 24, 14].map((h, i) => {
                const x = 14 + i * 15;
                return (
                  <g key={i}>
                    <path d={`M${x} 28 l6 -3 v${-h} l-6 3 z`} fill="rgb(255 255 255 / 0.55)" />
                    <path d={`M${x} 28 l-6 -3 v${-h} l6 3 z`} fill="rgb(255 255 255 / 0.3)" />
                    <path d={`M${x} ${28 - h} l6 -3 l-6 -3 l-6 3 z`} fill="rgb(255 255 255 / 0.85)" />
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      )}
      {id === "nocturne" && (
        <div className="absolute inset-0 font-[family-name:var(--font-jet)] text-[7px] leading-[10px]">
          <div className="border-b border-line px-1.5 py-[3px]"><span className="text-brand">seema@sk</span><span className="text-faint">:~$ </span><span className="text-ink">sk status</span></div>
          <div className="flex">
            <div className="w-[26%] space-y-[1px] border-r border-line px-1.5 py-1 text-faint">
              <p className="text-brand">› home</p>
              <p>├─ clients</p>
              <p>├─ audits</p>
              <p>└─ gaps</p>
            </div>
            <div className="flex-1 space-y-[1px] px-1.5 py-1">
              {[22, 17, 12, 7].map((n, i) => (
                <p key={i} className="whitespace-pre">
                  <span className={["text-brand", "text-brand", "text-warn", "text-bad"][i]}>{"█".repeat(n)}</span>
                  <span className="text-faint opacity-40">{"░".repeat(24 - n)}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-2.5 border-t border-line"><span className="bg-brand px-1 font-semibold text-on-brand">NORMAL</span><span className="px-1 text-faint">~/</span></div>
        </div>
      )}
    </div>
  );
}

export function DesignSwitcher() {
  const current = useDesign();
  const { resolvedTheme, setTheme } = useTheme();
  const next = DESIGNS[(DESIGNS.findIndex((d) => d.id === current.id) + 1) % DESIGNS.length];

  return (
    <HoverCard.Root openDelay={80} closeDelay={160}>
      <HoverCard.Trigger asChild>
        <button
          onClick={(e) => applyDesign(next.id, setTheme, { x: e.clientX, y: e.clientY })}
          className="group flex h-8 items-center gap-2 rounded-lg border border-line-strong bg-surface pl-1.5 pr-2.5 text-[12.5px] font-medium text-ink shadow-xs transition-colors hover:bg-subtle"
          aria-label={`Design: ${current.name}. Click for ${next.name}, hover to see all`}
        >
          <span className="relative flex size-5 items-center justify-center overflow-hidden rounded-md" data-design={current.id}>
            <span className="absolute inset-0 bg-canvas" style={{ backgroundImage: "var(--app-bg)" }} />
            <span className="relative size-2.5 rounded-full bg-brand ring-2 ring-surface" />
          </span>
          <span className="hidden md:inline">{current.name}</span>
          <Palette className="size-3.5 text-muted transition-transform group-hover:rotate-12" />
        </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          align="end"
          sideOffset={10}
          className="anim-pop z-[85] w-[min(640px,calc(100vw-16px))] rounded-2xl border border-line bg-surface p-3 shadow-pop"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <div className="flex items-end justify-between px-1 pb-3 pt-1">
            <div>
              <p className="text-[14px] font-semibold text-ink">Choose a look</p>
              <p className="text-[12px] text-muted">Seven complete designs, each with its own layout. Click one to switch; the choice is saved.</p>
            </div>
            <span className="hidden text-[11.5px] text-faint sm:block">Click the button to cycle</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DESIGNS.map((d, i) => {
              const on = d.id === current.id;
              const dark = d.scheme === "dark" || (d.scheme === "both" && resolvedTheme === "dark");
              return (
                <motion.button
                  key={d.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  onClick={(e) => applyDesign(d.id, setTheme, { x: e.clientX, y: e.clientY })}
                  className={cn(
                    "group rounded-xl border p-1.5 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5",
                    on ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-line hover:border-line-strong",
                  )}
                >
                  <Preview id={d.id} dark={dark} />
                  <div className="flex items-center gap-1.5 px-1 pb-0.5 pt-2">
                    <span className="text-[12.5px] font-semibold text-ink">{d.name}</span>
                    <span className="rounded-full bg-subtle px-1.5 py-px text-[10.5px] font-medium text-muted">{d.audience}</span>
                    {on && <Check className="ml-auto size-3.5 text-ink" strokeWidth={3} />}
                  </div>
                  <p className="line-clamp-2 px-1 text-[11.5px] leading-[1.35] text-muted">{d.tagline}</p>
                </motion.button>
              );
            })}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
