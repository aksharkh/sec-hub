"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FRAMEWORKS, STATUS, unifiedFor } from "./catalog";
import { generate, ME, type Dataset } from "./mock/seed";
import type { Activity, ActivityKind, Automation, Client, Control, ControlStatus, Engagement, FileKind, FrameworkKey, Gap, PbcItem, Policy, Risk } from "./types";
import { uid } from "./utils";

type UI = {
  ready: boolean;
  viewAs: string | null;
  sidebarCollapsed: boolean;
};

type Actions = {
  init: () => void;
  reset: () => void;
  setStatus: (id: string, status: ControlStatus, by?: string) => void;
  qaPass: (id: string) => void;
  approve: (id: string, handoffTo?: string, note?: string) => void;
  sendBack: (id: string, reason: string) => void;
  assign: (ids: string[], ownerId: string) => void;
  bulkStatus: (ids: string[], status: ControlStatus) => void;
  setDue: (id: string, due: string) => void;
  addComment: (id: string, body: string, internal: boolean, by?: string) => void;
  upload: (id: string, files: { name: string; kind: FileKind; sizeKb: number }[], by?: string) => void;
  updateGap: (id: string, patch: Partial<Gap>) => void;
  setEvidenceState: (id: string, state: "accepted" | "pending" | "rejected") => void;
  submitRequest: (requestId: string, files: { name: string; kind: FileKind; sizeKb: number }[]) => void;
  requestEvidence: (controlId: string, title: string, note: string, dueDays: number) => void;
  fileTo: (controlIds: string[], file: { name: string; kind: FileKind; sizeKb: number }) => void;
  readNotifications: () => void;
  publish: (clientId: string) => void;
  setViewAs: (clientId: string | null) => void;
  toggleSidebar: () => void;
  addClient: (input: NewClient) => string;
  updatePolicy: (id: string, patch: Partial<Policy>) => void;
  publishPolicy: (id: string, note: string) => void;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  updatePbc: (auditId: string, pbcId: string, patch: Partial<PbcItem>) => void;
  toggleAutomation: (id: string) => void;
  addAutomation: (a: Omit<Automation, "id" | "runs">) => void;
  setIntegration: (id: string, connected: boolean) => void;
};

export type NewClient = {
  name: string;
  industry: string;
  hq: string;
  frameworks: FrameworkKey[];
  ownerId: string;
  team: string[];
  trustPlan: boolean;
  contact: { name: string; title: string; email: string };
  targetDays: number;
};

export type Store = Dataset & UI & Actions;

const empty: Dataset = { members: [], clients: [], engagements: [], controls: {}, evidence: {}, gaps: [], activity: [], requests: [], notifications: [], policies: [], risks: [], audits: [], automations: [], integrations: [], auditEvents: [] };

