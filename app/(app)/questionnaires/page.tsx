"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, FileSpreadsheet, Pencil, Sparkles, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ClientMark } from "@/components/ui/avatar";
import { Code } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, Textarea } from "@/components/ui/form";
import { Card, PageHeader, ProgressRing } from "@/components/ui/misc";
import { useStore } from "@/lib/store";
import { cn, dayLabel, inDays } from "@/lib/utils";

type Q = { id: string; section: string; q: string; uc: string; a: string; conf: number; source: string };

const BANK: Omit<Q, "id">[] = [
  { section: "Access", q: "Is multi-factor authentication required for all remote and administrative access?", uc: "UC-ACC-02", a: "Yes. MFA is enforced for every workforce and administrative login through the identity provider; administrators use phishing-resistant security keys.", conf: 97, source: "Okta MFA policy export" },
  { section: "Access", q: "How often are user access rights reviewed?", uc: "UC-ACC-03", a: "Quarterly. System owners certify every user's access, and removals are completed within five business days of the review.", conf: 95, source: "Quarterly access review - AWS" },
  { section: "Access", q: "How quickly is access removed when an employee leaves?", uc: "UC-ACC-01", a: "Within one business day of the termination date, triggered from the HR system.", conf: 91, source: "Joiner-mover-leaver procedure" },
  { section: "Data", q: "Is customer data encrypted at rest? Describe the algorithm and key management.", uc: "UC-CRY-01", a: "Yes. AES-256 with keys managed in AWS KMS, rotated annually; backups are encrypted with separate keys.", conf: 94, source: "KMS key rotation settings" },
  { section: "Data", q: "Is data encrypted in transit?", uc: "UC-CRY-02", a: "Yes. TLS 1.2 or higher is enforced on all external and internal endpoints; older protocols are disabled.", conf: 96, source: "TLS configuration scan" },
  { section: "Data", q: "Do you classify data by sensitivity?", uc: "UC-AST-02", a: "Yes. Four levels (Public, Internal, Confidential, Restricted) with handling rules for each.", conf: 88, source: "Data classification standard" },
  { section: "Operations", q: "Are security logs centrally collected and retained? For how long?", uc: "UC-OPS-01", a: "Yes. Logs from all production systems are centralized and kept for 12 months.", conf: 82, source: "CloudTrail retention settings" },
  { section: "Operations", q: "How often do you scan for vulnerabilities, and what are your remediation timelines?", uc: "UC-OPS-03", a: "Authenticated scans run monthly. Critical findings are fixed within 15 days and high within 30 days.", conf: 93, source: "Vulnerability scan - October" },
  { section: "Operations", q: "When was your last independent penetration test?", uc: "UC-OPS-04", a: "Within the last 12 months, covering the external surface and core application, with retesting of findings.", conf: 90, source: "Penetration test report 2026" },
  { section: "Change", q: "Are code changes peer reviewed before release to production?", uc: "UC-CHG-01", a: "Yes. Branch protection requires an approving review and passing checks on every production repository.", conf: 89, source: "GitHub branch protection settings" },
  { section: "Resilience", q: "Do you test backup restoration? How often?", uc: "UC-BCP-01", a: "Yes, quarterly, with recorded restore times.", conf: 78, source: "Restore test evidence - Q3" },
  { section: "Resilience", q: "Do you have a business continuity and disaster recovery plan that is tested annually?", uc: "UC-BCP-02", a: "Yes. Recovery objectives are defined per service and the plan is exercised at least once a year.", conf: 84, source: "Disaster recovery plan" },
  { section: "Incidents", q: "Do you have a documented incident response plan? When was it last tested?", uc: "UC-INR-01", a: "Yes. The plan defines roles and severity levels and is tested with a tabletop exercise every year.", conf: 87, source: "Incident response plan" },
  { section: "Incidents", q: "Within what time would you notify us of a breach affecting our data?", uc: "UC-INR-02", a: "Within 72 hours of confirming a breach, or sooner where the contract or law requires.", conf: 71, source: "Breach notification playbook" },
  { section: "Vendors", q: "How do you assess the security of your own vendors and sub-processors?", uc: "UC-VEN-01", a: "Vendors handling sensitive data are reviewed before onboarding and annually, using their SOC 2 reports or questionnaires.", conf: 86, source: "Sub-processor review 2026" },
  { section: "People", q: "Do employees complete security awareness training?", uc: "UC-HR-01", a: "Yes, at hire and annually, with phishing simulations; completion is tracked per person.", conf: 92, source: "Training completion report" },
  { section: "People", q: "Are background checks performed on employees with access to customer data?", uc: "UC-HR-02", a: "Yes, before access is granted, where local law allows.", conf: 74, source: "Background check attestation" },
  { section: "Governance", q: "Do you hold a current SOC 2 Type II report or ISO 27001 certificate?", uc: "UC-GOV-03", a: "A SOC 2 Type II examination is in progress with an independent CPA firm; the report will be shared under NDA once issued.", conf: 66, source: "Engagement status" },
  { section: "Governance", q: "Is there a named person responsible for information security?", uc: "UC-GOV-02", a: "Yes. The Head of Security owns the program and reports to leadership quarterly.", conf: 90, source: "Org chart with security roles" },
  { section: "Privacy", q: "How do you handle requests from individuals to access or delete their personal data?", uc: "UC-PRV-02", a: "Requests are verified and answered within legal deadlines, and every request is logged.", conf: 81, source: "DSAR log" },
];

