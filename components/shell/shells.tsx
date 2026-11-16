"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "motion/react";
import { LayoutGrid, Search } from "lucide-react";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/badge";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger, Tip } from "@/components/ui/overlay";
import { ME } from "@/lib/mock/seed";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { openCommand } from "./CommandPalette";
import { NAV, NAV_GROUPS, type NavItem } from "./nav";
import { SidebarBody, useCounts } from "./Sidebar";
import { Breadcrumbs, MobileNav, TopActions, Topbar } from "./Topbar";

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : href === "/team" ? pathname === "/team" : pathname === href || pathname.startsWith(href + "/"));
}

const Scroll = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div id="scroll" className={cn("h-full overflow-y-auto overflow-x-hidden", className)}>{children}</div>
);

/* ───────── 1. Mono: Linear-style sidebar ───────── */
export function MonoShell({ children }: { children: ReactNode }) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className={cn("hidden shrink-0 transition-[width] duration-300 ease-out-expo lg:block", collapsed ? "w-[60px]" : "w-[248px]")}>
        <SidebarBody collapsed={collapsed} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
        <main id="main" className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface lg:rounded-xl lg:border lg:border-line lg:shadow-panel">
          <Topbar />
          <div className="min-h-0 flex-1"><Scroll>{children}</Scroll></div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 2. Meridian: editorial masthead, horizontal nav, no sidebar ───────── */
const PRIMARY = ["/", "/reviews", "/clients", "/audits", "/evidence", "/policies", "/gaps", "/calendar"];

