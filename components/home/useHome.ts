"use client";

import { useMemo } from "react";
import { forecast } from "@/lib/ai";
import { FRAMEWORKS } from "@/lib/catalog";
import { useGreeting, useReady } from "@/lib/hooks";
import { ME } from "@/lib/mock/seed";
import { progressOf, usePerson, useStore } from "@/lib/store";
import type { Client, Control, Engagement } from "@/lib/types";
import { daysUntil } from "@/lib/utils";

export type Health = "ready" | "ok" | "risk" | "late" | "early";

export type EngRow = {
  e: Engagement;
  client: Client;
  cs: Control[];
  pct: number;
  days: number;
  slack: number;
  projected: string;
  health: Health;
  href: string;
};

/** Illustrative weekly trend ending at the live value. */
export const trend = (v: number, f: number[]) => f.map((x) => Math.round(v * x));

export const HEALTH: Record<Health, { label: string; tone: "ok" | "warn" | "bad" | "neutral" }> = {
  ready: { label: "Ready", tone: "ok" },
  ok: { label: "On track", tone: "ok" },
  risk: { label: "At risk", tone: "warn" },
  late: { label: "Late", tone: "bad" },
  early: { label: "Too early", tone: "neutral" },
};

/** Everything the Home layouts show, derived once from the store. */
export function useHome() {
  const ready = useReady();
  const greeting = useGreeting();
  const controls = useStore((s) => s.controls);
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const gaps = useStore((s) => s.gaps);
  const members = useStore((s) => s.members);
  const activity = useStore((s) => s.activity);
  const person = usePerson();

  const d = useMemo(() => {
    const list = Object.values(controls);
    const waiting = list.filter((c) => c.status === "review" && c.approvals.reviewed).sort((a, b) => a.approvals.reviewed!.at.localeCompare(b.approvals.reviewed!.at));
    const qa = list.filter((c) => c.status === "review" && !c.approvals.reviewed);
    const revise = list.filter((c) => c.status === "revise");
    const overdue = list.filter((c) => c.status !== "approved" && daysUntil(c.due) < 0);
    const week = list.filter((c) => c.status !== "approved" && daysUntil(c.due) >= 0 && daysUntil(c.due) <= 7).sort((a, b) => a.due.localeCompare(b.due));
    const approvedWeek = list.filter((c) => c.approvals.approved && daysUntil(c.approvals.approved.at) >= -7).length;
    const openGaps = gaps.filter((g) => g.status !== "closed");
    const critical = openGaps.filter((g) => g.severity === "critical").length;
    const soon = engagements.filter((e) => daysUntil(e.target) >= 0 && daysUntil(e.target) <= 30);

    const active = engagements.filter((e) => clients.find((c) => c.id === e.clientId)?.stage !== "certified");
    const rows: EngRow[] = active.map((e) => {
      const client = clients.find((c) => c.id === e.clientId)!;
      const cs = list.filter((c) => c.engagementId === e.id);
      const f = forecast(cs, e, client.startedAt);
      const health: Health = f.done >= f.total ? "ready" : f.early ? "early" : f.slack >= 0 ? "ok" : f.slack >= -30 ? "risk" : "late";
      return { e, client, cs, pct: progressOf(cs).pct, days: daysUntil(e.target), slack: f.slack, projected: f.projected, health, href: `/clients/${client.id}/${e.framework}` };
    });

    const load = members
      .filter((m) => ["lead", "consultant"].includes(m.role))
      .map((m) => ({ m, open: list.filter((c) => c.ownerId === m.id && c.status !== "approved" && c.status !== "not_started").length }))
      .sort((a, b) => b.open - a.open);

    const viz = rows
      .map((r) => ({ id: r.e.id, href: r.href, label: r.client.name, sub: FRAMEWORKS[r.e.framework].short, hue: r.client.hue, pct: r.pct }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 7);

    return { list, waiting, qa, revise, overdue, week, approvedWeek, openGaps, critical, soon, rows, load, viz, activeClients: new Set(active.map((e) => e.clientId)).size };
  }, [controls, gaps, engagements, clients, members]);

  const me = members.find((m) => m.id === ME);
  const clientOf = (id: string) => clients.find((c) => c.id === id)!;
  const engOf = (id: string) => engagements.find((e) => e.id === id)!;
  const controlHref = (c: Control) => `/clients/${c.clientId}/${engOf(c.engagementId).framework}?control=${c.id}`;

  return { ready, greeting, me, d, activity, person, clientOf, engOf, controlHref };
}

export type HomeData = ReturnType<typeof useHome>;
