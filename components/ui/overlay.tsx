"use client";

import { Dialog as D, DropdownMenu as DM, Popover as P, Tooltip as T } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Kbd } from "./badge";

/* ───────── Tooltip ───────── */
export function Tip({ content, kbd, side = "top", children, asChild = true }: { content: ReactNode; kbd?: string; side?: "top" | "bottom" | "left" | "right"; children: ReactNode; asChild?: boolean }) {
  return (
    <T.Root>
      <T.Trigger asChild={asChild}>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="anim-pop z-[90] flex items-center gap-2 rounded-lg bg-ink px-2 py-1 text-[12px] font-medium text-surface shadow-pop dark:bg-subtle-2 dark:text-ink"
        >
          {content}
          {kbd && <Kbd className="border-white/15 bg-white/10 text-white/80 shadow-none dark:border-line dark:bg-surface dark:text-muted">{kbd}</Kbd>}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}

/* ───────── Dropdown menu ───────── */
export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;
export const MenuGroup = DM.Group;
export const MenuSub = DM.Sub;

const menuPanel = "anim-pop z-[80] min-w-[210px] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-pop";

export function MenuContent({ className, align = "start", sideOffset = 6, ...p }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content align={align} sideOffset={sideOffset} className={cn(menuPanel, className)} {...p} />
    </DM.Portal>
  );
}

const itemCls =
  "relative flex h-8 cursor-default select-none items-center gap-2 rounded-lg px-2 text-[13px] text-ink-2 outline-none transition-colors data-[disabled]:opacity-40 data-[highlighted]:bg-subtle data-[highlighted]:text-ink [&_svg]:size-4 [&_svg]:text-muted";

export function MenuItem({ className, shortcut, children, danger, ...p }: ComponentProps<typeof DM.Item> & { shortcut?: string; danger?: boolean }) {
  return (
    <DM.Item className={cn(itemCls, danger && "text-bad data-[highlighted]:text-bad [&_svg]:text-bad", className)} {...p}>
      {children}
      {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
    </DM.Item>
  );
}

export function MenuCheck({ className, children, ...p }: ComponentProps<typeof DM.CheckboxItem>) {
  return (
    <DM.CheckboxItem className={cn(itemCls, "pl-7", className)} {...p}>
      <DM.ItemIndicator className="absolute left-2 flex">
        <svg viewBox="0 0 16 16" className="size-3.5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.5 3 3 6-7" /></svg>
      </DM.ItemIndicator>
      {children}
    </DM.CheckboxItem>
  );
}

export function MenuLabel({ className, ...p }: ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn("px-2 pb-1 pt-2 text-[11px] font-medium text-faint", className)} {...p} />;
}

export function MenuSeparator() {
  return <DM.Separator className="-mx-1 my-1 h-px bg-line" />;
}

export function MenuSubTrigger({ className, children, ...p }: ComponentProps<typeof DM.SubTrigger>) {
  return (
    <DM.SubTrigger className={cn(itemCls, "data-[state=open]:bg-subtle", className)} {...p}>
      {children}
      <svg viewBox="0 0 16 16" className="ml-auto size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 4 4 4-4 4" /></svg>
    </DM.SubTrigger>
  );
}

export function MenuSubContent({ className, ...p }: ComponentProps<typeof DM.SubContent>) {
  return (
    <DM.Portal>
      <DM.SubContent sideOffset={6} className={cn(menuPanel, className)} {...p} />
    </DM.Portal>
  );
}

/* ───────── Popover ───────── */
export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;
export function PopoverContent({ className, align = "end", sideOffset = 8, ...p }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={sideOffset} className={cn("anim-pop z-[80] rounded-xl border border-line bg-surface shadow-pop outline-none", className)} {...p} />
    </P.Portal>
  );
}

/* ───────── Dialog ───────── */
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, title, description, wide, ...p }: ComponentProps<typeof D.Content> & { title: ReactNode; description?: ReactNode; wide?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="anim-overlay fixed inset-0 z-[70] bg-[rgb(15_23_41/0.28)] backdrop-blur-[2px] dark:bg-black/60" />
      <D.Content
        className={cn(
          "anim-dialog fixed left-1/2 top-1/2 z-[71] flex max-h-[calc(100dvh-32px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop outline-none",
          wide ? "max-w-[680px]" : "max-w-[480px]",
          className,
        )}
        {...p}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <D.Title className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-[13px] leading-5 text-muted">{description}</D.Description> : <D.Description className="sr-only">{String(title)}</D.Description>}
          </div>
          <D.Close className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </D.Content>
    </D.Portal>
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-line bg-raised px-5 py-3", className)}>{children}</div>;
}

/* ───────── Sheet (side drawer) ───────── */
export function Sheet({ open, onOpenChange, children, title, side = "right", className }: { open: boolean; onOpenChange: (o: boolean) => void; children: ReactNode; title: string; side?: "right" | "left"; className?: string }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="anim-overlay fixed inset-0 z-[60] bg-[rgb(15_23_41/0.18)] dark:bg-black/50" />
        <D.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-2 z-[61] flex w-[min(680px,calc(100vw-16px))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop outline-none",
            side === "right" ? "anim-sheet right-2" : "anim-sheet-left left-2 w-[min(300px,calc(100vw-16px))]",
            className,
          )}
        >
          <D.Title className="sr-only">{title}</D.Title>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
export const SheetClose = D.Close;