const QUESTIONNAIRES = [
  { id: "q1", from: "Acme Federal Credit Union", kind: "Vendor security assessment (SIG Lite excerpt)", clientId: "kestrel", due: 6 },
  { id: "q2", from: "Federal Grants Office (sample agency)", kind: "Cloud security questionnaire (CAIQ excerpt)", clientId: "northwind", due: 11 },
  { id: "q3", from: "Mercy Regional Hospital", kind: "Third-party risk questionnaire", clientId: "helio", due: 3 },
];

type Row = Q & { state: "pending" | "answered" | "review" | "approved" };

export default function QuestionnairesPage() {
  const clients = useStore((s) => s.clients);
  const [sel, setSel] = useState("q1");
  const [rows, setRows] = useState<Record<string, Row[]>>({});
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"all" | "review" | "approved">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const qn = QUESTIONNAIRES.find((x) => x.id === sel)!;
  const client = clients.find((c) => c.id === qn.clientId);
  const list = rows[sel] ?? BANK.map((b, i) => ({ ...b, id: `${sel}-${i}`, state: "pending" as const }));

  const run = () => {
    const id = sel;
    const base = list;
    const queue = base.filter((r) => r.state === "pending");
    if (!queue.length) return;
    setRunning(true);
    let k = 0;
    const t = setInterval(() => {
      const q = queue[k++];
      setRows((r) => ({ ...r, [id]: (r[id] ?? base).map((x) => (x.id === q.id ? { ...x, state: x.conf >= 80 ? "answered" : "review" } : x)) }));
      if (k >= queue.length) {
        clearInterval(t);
        setRunning(false);
        const auto = queue.filter((x) => x.conf >= 80).length;
        toast.success(`${auto} of ${queue.length} answered automatically`, { description: `${queue.length - auto} flagged for a person to review. About ${((auto * 27) / 60).toFixed(1)} hours saved.` });
      }
    }, 140);
  };

  const counts = useMemo(() => ({ done: list.filter((r) => r.state !== "pending").length, review: list.filter((r) => r.state === "review").length, approved: list.filter((r) => r.state === "approved").length }), [list]);
  const shown = list.filter((r) => (tab === "all" ? true : tab === "review" ? r.state === "review" : r.state === "approved"));
  const update = (id: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [sel]: list.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader
        title="Questionnaire autopilot"
        description="Clients' customers send security questionnaires before they sign. Autopilot answers them from the client's approved controls, policies and evidence, cites the source for every answer, and flags anything uncertain for a person."
        actions={<Button variant="secondary" onClick={() => toast("Upload a questionnaire", { description: "Excel, Word or PDF. Questions are extracted and matched to the control library." })}><Upload /> Upload questionnaire</Button>}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-2">
          {QUESTIONNAIRES.map((x) => {
            const c = clients.find((k) => k.id === x.clientId);
            const r = rows[x.id];
            const p = r ? Math.round((r.filter((y) => y.state !== "pending").length / r.length) * 100) : 0;
            return (
              <button key={x.id} onClick={() => { setSel(x.id); setTab("all"); }} className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors", sel === x.id ? "border-ink bg-surface shadow-sm" : "border-line hover:border-line-strong hover:bg-surface")}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted"><FileSpreadsheet className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{x.from}</span>
                  <span className="block truncate text-[12px] text-muted">{x.kind}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">{c && <ClientMark name={c.name} hue={c.hue} size="sm" className="!size-4 !rounded-[4px] !text-[7px]" />}for {c?.name} · due {dayLabel(inDays(x.due))}</span>
                </span>
                <ProgressRing value={p} size={30} stroke={3} label={false} />
              </button>
            );
          })}
        </div>

        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{qn.from}</p>
              <p className="text-[12.5px] text-muted">{qn.kind} · {list.length} questions · answering as {client?.name}</p>
            </div>
            <Button variant="secondary" disabled={counts.done === 0} onClick={() => toast.success("Exported", { description: `${qn.from} questionnaire.xlsx, answers in the customer's original format.` })}><Download /> Export</Button>
            <Button variant="primary" disabled={running || counts.done === list.length} onClick={run}>
              {running ? <span className="size-3.5 animate-spin rounded-full border-2 border-on-brand/30 border-t-on-brand" /> : <Wand2 />}
              {running ? "Answering" : counts.done ? "Finished" : "Run autopilot"}
            </Button>
          </div>

          <div className="grid grid-cols-3 border-b border-line">
            {[
              ["Answered", `${counts.done - counts.review}`, "text-ok"],
              ["Needs a person", `${counts.review}`, "text-warn"],
              ["Time saved", `${(((counts.done - counts.review) * 27) / 60).toFixed(1)} h`, "text-ink"],
            ].map(([k, v, cls]) => (
              <div key={k} className="border-r border-line px-4 py-3 last:border-0">
                <p className="text-[12px] text-muted">{k}</p>
                <p className={cn("tnum mt-0.5 text-[22px] font-semibold tracking-[-0.02em]", cls)}>{v}</p>
              </div>
            ))}
          </div>

          <Tabs className="px-4" value={tab} onChange={setTab} tabs={[{ value: "all", label: "All", count: list.length }, { value: "review", label: "Needs review", count: counts.review }, { value: "approved", label: "Approved", count: counts.approved }]} />

          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {shown.map((r, i) => (
                <motion.li key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="tnum mt-0.5 w-6 shrink-0 text-[12px] text-faint">{list.indexOf(r) + 1 || i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium leading-5 text-ink">{r.q}</p>
                      {r.state === "pending" ? (
                        <div className="mt-2 h-3 w-2/3 rounded skeleton" />
                      ) : editing === r.id ? (
                        <div className="mt-2">
                          <Textarea defaultValue={r.a} autoFocus onBlur={(e) => { update(r.id, { a: e.target.value, state: "approved" }); setEditing(null); toast("Answer saved and approved"); }} />
                        </div>
                      ) : (
                        <motion.p initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">{r.a}</motion.p>
                      )}
                      {r.state !== "pending" && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                          <span className={cn("tnum flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", r.conf >= 80 ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}><Sparkles className="size-3" />{r.conf}% confident</span>
                          <span className="rounded-full border border-line px-2 py-0.5 text-muted">Source: <Code className="text-[11px]">{r.uc}</Code> · {r.source}</span>
                          <span className="rounded-full bg-subtle px-2 py-0.5 text-muted">{r.section}</span>
                          <span className="ml-auto flex gap-1">
                            {r.state !== "approved" && <Button size="xs" variant="ghost" onClick={() => setEditing(r.id)}><Pencil /> Edit</Button>}
                            {r.state !== "approved" ? (
                              <Button size="xs" variant="secondary" onClick={() => update(r.id, { state: "approved" })}><Check /> Approve</Button>
                            ) : (
                              <span className="flex items-center gap-1 font-medium text-ok"><Check className="size-3.5" />Approved</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      </div>
    </div>
  );
}
