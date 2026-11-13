"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Avatar, ClientMark } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const viewAs = useStore((s) => s.viewAs);
  const clients = useStore((s) => s.clients);
  const setViewAs = useStore((s) => s.setViewAs);
  const { resolvedTheme, setTheme } = useTheme();
  const client = clients.find((c) => c.id === (viewAs ?? "northwind"));

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="flex items-center justify-center gap-3 bg-ink px-4 py-2 text-[12.5px] text-surface">
        <span className="truncate">
          You are viewing the client dashboard as <b className="font-semibold">{client?.contacts[0].name ?? "client"}</b>{client ? `, ${client.name}` : ""}. Internal notes and other clients are hidden.
        </span>
        <button
          onClick={() => { setViewAs(null); router.push(client ? `/clients/${client.id}` : "/"); }}
          className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-medium transition-colors hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
        >
          <ArrowLeft className="size-3.5" /> Back to Workspace
        </button>
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 md:px-6">
          {client ? <ClientMark name={client.name} hue={client.hue} size="md" /> : <span className="skeleton size-8 rounded-lg" />}
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-semibold text-ink">{client?.name ?? " "}</p>
            <p className="flex items-center gap-1 text-[11.5px] text-muted">
              Compliance workspace with <SecureKnotsLogo className="h-3" /> SecureKnots
            </p>
          </div>
          <nav className="ml-6 hidden items-center gap-1 text-[13px] md:flex">
            {["Overview", "Requests", "Gaps", "Messages"].map((l, i) => (
              <Link key={l} href={`#${l.toLowerCase()}`} className={i === 0 ? "rounded-lg bg-subtle px-3 py-1.5 font-medium text-ink" : "rounded-lg px-3 py-1.5 text-muted hover:bg-subtle hover:text-ink"}>{l}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell /></Button>
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun /> : <Moon />}</Button>
            {client && <Avatar person={{ name: client.contacts[0].name, hue: client.hue, client: true }} size="md" className="ml-1" />}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
