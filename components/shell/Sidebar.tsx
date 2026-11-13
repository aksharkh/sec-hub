"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronsUpDown, ExternalLink, Keyboard, LogOut, Moon, PanelLeftClose, PanelLeftOpen, RefreshCcw, Search, Sun, ArrowLeftRight } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/badge";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger, Tip } from "@/components/ui/overlay";
import { ME } from "@/lib/mock/seed";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, TRUST_URL } from "./nav";
import { openCommand } from "./CommandPalette";

function useCounts() {
  const controls = useStore((s) => s.controls);
  const gaps = useStore((s) => s.gaps);
  const audits = useStore((s) => s.audits);
  const risks = useStore((s) => s.risks);
  return useMemo(() => {
    const reviews = Object.values(controls).filter((c) => c.status === "review").length;
    const open = gaps.filter((g) => g.status !== "closed").length;
    const pbc = audits.flatMap((a) => a.pbc).filter((p) => p.status === "requested" || p.status === "followup").length;
    const highRisks = risks.filter((r) => r.status !== "closed" && r.residualLikelihood * r.residualImpact >= 12).length;
    return { reviews, gaps: open, pbc, risks: highRisks };
  }, [controls, gaps, audits, risks]);
}

export function SidebarBody({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const counts = useCounts();
  const clients = useStore((s) => s.clients);
  const ready = useStore((s) => s.ready);
  const toggle = useStore((s) => s.toggleSidebar);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const activeExact = (href: string) => pathname === href;
  const [closed, setClosed] = useState<Set<string>>(new Set());

  return (
    <div className="flex h-full flex-col">
      {/* Workspace switcher */}
      <div className={cn("flex items-center gap-1 px-3 pt-3", collapsed && "flex-col px-2")}>
        <WorkspaceMenu collapsed={collapsed} />
        {!collapsed && (
          <Tip content="Collapse sidebar" kbd="[">
            <button onClick={toggle} className="hidden size-7 place-items-center rounded-md text-faint transition-colors hover:bg-subtle-2/60 hover:text-ink lg:grid" aria-label="Collapse sidebar">
              <PanelLeftClose className="size-4" />
            </button>
          </Tip>
        )}
      </div>

      {/* Search */}
      <div className={cn("px-3 pt-3", collapsed && "px-2")}>
        {collapsed ? (
          <Tip content="Search" kbd="Ctrl K" side="right">
            <button onClick={openCommand} className="grid h-8 w-full place-items-center rounded-lg text-muted hover:bg-subtle-2/60 hover:text-ink" aria-label="Search">
              <Search className="size-4" />
            </button>
          </Tip>
        ) : (
          <button
            onClick={openCommand}
            className="flex h-8 w-full items-center gap-2 rounded-lg border border-line bg-surface/70 px-2.5 text-[13px] text-faint shadow-xs transition-colors hover:border-line-strong hover:text-muted"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search or jump to</span>
            <Kbd>Ctrl K</Kbd>
          </button>
        )}
      </div>

      <nav className={cn("mt-3 flex-1 overflow-y-auto px-3 pb-3", collapsed && "px-2")} aria-label="Main">
        {NAV_GROUPS.map((g) => {
          const shut = closed.has(g.id);
          return (
            <div key={g.id} className={cn(g.label && "mt-4")}>
              {g.label && !collapsed && (
                <button
                  onClick={() => setClosed((s) => { const n = new Set(s); if (n.has(g.id)) n.delete(g.id); else n.add(g.id); return n; })}
                  className="group mb-0.5 flex w-full items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-faint transition-colors hover:text-muted"
                >
                  {g.label}
                  <ChevronDown className={cn("size-3 opacity-0 transition-[transform,opacity] group-hover:opacity-100", shut && "-rotate-90 opacity-100")} />
                </button>
              )}
              {g.label && collapsed && <div className="my-3 h-px bg-line" />}
              <AnimatePresence initial={false}>
                {!shut && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="space-y-px overflow-hidden">
                    {g.items.map((n) => (
                      <li key={n.href}>
                        <NavLink
                          href={n.href}
                          icon={<n.icon />}
                          label={n.label}
                          active={n.href === "/team" ? activeExact(n.href) : active(n.href)}
                          collapsed={collapsed}
                          count={ready && n.count ? counts[n.count] : undefined}
                          onNavigate={onNavigate}
                        />
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {!collapsed && (
          <button
            onClick={() => setClosed((s) => { const n = new Set(s); if (n.has("pinned")) n.delete("pinned"); else n.add("pinned"); return n; })}
            className="group mb-0.5 mt-4 flex w-full items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-faint transition-colors hover:text-muted"
          >
            Pinned clients
            <ChevronDown className={cn("size-3 opacity-0 transition-[transform,opacity] group-hover:opacity-100", closed.has("pinned") && "-rotate-90 opacity-100")} />
          </button>
        )}
        {collapsed && <div className="my-3 h-px bg-line" />}
        {!closed.has("pinned") && (
          <ul className="space-y-px">
            {ready
              ? clients
                  .filter((c) => c.stage !== "certified")
                  .slice(0, 3)
                  .map((c) => (
                    <li key={c.id}>
                      <NavLink
                        href={`/clients/${c.id}`}
                        icon={<ClientMark name={c.name} hue={c.hue} size="sm" className="!size-[18px] !rounded-[5px] !text-[8px]" />}
                        label={c.name}
                        active={pathname.startsWith(`/clients/${c.id}`)}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                      />
                    </li>
                  ))
              : !collapsed && [0, 1, 2].map((i) => <li key={i} className="skeleton mx-2 my-2 h-4 rounded" />)}
          </ul>
        )}
      </nav>

      {collapsed && (
        <div className="px-2 pb-2">
          <Tip content="Expand sidebar" kbd="[" side="right">
            <button onClick={toggle} className="grid h-8 w-full place-items-center rounded-lg text-faint hover:bg-subtle-2/60 hover:text-ink" aria-label="Expand sidebar">
              <PanelLeftOpen className="size-4" />
            </button>
          </Tip>
        </div>
      )}
      <UserCard collapsed={collapsed} />
    </div>
  );
}

function NavLink({ href, icon, label, active, collapsed, count, onNavigate }: { href: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean; count?: number; onNavigate?: () => void }) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13.5px] font-medium transition-colors [&>svg]:size-4 [&>svg]:shrink-0",
        collapsed && "justify-center px-0",
        active ? "bg-surface text-ink shadow-[0_1px_2px_rgb(15_23_41/0.06),0_0_0_1px_var(--line)] [&>svg]:text-brand" : "text-ink-2 hover:bg-subtle-2/60 hover:text-ink [&>svg]:text-muted",
      )}
    >
      {icon}
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && count !== undefined && count > 0 && <span className="tnum text-[11.5px] font-medium text-faint">{count}</span>}
      {collapsed && count !== undefined && count > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" />}
    </Link>
  );
  return collapsed ? (
    <Tip content={label} side="right">
      {link}
    </Tip>
  ) : (
    link
  );
}

function WorkspaceMenu({ collapsed }: { collapsed: boolean }) {
  const reset = useStore((s) => s.reset);
  return (
    <Menu>
      <MenuTrigger asChild>
        <button className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-subtle-2/60", collapsed && "flex-none justify-center")}>
          <SecureKnotsLogo className="h-7 shrink-0" title="SecureKnots" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink">SecureKnots</span>
                <span className="block truncate text-[11.5px] text-muted">Workspace</span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
            </>
          )}
        </button>
      </MenuTrigger>
      <MenuContent className="w-[248px]">
        <MenuLabel>Products</MenuLabel>
        <MenuItem>
          <SecureKnotsLogo className="h-4 !text-current" />
          <span className="flex-1">Workspace</span>
          <span className="text-[11px] text-brand">Current</span>
        </MenuItem>
        <MenuItem onSelect={() => window.open(TRUST_URL, "_blank")}>
          <ExternalLink />
          <span className="flex-1">SecureKnots Trust</span>
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onSelect={() => {
            reset();
            toast.success("Demo data reset", { description: "Clients, controls and evidence are back to the starting state." });
          }}
        >
          <RefreshCcw />
          Reset demo data
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const members = useStore((s) => s.members);
  const clients = useStore((s) => s.clients);
  const setViewAs = useStore((s) => s.setViewAs);
  const me = members.find((m) => m.id === ME);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  if (!me)
    return (
      <div className="border-t border-line p-3">
        <div className="skeleton h-9 rounded-lg" />
      </div>
    );
  return (
    <div className={cn("border-t border-line p-2", collapsed && "px-2")}>
      <Menu>
        <MenuTrigger asChild>
          <button className={cn("flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-subtle-2/60", collapsed && "justify-center")}>
            <Avatar person={me} size="md" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-medium text-ink">{me.name}</span>
                  <span className="block truncate text-[11.5px] text-muted">{me.title} · Admin</span>
                </span>
                <ChevronsUpDown className="size-3.5 text-faint" />
              </>
            )}
          </button>
        </MenuTrigger>
        <MenuContent side="top" align="start" className="w-[240px]">
          <div className="px-2 py-1.5">
            <p className="text-[13px] font-medium text-ink">{me.name}</p>
            <p className="text-[12px] text-muted">{me.email}</p>
          </div>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>
              <ArrowLeftRight />
              View as client
            </MenuSubTrigger>
            <MenuSubContent className="w-[230px]">
              <MenuLabel>See the client dashboard as</MenuLabel>
              {clients.map((c) => (
                <MenuItem
                  key={c.id}
                  onSelect={() => {
                    setViewAs(c.id);
                    router.push("/portal");
                  }}
                >
                  <ClientMark name={c.name} hue={c.hue} size="sm" className="!size-[18px] !rounded-[5px] !text-[8px]" />
                  <span className="truncate">{c.contacts[0].name}</span>
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
          <MenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} shortcut="Ctrl J">
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
          </MenuItem>
          <MenuItem onSelect={() => window.dispatchEvent(new CustomEvent("sk:shortcuts"))} shortcut="?">
            <Keyboard />
            Keyboard shortcuts
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => router.push("/login")}>
            <LogOut />
            Sign out
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}
