"use client";

import { Checkbox as CB, Select as S, Switch as SW } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-line-strong bg-surface text-[13.5px] text-ink shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-faint hover:border-[color-mix(in_oklab,var(--line-strong),var(--ink)_10%)] focus:border-brand focus:shadow-[0_0_0_3px_var(--ring)]";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input data-slot="input" className={cn(field, "h-9 px-3", className)} {...p} />;
}

export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea data-slot="input" className={cn(field, "min-h-[84px] resize-none px-3 py-2 leading-5", className)} {...p} />;
}

export function SearchInput({ className, ...p }: ComponentProps<"input">) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <input data-slot="input" className={cn(field, "h-8 pl-8 pr-3 text-[13px]")} {...p} />
    </div>
  );
}

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-[12.5px] font-medium text-ink-2">
      {children}
      {hint && <span className="text-[11.5px] font-normal text-faint">{hint}</span>}
    </label>
  );
}

/* ───────── Select ───────── */
export function Select({ value, onValueChange, options, placeholder, className, size = "md", renderValue }: {
  value?: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: ReactNode; hint?: ReactNode }[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  renderValue?: ReactNode;
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger className={cn(field, "flex items-center justify-between gap-2 px-3 text-left data-[placeholder]:text-faint", size === "sm" ? "h-8 text-[13px]" : "h-9", className)}>
        <span className="min-w-0 truncate">{renderValue ?? <S.Value placeholder={placeholder} />}</span>
        <S.Icon>
          <ChevronDown className="size-4 text-faint" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={6} className="anim-pop z-[90] max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-pop">
          <S.Viewport>
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} className="relative flex h-8 cursor-default select-none items-center gap-2 rounded-lg pl-7 pr-2 text-[13px] text-ink-2 outline-none data-[highlighted]:bg-subtle data-[highlighted]:text-ink">
                <S.ItemIndicator className="absolute left-2">
                  <Check className="size-3.5 text-brand" />
                </S.ItemIndicator>
                <S.ItemText>{o.label}</S.ItemText>
                {o.hint && <span className="ml-auto text-[11.5px] text-faint">{o.hint}</span>}
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}

/* ───────── Checkbox / Switch ───────── */
export function Checkbox({ className, ...p }: ComponentProps<typeof CB.Root>) {
  return (
    <CB.Root
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-line-strong bg-surface shadow-xs outline-none transition-colors focus-visible:shadow-[0_0_0_3px_var(--ring)] data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand",
        className,
      )}
      {...p}
    >
      <CB.Indicator className="text-on-brand">
        {p.checked === "indeterminate" ? <span className="block h-[1.5px] w-2 rounded bg-current" /> : <Check className="size-3" strokeWidth={3} />}
      </CB.Indicator>
    </CB.Root>
  );
}

export function Switch({ className, ...p }: ComponentProps<typeof SW.Root>) {
  return (
    <SW.Root
      className={cn(
        "relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full bg-subtle-2 shadow-[inset_0_0_0_1px_var(--line)] outline-none transition-colors focus-visible:shadow-[0_0_0_3px_var(--ring)] data-[state=checked]:bg-brand",
        className,
      )}
      {...p}
    >
      <SW.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-[0_1px_3px_rgb(15_23_41/0.3)] transition-transform duration-200 ease-out-expo data-[state=checked]:translate-x-[16px]" />
    </SW.Root>
  );
}

/* ───────── Segmented control ───────── */
export function Segmented<T extends string>({ value, onChange, options, size = "sm", className }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  size?: "sm" | "xs";
  className?: string;
}) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div role="tablist" data-slot="segmented" className={cn("inline-flex items-center rounded-[10px] bg-subtle p-[3px] shadow-[inset_0_0_0_1px_var(--line)]", className)}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.value)}
              data-slot="seg-item"
              className={cn(
                "relative flex items-center gap-1.5 rounded-[7px] font-medium transition-colors [&_svg]:size-3.5",
                size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-6 px-2 text-[12px]",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="seg" data-slot="seg-thumb"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  className="absolute inset-0 rounded-[7px] bg-surface shadow-[0_1px_2px_rgb(15_23_41/0.08),0_0_0_1px_var(--line)]"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {o.icon}
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ───────── Underline tabs ───────── */
export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode; count?: number }[]; className?: string }) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div role="tablist" data-slot="tabs" className={cn("no-scrollbar flex items-center gap-5 overflow-x-auto border-b border-line", className)}>
        {tabs.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              data-slot="tab"
              className={cn("relative flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium transition-colors", active ? "text-ink" : "text-muted hover:text-ink")}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={cn("tnum rounded-full px-1.5 text-[11px] leading-[18px]", active ? "bg-ink text-inverse" : "bg-subtle-2 text-muted")}>{t.count}</span>
              )}
              {active && <motion.span layoutId="tab-line" data-slot="tab-line" transition={{ type: "spring", bounce: 0.12, duration: 0.4 }} className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