export function MeridianShell({ children }: { children: ReactNode }) {
  const active = useActive();
  const counts = useCounts();
  const primary = NAV.filter((n) => PRIMARY.includes(n.href));
  const rest = NAV.filter((n) => !PRIMARY.includes(n.href));
  const today = useSyncExternalStore(() => () => {}, () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }), () => "");
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <header className="shrink-0 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-4 md:px-8">
          <MobileNav className="-ml-2" />
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <SecureKnotsLogo className="h-8" title="SecureKnots" />
            <span className="serif hidden text-[24px] leading-none text-ink sm:block">Secure<i>Knots</i></span>
          </Link>
          <nav className="hidden h-full items-stretch gap-1 lg:flex" aria-label="Main">
            {primary.map((n, i) => {
              const on = active(n.href);
              const c = n.count ? counts[n.count] : 0;
              return (
                <Link key={n.href} href={n.href} className={cn("relative items-center gap-1.5 px-2.5 text-[13.5px] transition-colors", i < 5 ? "flex" : "hidden xl:flex", on ? "text-ink" : "text-muted hover:text-ink")}>
                  {n.label}
                  {c > 0 && <sup className="tnum text-[10px] text-brand">{c}</sup>}
                  {on && <motion.span layoutId="mer-line" className="absolute inset-x-2.5 bottom-0 h-[2px] bg-brand" />}
                </Link>
              );
            })}
            <Menu>
              <MenuTrigger className="flex items-center px-2.5 text-[13.5px] text-muted outline-none hover:text-ink">More</MenuTrigger>
              <MenuContent>
                {primary.slice(5).map((n) => (
                  <MenuItem key={n.href} asChild className="xl:hidden">
                    <Link href={n.href}><n.icon />{n.label}</Link>
                  </MenuItem>
                ))}
                {rest.map((n) => (
                  <MenuItem key={n.href} asChild>
                    <Link href={n.href}><n.icon />{n.label}</Link>
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          </nav>
          <div className="ml-auto flex items-center gap-1"><TopActions compact demo={false} /></div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex h-9 max-w-[1500px] items-center gap-4 px-4 text-[12px] md:px-8">
            <div className="min-w-0 flex-1"><Breadcrumbs /></div>
            <span className="hidden text-muted md:block">{today}</span>
            <button onClick={openCommand} className="hidden items-center gap-1.5 text-muted hover:text-ink sm:flex"><Search className="size-3.5" /> Search <Kbd>Ctrl K</Kbd></button>
          </div>
        </div>
      </header>
      <main id="main" className="min-h-0 flex-1">
        <Scroll className="[&>div]:mx-auto [&>div]:max-w-[1500px] [&>div]:md:px-2">{children}</Scroll>
      </main>
    </div>
  );
}

/* ───────── 3. Boardroom: navy rail with large labels, header band ───────── */
export function BoardroomShell({ children }: { children: ReactNode }) {
  const active = useActive();
  const counts = useCounts();
  const me = useStore((s) => s.members.find((m) => m.id === ME));
  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden w-[264px] shrink-0 flex-col bg-[#13294b] text-white lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
          <SecureKnotsLogo className="h-9" onDark title="SecureKnots" />
          <div className="leading-tight">
            <p className="text-[16px] font-semibold tracking-[-0.01em]">SecureKnots</p>
            <p className="text-[12px] text-white/55">Compliance workspace</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          {NAV_GROUPS.map((g) => (
            <div key={g.id} className="mb-4">
              {g.label && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">{g.label}</p>}
              {g.items.map((n) => {
                const on = active(n.href);
                const c = n.count ? counts[n.count] : 0;
                return (
                  <Link key={n.href} href={n.href} className={cn("relative flex h-10 items-center gap-3 rounded-md px-3 text-[14.5px] transition-colors", on ? "bg-white/12 font-semibold text-white" : "text-white/75 hover:bg-white/6 hover:text-white")}>
                    {on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#d4b25c]" />}
                    <n.icon className="size-[18px]" />
                    <span className="flex-1">{n.label}</span>
                    {c > 0 && <span className="tnum rounded bg-[#d4b25c] px-1.5 text-[11.5px] font-semibold text-[#13294b]">{c}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {me && (
          <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
            <Avatar person={me} size="lg" />
            <div className="leading-tight"><p className="text-[14px] font-semibold">{me.name}</p><p className="text-[12px] text-white/55">{me.title}</p></div>
          </div>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center gap-3 border-b-2 border-line-strong bg-surface px-4 md:px-6">
          <MobileNav />
          <div className="min-w-0 flex-1 text-[15px] [&_nav]:text-[15px]"><Breadcrumbs /></div>
          <TopActions />
        </header>
        <main id="main" className="min-h-0 flex-1 bg-canvas"><Scroll>{children}</Scroll></main>
      </div>
    </div>
  );
}

/* ───────── 4. Aurora: floating glass bar and a bottom dock ───────── */
const DOCK = ["/", "/reviews", "/calendar", "/clients", "/audits", "/evidence", "/policies", "/questionnaires", "/risks", "/gaps", "/reports"];

function DockItem({ n, on, count }: { n: NavItem; on: boolean; count?: number }) {
  return (
    <Tip content={n.label}>
      <Link href={n.href} className="group relative">
        <motion.span
          whileHover={{ scale: 1.22, y: -6 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className={cn("grid size-11 place-items-center rounded-2xl transition-colors", on ? "bg-[linear-gradient(135deg,#7c3aed,#db2777)] text-white shadow-[0_8px_20px_-6px_rgb(192_38_211/0.6)]" : "bg-white/60 text-ink-2 hover:bg-white")}
        >
          <n.icon className="size-5" />
        </motion.span>
        {!!count && <span className="tnum absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold leading-[18px] text-inverse">{count}</span>}
        {on && <span className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ink" />}
      </Link>
    </Tip>
  );
}

export function AuroraShell({ children }: { children: ReactNode }) {
  const active = useActive();
  const counts = useCounts();
  const dock = DOCK.map((h) => NAV.find((n) => n.href === h)!).filter(Boolean);
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="mx-3 mt-3 flex h-14 shrink-0 items-center gap-3 rounded-[20px] border border-white/60 bg-white/55 px-3 shadow-[0_10px_40px_-20px_rgb(76_29_149/0.4)] backdrop-blur-2xl">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2">
          <SecureKnotsLogo className="h-7" title="SecureKnots" />
          <span className="hidden text-[16px] font-semibold tracking-[-0.03em] text-ink sm:block" style={{ fontFamily: "var(--font-space)" }}>secureknots</span>
        </Link>
        <button onClick={openCommand} className="mx-auto hidden h-9 w-[min(420px,40vw)] items-center gap-2 rounded-full bg-white/70 px-4 text-[13px] text-muted shadow-[inset_0_0_0_1px_rgb(124_58_237/0.12)] hover:text-ink md:flex">
          <Search className="size-4" /> Search anything <Kbd className="ml-auto">Ctrl K</Kbd>
        </button>
        <div className="ml-auto flex items-center gap-1 md:ml-0"><TopActions compact demo={false} /></div>
      </header>
      <main id="main" className="min-h-0 flex-1"><Scroll className="pb-28">{children}</Scroll></main>
      <nav aria-label="Main" className="fixed bottom-4 left-1/2 z-40 max-w-[calc(100vw-16px)] -translate-x-1/2">
        <div className="no-scrollbar flex items-end gap-1.5 overflow-x-auto rounded-[28px] border border-white/70 bg-white/45 p-2 shadow-[0_24px_60px_-20px_rgb(76_29_149/0.45)] backdrop-blur-2xl">
          {dock.map((n, i) => (
            <span key={n.href} className="flex items-end gap-1.5">
              {(i === 3 || i === 10) && <span className="mx-1 h-8 w-px self-center bg-[rgb(91_33_182/0.15)]" />}
              <DockItem n={n} on={active(n.href)} count={n.count ? counts[n.count] : undefined} />
            </span>
          ))}
          <span className="mx-1 h-8 w-px self-center bg-[rgb(91_33_182/0.15)]" />
          <Menu>
            <Tip content="Everything else">
              <MenuTrigger className="grid size-11 place-items-center rounded-2xl bg-white/60 text-ink-2 outline-none hover:bg-white"><LayoutGrid className="size-5" /></MenuTrigger>
            </Tip>
            <MenuContent side="top" align="end">
              <MenuLabel>More</MenuLabel>
              {NAV.filter((n) => !DOCK.includes(n.href)).map((n) => (
                <MenuItem key={n.href} asChild><Link href={n.href}><n.icon />{n.label}</Link></MenuItem>
              ))}
            </MenuContent>
          </Menu>
        </div>
      </nav>
    </div>
  );
}

/* ───────── 5. Brutal: tab strip and an alert ticker ───────── */
function Ticker() {
  const controls = useStore((s) => s.controls);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const items = useMemo(() => {
    const list = Object.values(controls);
    const wait = list.filter((c) => c.status === "review" && c.approvals.reviewed).length;
    const revise = list.filter((c) => c.status === "revise").length;
    const soon = engagements
      .map((e) => ({ e, d: Math.round((new Date(e.target).getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5) }))
      .filter((x) => x.d >= 0 && x.d <= 45)
      .map((x) => `${clients.find((c) => c.id === x.e.clientId)?.name.toUpperCase()} TARGET IN ${x.d} DAYS`);
    return [`${wait} CONTROLS WAITING FOR APPROVAL`, `${revise} SENT BACK FOR REVISION`, ...soon, "DROP FILES ANYWHERE TO FILE THEM AUTOMATICALLY"];
  }, [controls, clients, engagements]);
  const line = items.join("  ✦  ");
  return (
    <div className="relative h-8 shrink-0 overflow-hidden border-b-2 border-ink bg-ink text-[12px] font-bold leading-8 tracking-[0.04em] text-[#c6f432]">
      <motion.div className="absolute flex whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
        <span className="px-4">{line}  ✦  </span>
        <span className="px-4">{line}  ✦  </span>
      </motion.div>
    </div>
  );
}

export function BrutalShell({ children }: { children: ReactNode }) {
  const active = useActive();
  const counts = useCounts();
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b-2 border-ink bg-surface px-3 md:px-5">
        <MobileNav />
        <Link href="/" className="flex items-center gap-3">
          <SecureKnotsLogo className="h-9" title="SecureKnots" />
          <span className="hidden text-[24px] font-bold uppercase leading-none tracking-[-0.05em] text-ink sm:block">SecureKnots</span>
          <span className="hidden -rotate-6 rounded-[4px] border-2 border-ink bg-[#c6f432] px-1.5 py-0.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_var(--ink)] sm:block">Workspace</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5"><TopActions compact demo={false} /></div>
      </header>
      <nav aria-label="Main" className="no-scrollbar flex shrink-0 overflow-x-auto border-b-2 border-ink bg-surface">
        {NAV.map((n) => {
          const on = active(n.href);
          const c = n.count ? counts[n.count] : 0;
          return (
            <Link key={n.href} href={n.href} className={cn("flex h-11 shrink-0 items-center gap-2 border-r-2 border-ink px-4 text-[12.5px] font-bold uppercase tracking-[0.02em] transition-colors", on ? "bg-ink text-[#c6f432]" : "text-ink hover:bg-[#fff27a]")}>
              <n.icon className="size-4" />
              {n.label}
              {c > 0 && <span className={cn("tnum rounded-[3px] border-2 px-1 text-[10.5px] leading-4", on ? "border-[#c6f432]" : "border-ink bg-[#ff9ad5]")}>{c}</span>}
            </Link>
          );
        })}
      </nav>
      <Ticker />
      <main id="main" className="min-h-0 flex-1"><Scroll>{children}</Scroll></main>
    </div>
  );
}

/* ───────── 6. Spatial: floating ornament, top capsule, glass window ───────── */
export function SpatialShell({ children }: { children: ReactNode }) {
  const active = useActive();
  const counts = useCounts();
  return (
    <div className="relative h-dvh overflow-hidden">
      <nav aria-label="Main" className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 rounded-[28px] border border-white/10 bg-white/[0.06] p-2 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-3xl lg:flex">
        {NAV.filter((n) => !["/team/roles", "/audit-log", "/integrations", "/automations"].includes(n.href)).map((n) => {
          const on = active(n.href);
          const c = n.count ? counts[n.count] : 0;
          return (
            <Tip key={n.href} content={n.label} side="right">
              <Link href={n.href} className={cn("relative grid size-10 place-items-center rounded-full transition-all", on ? "bg-white text-[#09090b] shadow-[0_0_24px_-4px_rgb(255_255_255/0.6)]" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                <n.icon className="size-[18px]" />
                {c > 0 && !on && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#f472b6]" />}
              </Link>
            </Tip>
          );
        })}
      </nav>
      <header className="fixed left-1/2 top-4 z-40 flex h-12 max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-2.5 shadow-[0_20px_60px_-24px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-3xl">
        <MobileNav />
        <SecureKnotsLogo className="h-7 shrink-0" onDark title="SecureKnots" />
        <div className="hidden min-w-0 max-w-[420px] px-2 md:block"><Breadcrumbs /></div>
        <span className="mx-1 hidden h-5 w-px bg-white/15 md:block" />
        <TopActions compact demo={false} />
      </header>
      <main id="main" className="absolute inset-x-2 bottom-2 top-[76px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.07)] backdrop-blur-2xl lg:left-[88px] lg:right-5 lg:bottom-5">
        <Scroll>{children}</Scroll>
      </main>
    </div>
  );
}

/* ───────── 7. Nocturne: terminal frame with a file tree and a status line ───────── */
function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tnum">{t}</span>;
}

export function NocturneShell({ children }: { children: ReactNode }) {
  const active = useActive();
  const counts = useCounts();
  const pathname = usePathname();
  const path = "~" + (pathname === "/" ? "" : pathname);
  return (
    <div className="flex h-dvh flex-col overflow-hidden font-[family-name:var(--font-jet)]">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-canvas px-3">
        <MobileNav />
        <span className="flex items-center gap-1.5 text-[12.5px]">
          <SecureKnotsLogo variant="knot" className="h-4 text-brand" />
          <span className="hidden text-brand sm:inline">seema@secureknots</span>
          <span className="hidden text-faint sm:inline">:</span>
          <span className="hidden max-w-[240px] truncate text-ink-2 md:inline">{path}</span>
          <span className="text-faint">$</span>
        </span>
        <button onClick={openCommand} className="group hidden h-7 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-line px-2.5 text-left text-[12px] text-faint hover:border-brand/40 md:flex">
          <span className="text-brand">›</span> type a command
          <span className="ml-0.5 inline-block h-3.5 w-[7px] animate-pulse bg-brand/80" />
          <Kbd className="ml-auto">Ctrl K</Kbd>
        </button>
        <div className="ml-auto flex items-center gap-0.5 [&_button]:font-sans"><TopActions compact demo={false} /></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[230px] shrink-0 overflow-y-auto border-r border-line bg-canvas px-2 py-3 text-[12.5px] lg:block">
          <p className="px-2 pb-1 text-faint">~/workspace</p>
          {NAV_GROUPS.map((g) => (
            <div key={g.id} className="mb-2">
              {g.label && <p className="px-2 py-1 text-muted">▾ {g.label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}/</p>}
              {g.items.map((n, i) => {
                const on = active(n.href);
                const c = n.count ? counts[n.count] : 0;
                const last = i === g.items.length - 1;
                return (
                  <Link key={n.href} href={n.href} className={cn("flex items-center gap-1.5 rounded px-2 py-[3px] transition-colors", on ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-subtle hover:text-ink")}>
                    <span className="text-faint">{g.label ? (last ? "└─" : "├─") : on ? "›" : " "}</span>
                    <span className="flex-1 truncate">{n.label.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}</span>
                    {c > 0 && <span className="tnum text-[11px] text-brand">{c}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>
        <main id="main" className="min-w-0 flex-1 bg-surface"><Scroll>{children}</Scroll></main>
      </div>
      <footer className="flex h-7 shrink-0 items-center gap-0 border-t border-line bg-canvas text-[11.5px]">
        <span className="h-full bg-brand px-3 font-semibold leading-7 text-on-brand">NORMAL</span>
        <span className="truncate px-3 text-ink-2">{path}</span>
        <span className="ml-auto hidden gap-4 px-3 text-muted sm:flex">
          <span><span className="text-brand">{counts.reviews}</span> reviews</span>
          <span><span className="text-warn">{counts.gaps}</span> gaps</span>
          <span><span className="text-rev">{counts.pbc}</span> pbc</span>
        </span>
        <span className="border-l border-line px-3 text-muted"><Clock /></span>
        <span className="border-l border-line px-3 text-muted">utf-8 · ts</span>
      </footer>
    </div>
  );
}