const now = () => new Date().toISOString();

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Update one control and record what happened. */
      const touch = (id: string, fn: (c: Control) => Partial<Control>, log?: { kind: ActivityKind; text: string; history: string; by?: string }) => {
        set((s) => {
          const c = s.controls[id];
          if (!c) return s;
          const by = log?.by ?? ME;
          const next: Control = { ...c, ...fn(c) };
          if (log) next.history = [...c.history, { at: now(), by, text: log.history }];
          const activity: Activity[] = log
            ? [{ id: uid("a"), at: now(), by, kind: log.kind, clientId: c.clientId, controlId: id, text: log.text }, ...s.activity]
            : s.activity;
          return { controls: { ...s.controls, [id]: next }, activity };
        });
      };
      const label = (c: Control) => {
        const e = get().engagements.find((x) => x.id === c.engagementId);
        return `${e ? FRAMEWORKS[e.framework].short + " " : ""}${c.code}`;
      };

      return {
        ...empty,
        ready: false,
        viewAs: null,
        sidebarCollapsed: false,

        init: () => {
          if (get().clients.length === 0) set({ ...generate() });
          set({ ready: true });
        },
        reset: () => set({ ...generate(), viewAs: null }),

        setStatus: (id, status, by) => {
          const c = get().controls[id];
          if (!c || c.status === status) return;
          touch(
            id,
            (c) => ({
              status,
              approvals: {
                prepared: status === "review" || status === "approved" ? c.approvals.prepared ?? { by: by ?? ME, at: now() } : status === "revise" ? c.approvals.prepared : null,
                reviewed: status === "approved" ? c.approvals.reviewed ?? { by: by ?? ME, at: now() } : status === "review" ? c.approvals.reviewed : null,
                approved: status === "approved" ? { by: by ?? ME, at: now() } : null,
              },
              reviseReason: status === "revise" ? c.reviseReason ?? "Sent back from the board." : undefined,
            }),
            { kind: status === "approved" ? "approve" : status === "revise" ? "revise" : "status", text: `moved ${label(c)} to ${STATUS[status].label}`, history: `Moved to ${STATUS[status].label}`, by },
          );
        },

        qaPass: (id) => {
          const c = get().controls[id];
          if (!c) return;
          touch(id, (c) => ({ approvals: { ...c.approvals, reviewed: { by: ME, at: now() } } }), {
            kind: "status", text: `passed QA review on ${label(c)}`, history: "QA review passed",
          });
        },

        approve: (id, handoffTo, note) => {
          const c = get().controls[id];
          if (!c) return;
          const to = handoffTo ? get().members.find((m) => m.id === handoffTo) : undefined;
          touch(
            id,
            (c) => ({
              status: "approved",
              approvals: {
                prepared: c.approvals.prepared ?? { by: c.ownerId, at: now() },
                reviewed: c.approvals.reviewed ?? { by: ME, at: now() },
                approved: { by: ME, at: now() },
              },
              ownerId: handoffTo ?? c.ownerId,
              reviseReason: undefined,
            }),
            { kind: "approve", text: `approved ${label(c)}${to ? ` and handed it to ${to.name}` : ""}`, history: `Approved${to ? ` · handed to ${to.name}${note ? `: ${note}` : ""}` : ""}` },
          );
        },

        sendBack: (id, reason) => {
          const c = get().controls[id];
          if (!c) return;
          touch(id, (c) => ({ status: "revise", reviseReason: reason, approvals: { ...c.approvals, reviewed: null, approved: null } }), {
            kind: "revise", text: `sent ${label(c)} back for revision`, history: `Sent back for revision: ${reason}`,
          });
        },

        assign: (ids, ownerId) => {
          const who = get().members.find((m) => m.id === ownerId)?.name ?? "someone";
          ids.forEach((id) => touch(id, () => ({ ownerId }), { kind: "assign", text: `assigned ${label(get().controls[id])} to ${who}`, history: `Assigned to ${who}` }));
        },

        bulkStatus: (ids, status) => ids.forEach((id) => get().setStatus(id, status)),

        setDue: (id, due) => touch(id, () => ({ due }), { kind: "status", text: `changed the due date of ${label(get().controls[id])}`, history: "Due date changed" }),

        addComment: (id, body, internal, by) => {
          const c = get().controls[id];
          if (!c) return;
          const author = by ?? ME;
          touch(id, (c) => ({ comments: [...c.comments, { id: uid("cm"), at: now(), by: author, body, internal }] }), {
            kind: "comment", text: `commented on ${label(c)}`, history: internal ? "Added an internal note" : "Added a comment", by: author,
          });
        },

        upload: (id, files, by) => {
          const s = get();
          const c = s.controls[id];
          if (!c) return;
          const author = by ?? ME;
          // Evidence is shared with every control in this client mapped to the same unified control.
          const siblings = Object.values(s.controls).filter((x) => x.clientId === c.clientId && x.unifiedId === c.unifiedId).map((x) => x.id);
          const created = files.map((f) => ({
            id: uid("ev"), clientId: c.clientId, name: f.name.replace(/\.[^.]+$/, ""), kind: f.kind, sizeKb: f.sizeKb,
            uploadedBy: author, uploadedAt: now(), version: 1, controlIds: siblings,
            source: author.startsWith("client:") ? ("client" as const) : ("internal" as const), state: "pending" as const,
          }));
          set((s) => {
            const evidence = { ...s.evidence };
            created.forEach((e) => (evidence[e.id] = e));
            const controls = { ...s.controls };
            siblings.forEach((sid) => (controls[sid] = { ...controls[sid], evidenceIds: [...controls[sid].evidenceIds, ...created.map((e) => e.id)] }));
            return { evidence, controls };
          });
          touch(id, () => ({}), {
            kind: "upload", text: `uploaded ${files.length === 1 ? files[0].name : `${files.length} files`} to ${label(c)}`,
            history: `Uploaded ${files.map((f) => f.name).join(", ")}${siblings.length > 1 ? ` (also linked to ${siblings.length - 1} mapped control${siblings.length > 2 ? "s" : ""})` : ""}`, by: author,
          });
        },

        setEvidenceState: (id, state) => set((s) => (s.evidence[id] ? { evidence: { ...s.evidence, [id]: { ...s.evidence[id], state } } } : s)),

        updateGap: (id, patch) => set((s) => ({ gaps: s.gaps.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

        submitRequest: (requestId, files) => {
          const rq = get().requests.find((r) => r.id === requestId);
          if (!rq) return;
          get().upload(rq.controlId, files, `client:${rq.clientId}:0`);
          set((s) => ({ requests: s.requests.map((r) => (r.id === requestId ? { ...r, status: "submitted" } : r)) }));
          if (get().controls[rq.controlId]?.status === "client") get().setStatus(rq.controlId, "in_progress", `client:${rq.clientId}:0`);
        },

        requestEvidence: (controlId, title, note, dueDays) => {
          const c = get().controls[controlId];
          if (!c) return;
          set((s) => ({
            requests: [{ id: uid("rq"), clientId: c.clientId, controlId, title, note, due: new Date(Date.now() + dueDays * 864e5).toISOString(), status: "open" }, ...s.requests],
          }));
          if (c.status !== "client") get().setStatus(controlId, "client");
        },

        fileTo: (controlIds, f) => {
          const s = get();
          if (!controlIds.length) return;
          const first = s.controls[controlIds[0]];
          // One file, linked to every chosen control and to their twins in the client's other frameworks.
          const ids = new Set<string>();
          controlIds.forEach((cid) => {
            const c = s.controls[cid];
            if (!c) return;
            Object.values(s.controls).forEach((x) => { if (x.clientId === c.clientId && x.unifiedId === c.unifiedId) ids.add(x.id); });
          });
          const ev = {
            id: uid("ev"), clientId: first.clientId, name: f.name.replace(/\.[^.]+$/, ""), kind: f.kind, sizeKb: f.sizeKb,
            uploadedBy: ME, uploadedAt: now(), version: 1, controlIds: [...ids], source: "internal" as const, state: "pending" as const,
          };
          set((st) => {
            const controls = { ...st.controls };
            ids.forEach((cid) => (controls[cid] = { ...controls[cid], evidenceIds: [...controls[cid].evidenceIds, ev.id] }));
            return {
              evidence: { ...st.evidence, [ev.id]: ev },
              controls,
              activity: [{ id: uid("a"), at: now(), by: ME, kind: "upload", clientId: first.clientId, controlId: first.id, text: `filed ${f.name} to ${ids.size} controls with Smart filing` }, ...st.activity],
            };
          });
        },

        readNotifications: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

        publish: (clientId) => {
          const c = get().clients.find((x) => x.id === clientId);
          if (!c) return;
          set((s) => ({
            clients: s.clients.map((x) => (x.id === clientId ? { ...x, publishedAt: now() } : x)),
            activity: [{ id: uid("a"), at: now(), by: ME, kind: "publish", clientId, text: `published ${c.name} to SecureKnots Trust` }, ...s.activity],
          }));
        },

        addClient: (input) => {
          const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
          const id = get().clients.some((c) => c.id === base) ? `${base}-${Date.now() % 1000}` : base;
          const t = Date.now();
          const iso = (d: number) => new Date(t + d * 864e5).toISOString();
          const engagements: Engagement[] = input.frameworks.map((fw) => ({
            id: `${id}-${fw}`, clientId: id, framework: fw, label: FRAMEWORKS[fw].name, target: iso(input.targetDays), auditor: "To be selected by the client",
          }));
          const controls: Record<string, Control> = {};
          engagements.forEach((e) =>
            unifiedFor(e.framework).forEach((u, i) => {
              const cid = `${e.id}-${u.id}`;
              controls[cid] = {
                id: cid, engagementId: e.id, clientId: id, unifiedId: u.id, code: u.map[e.framework]!, title: u.title, summary: u.summary, domain: u.domain,
                status: "not_started", ownerId: input.ownerId, reviewerId: "m_fatima", due: iso(21 + (i % 6) * 7), evidenceIds: [],
                approvals: { prepared: null, reviewed: null, approved: null }, comments: [], history: [{ at: now(), by: ME, text: `Added from the unified library as ${u.map[e.framework]}` }], order: i,
              };
            }),
          );
          const client: Client = {
            id, name: input.name, industry: input.industry, hq: input.hq, hue: Math.floor(Math.random() * 360), stage: "onboarding",
            ownerId: input.ownerId, team: Array.from(new Set([input.ownerId, ...input.team])), trustPlan: input.trustPlan,
            contacts: [input.contact], startedAt: now(), engagementIds: engagements.map((e) => e.id),
          };
          set((s) => ({
            clients: [client, ...s.clients],
            engagements: [...s.engagements, ...engagements],
            controls: { ...s.controls, ...controls },
            activity: [{ id: uid("a"), at: now(), by: ME, kind: "status", clientId: id, text: `onboarded ${input.name} with ${input.frameworks.map((f) => FRAMEWORKS[f].short).join(", ")}` }, ...s.activity],
          }));
          return id;
        },

        updatePolicy: (id, patch) => set((s) => ({ policies: s.policies.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
        publishPolicy: (id, note) =>
          set((s) => ({
            policies: s.policies.map((p) => {
              if (p.id !== id) return p;
              const [maj, min] = p.version.split(".").map(Number);
              const v = p.status === "approved" ? `${maj}.${min + 1}` : `${maj}.${min}`;
              return { ...p, version: v, status: "approved", updatedAt: now(), ackRate: 0, versions: [{ v, at: now(), by: ME, note }, ...p.versions] };
            }),
          })),
        updateRisk: (id, patch) => set((s) => ({ risks: s.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
        updatePbc: (auditId, pbcId, patch) =>
          set((s) => ({ audits: s.audits.map((a) => (a.id === auditId ? { ...a, pbc: a.pbc.map((p) => (p.id === pbcId ? { ...p, ...patch } : p)) } : a)) })),
        toggleAutomation: (id) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),
        addAutomation: (a) => set((s) => ({ automations: [{ ...a, id: uid("au"), runs: 0 }, ...s.automations] })),
        setIntegration: (id, connected) =>
          set((s) => ({ integrations: s.integrations.map((i) => (i.id === id ? { ...i, connected, lastSync: connected ? now() : undefined, items: connected ? Math.max(i.items, 8 + i.collects.length * 6) : 0 } : i)) })),

        setViewAs: (viewAs) => set({ viewAs }),
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      };
    },
    {
      name: "sk-workspace-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ ready: _ready, ...rest }) => {
        void _ready;
        const data: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== "function") data[k] = v;
        return data as Partial<Store>;
      },
    },
  ),
);

/* ───────── selectors & helpers ───────── */

export type Person = { id: string; name: string; title: string; hue: number; client?: boolean };

export function usePerson() {
  const members = useStore((s) => s.members);
  const clients = useStore((s) => s.clients);
  return (id: string): Person => {
    if (id.startsWith("client:")) {
      const [, cid, idx] = id.split(":");
      const c = clients.find((x) => x.id === cid);
      const ct = c?.contacts[Number(idx)];
      return { id, name: ct?.name ?? "Client", title: ct ? `${ct.title}, ${c!.name}` : "Client", hue: c?.hue ?? 210, client: true };
    }
    const m = members.find((x) => x.id === id);
    return m ? { id, name: m.name, title: m.title, hue: m.hue } : { id, name: "Unknown", title: "", hue: 210 };
  }
}

export function progressOf(cs: Control[]) {
  const done = cs.filter((c) => c.status === "approved").length;
  return { done, total: cs.length, pct: cs.length ? Math.round((done / cs.length) * 100) : 0 };
}
