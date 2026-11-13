"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Bell, CheckCheck, ChevronRight, Menu as MenuIcon, Moon, Search, Sparkles, Sun, Upload, Inbox, MessageSquare, CircleCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { ClientMark } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, Popover, PopoverContent, PopoverTrigger, Sheet, Tip } from "@/components/ui/overlay";
import { FRAMEWORKS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { FrameworkKey } from "@/lib/types";
import { ago, cn } from "@/lib/utils";
import { openCommand } from "./CommandPalette";
import { openAssistant } from "@/components/assistant/Assistant";
import { SidebarBody } from "./Sidebar";

const LABELS: Record<string, string> = {
  clients: "Clients", reviews: "Reviews", evidence: "Evidence", gaps: "Gaps", mapping: "Control mapping",
  team: "Team", roles: "Roles & permissions", settings: "Settings", calendar: "Calendar", audits: "Audits", policies: "Policies",
  risks: "Risks", reports: "Reports", automations: "Automations", integrations: "Integrations", "audit-log": "Audit log",
};

function Breadcrumbs() {
  const pathname = usePathname();
  const clients = useStore((s) => s.clients);
  const policies = useStore((s) => s.policies);
  const audits = useStore((s) => s.audits);
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: ReactNode; href: string }[] = [];
  if (parts.length === 0) crumbs.push({ label: "Home", href: "/" });
  parts.forEach((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    if (parts[0] === "clients" && i === 1) {
      const c = clients.find((x) => x.id === p);
      crumbs.push({
        href,
        label: c ? (
          <span className="flex items-center gap-1.5">
            <ClientMark name={c.name} hue={c.hue} size="sm" className="!size-4 !rounded-[4px] !text-[7px]" />
            {c.name}
          </span>
        ) : (
          <span className="skeleton inline-block h-3 w-20 rounded" />
        ),
      });
    } else if (parts[0] === "clients" && i === 2) crumbs.push({ href, label: FRAMEWORKS[p as FrameworkKey]?.name ?? p });
    else if (parts[0] === "policies" && i === 1) crumbs.push({ href, label: policies.find((x) => x.id === p)?.title ?? "Policy" });
    else if (parts[0] === "audits" && i === 1) {
      const au = audits.find((x) => x.id === p);
      crumbs.push({ href, label: au ? `${clients.find((c) => c.id === au.clientId)?.name ?? ""} · ${au.kind}` : "Audit" });
    } else crumbs.push({ href, label: LABELS[p] ?? p });
  });
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
      {crumbs.map((c, i) => (
        <Fragment key={c.href}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-faint" />}
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-ink">{c.label}</span>
          ) : (
            <Link href={c.href} className={cn("truncate rounded-md px-1 py-0.5 text-muted transition-colors hover:bg-subtle hover:text-ink", i < crumbs.length - 2 && "hidden sm:inline")}>
              {c.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

const noop = () => () => {};

const N_ICON = { approve: CircleCheck, upload: Upload, comment: MessageSquare, revise: Inbox, status: Inbox, gap: Inbox, publish: Inbox, assign: Inbox };

function Notifications() {
  const items = useStore((s) => s.notifications);
  const read = useStore((s) => s.readNotifications);
  const router = useRouter();
  const unread = items.filter((n) => !n.read).length;
  return (
    <Popover>
      <Tip content="Notifications">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative">
            <Bell />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-surface" />}
          </Button>
        </PopoverTrigger>
      </Tip>
      <PopoverContent className="w-[380px] max-w-[calc(100vw-16px)] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[13.5px] font-semibold">Notifications</p>
          <button onClick={read} className="flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink">
            <CheckCheck className="size-3.5" />
            Mark all read
          </button>
        </div>
        <ul className="max-h-[380px] overflow-y-auto p-1.5">
          {items.map((n) => {
            const I = N_ICON[n.kind];
            return (
              <li key={n.id}>
                <button
                  onClick={() => router.push(n.href)}
                  className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-subtle"
                >
                  <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", n.kind === "approve" ? "bg-rev-soft text-rev" : "bg-info-soft text-info")}>
                    <I className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[13px] leading-5", n.read ? "text-muted" : "text-ink")}>{n.text}</span>
                    <span className="mt-0.5 block text-[11.5px] text-faint">{ago(n.at)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Tip content={dark ? "Light theme" : "Dark theme"} kbd="Ctrl J">
      <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="Toggle theme">
        {dark ? <Sun /> : <Moon />}
      </Button>
    </Tip>
  );
}

export function Topbar() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur-xl md:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
        <MenuIcon />
      </Button>
      <Sheet open={navOpen} onOpenChange={setNavOpen} title="Navigation" side="left" className="bg-canvas">
        <SidebarBody onNavigate={() => setNavOpen(false)} />
      </Sheet>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={openCommand} aria-label="Search">
        <Search />
      </Button>
      <span className="hidden items-center gap-1.5 rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[11px] font-medium text-faint xl:flex">
        <span className="size-1.5 rounded-full bg-warn" />
        Demo data
      </span>
      <Button variant="secondary" size="sm" onClick={openAssistant} className="hidden gap-1.5 sm:inline-flex">
        <Sparkles className="!size-3.5" />
        Ask
        <Kbd className="ml-0.5">Ctrl /</Kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={openAssistant} className="sm:hidden" aria-label="Ask the assistant"><Sparkles /></Button>
      <Notifications />
      <ThemeToggle />
    </header>
  );
}

const SHORTCUTS: [string, string[]][] = [
  ["Open search and commands", ["Ctrl", "K"]],
  ["Switch light / dark theme", ["Ctrl", "J"]],
  ["Collapse the sidebar", ["["]],
  ["Go to Home", ["G", "H"]],
  ["Go to Reviews", ["G", "R"]],
  ["Go to Clients", ["G", "C"]],
  ["Go to Evidence", ["G", "E"]],
  ["Go to Gaps", ["G", "G"]],
  ["In Reviews: next / previous", ["J", "K"]],
  ["In Reviews: approve / send back", ["A", "R"]],
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("sk:shortcuts", on);
    return () => window.removeEventListener("sk:shortcuts", on);
  }, []);
  const rows = useMemo(() => SHORTCUTS, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="Keyboard shortcuts" description="Most of the Workspace works without a mouse.">
        <ul className="divide-y divide-line px-5 py-2">
          {rows.map(([label, keys]) => (
            <li key={label} className="flex items-center justify-between py-2.5 text-[13px] text-ink-2">
              {label}
              <span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
