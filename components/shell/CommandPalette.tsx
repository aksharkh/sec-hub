"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Building2, CornerDownLeft, Moon, RefreshCcw, Search, Sparkles, Sun, Wand2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ClientMark } from "@/components/ui/avatar";
import { Kbd, StatusIcon } from "@/components/ui/badge";
import { DialogContent, Dialog } from "@/components/ui/overlay";
import { FRAMEWORKS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { NAV } from "./nav";

export const openCommand = () => window.dispatchEvent(new CustomEvent("sk:command"));

const itemCls =
  "group flex h-9 cursor-default items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-ink-2 outline-none data-[selected=true]:bg-subtle data-[selected=true]:text-ink [&>svg]:size-4 [&>svg]:text-muted";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const clients = useStore((s) => s.clients);
  const controls = useStore((s) => s.controls);
  const engagements = useStore((s) => s.engagements);
  const setViewAs = useStore((s) => s.setViewAs);
  const reset = useStore((s) => s.reset);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const gPressed = useRef(0);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "[") toggleSidebar();
      if (e.key === "?") window.dispatchEvent(new CustomEvent("sk:shortcuts"));
      if (e.key.toLowerCase() === "g") {
        gPressed.current = Date.now();
        return;
      }
      if (Date.now() - gPressed.current < 900) {
        const map: Record<string, string> = { h: "/", r: "/reviews", c: "/clients", e: "/evidence", g: "/gaps", m: "/mapping", t: "/calendar", a: "/audits", p: "/policies" };
        const to = map[e.key.toLowerCase()];
        if (to) router.push(to);
        gPressed.current = 0;
      }
    };
    window.addEventListener("sk:command", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("sk:command", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [router, setTheme, toggleSidebar]);

  const controlHits = useMemo(() => {
    if (q.trim().length < 2) return [];
    const s = q.toLowerCase();
    return Object.values(controls)
      .filter((c) => c.code.toLowerCase().includes(s) || c.title.toLowerCase().includes(s))
      .slice(0, 8);
  }, [q, controls]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <DialogContent title="Command menu" className="top-[16%] max-w-[600px] translate-y-0 [&>div:first-child]:hidden">
        <Command label="Command menu" loop className="flex max-h-[min(460px,70dvh)] flex-col">
          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <Search className="size-4 text-faint" />
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="Search clients, controls, pages or actions"
              className="h-12 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
            />
            <Kbd>Esc</Kbd>
          </div>
          <Command.List className="min-h-0 flex-1 overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint">
            <Command.Empty className="py-10 text-center text-[13px] text-muted">Nothing matches &ldquo;{q}&rdquo;.</Command.Empty>

            {controlHits.length > 0 && (
              <Command.Group heading="Controls">
                {controlHits.map((c) => {
                  const e = engagements.find((x) => x.id === c.engagementId)!;
                  const client = clients.find((x) => x.id === c.clientId)!;
                  return (
                    <Command.Item key={c.id} value={`${c.code} ${c.title} ${c.id}`} onSelect={() => go(`/clients/${c.clientId}/${e.framework}?control=${c.id}`)} className={itemCls}>
                      <StatusIcon status={c.status} />
                      <span className="font-mono text-[12px] text-muted">{c.code}</span>
                      <span className="flex-1 truncate">{c.title}</span>
                      <span className="text-[12px] text-faint">{client.name} · {FRAMEWORKS[e.framework].short}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            <Command.Group heading="Clients">
              {clients.map((c) => (
                <Command.Item key={c.id} value={`client ${c.name} ${c.industry}`} onSelect={() => go(`/clients/${c.id}`)} className={itemCls}>
                  <ClientMark name={c.name} hue={c.hue} size="sm" className="!size-5 !rounded-[5px] !text-[8px]" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[12px] text-faint">{c.industry}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Go to">
              {NAV.map((n) => (
                <Command.Item key={n.href} value={`page ${n.label}`} onSelect={() => go(n.href)} className={itemCls}>
                  <n.icon />
                  <span className="flex-1">{n.label}</span>
                  {(n as { kbd?: string }).kbd && (
                    <span className="flex gap-1">
                      {(n as { kbd?: string }).kbd!.split(" ").map((k) => <Kbd key={k}>{k}</Kbd>)}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item value="toggle theme dark light" onSelect={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setOpen(false); }} className={itemCls}>
                {resolvedTheme === "dark" ? <Sun /> : <Moon />}
                <span className="flex-1">Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme</span>
                <Kbd>Ctrl J</Kbd>
              </Command.Item>
              {clients.slice(0, 3).map((c) => (
                <Command.Item key={c.id} value={`view as client ${c.name}`} onSelect={() => { setViewAs(c.id); go("/portal"); }} className={itemCls}>
                  <ArrowLeftRight />
                  <span className="flex-1">View as client: {c.contacts[0].name}, {c.name}</span>
                </Command.Item>
              ))}
              <Command.Item value="new client onboard" onSelect={() => { setOpen(false); window.dispatchEvent(new CustomEvent("sk:new-client")); }} className={itemCls}>
                <Building2 />
                <span className="flex-1">Onboard a new client</span>
              </Command.Item>
              <Command.Item value="ask assistant ai" onSelect={() => { setOpen(false); window.dispatchEvent(new CustomEvent("sk:assistant")); }} className={itemCls}>
                <Sparkles />
                <span className="flex-1">Ask the assistant</span>
                <Kbd>Ctrl /</Kbd>
              </Command.Item>
              <Command.Item value="smart upload file evidence auto" onSelect={() => { setOpen(false); window.dispatchEvent(new CustomEvent("sk:smart-upload")); }} className={itemCls}>
                <Wand2 />
                <span className="flex-1">Smart upload: file evidence automatically</span>
              </Command.Item>
              <Command.Item value="reset demo data" onSelect={() => { reset(); setOpen(false); toast.success("Demo data reset"); }} className={itemCls}>
                <RefreshCcw />
                <span className="flex-1">Reset demo data</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center gap-4 border-t border-line bg-raised px-4 py-2 text-[11.5px] text-faint">
            <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
            <span className="flex items-center gap-1.5"><Kbd><CornerDownLeft className="size-3" /></Kbd> to open</span>
            <span className="ml-auto">Tip: type a control code such as CC6.1</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
