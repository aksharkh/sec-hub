import { FRAMEWORKS, unifiedFor } from "../catalog";
import { generateModules } from "./modules";
import type {
  Activity, Audit, AuditEvent, Automation, Client, Comment, Control, ControlStatus, DomainId, Engagement, Evidence, EvidenceRequest,
  FileKind, FrameworkKey, Gap, HistoryEntry, Integration, Member, Notification, Policy, Risk, Severity, Stage,
} from "../types";

/* ───────── deterministic randomness ───────── */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ME = "m_seema";

export const MEMBERS: Member[] = [
  { id: "m_seema", name: "Seema Abdul", title: "CDO & MD", role: "admin", email: "seema.abdul@secureknots.com", hue: 222, location: "Wilmington, DE" },
  { id: "m_arjun", name: "Arjun Rao", title: "Compliance Lead", role: "lead", email: "arjun.rao@secureknots.com", hue: 196, location: "Bengaluru" },
  { id: "m_priya", name: "Priya Menon", title: "Senior Consultant", role: "consultant", email: "priya.menon@secureknots.com", hue: 330, location: "Bengaluru" },
  { id: "m_daniel", name: "Daniel Brooks", title: "Consultant", role: "consultant", email: "daniel.brooks@secureknots.com", hue: 150, location: "Wilmington, DE" },
  { id: "m_fatima", name: "Fatima Khan", title: "QA Reviewer", role: "reviewer", email: "fatima.khan@secureknots.com", hue: 270, location: "London" },
  { id: "m_rahul", name: "Rahul Verma", title: "Sales", role: "sales", email: "rahul.verma@secureknots.com", hue: 30, location: "Bengaluru" },
  { id: "m_emily", name: "Emily Carter", title: "Marketing", role: "marketing", email: "emily.carter@secureknots.com", hue: 8, location: "London" },
];

type ClientSeed = Omit<Client, "engagementIds" | "startedAt" | "publishedAt"> & {
  frameworks: FrameworkKey[];
  startedDaysAgo: number;
  targetDays: number[];
  auditors: string[];
};

const CLIENT_SEEDS: ClientSeed[] = [
  {
    id: "northwind", name: "Northwind Cloud", industry: "Government cloud SaaS", hq: "Reston, VA", hue: 214, stage: "audit",
    ownerId: "m_arjun", team: ["m_arjun", "m_daniel", "m_fatima"], trustPlan: true,
    contacts: [
      { name: "Grace Okafor", title: "Head of Security", email: "grace.okafor@northwindcloud.com" },
      { name: "Tom Lindqvist", title: "CTO", email: "tom.lindqvist@northwindcloud.com" },
    ],
    frameworks: ["fedramp", "soc2"], startedDaysAgo: 168, targetDays: [24, 52], auditors: ["FedRAMP Recognized assessor (client-selected)", "Licensed CPA firm (client-selected)"],
  },
  {
    id: "kestrel", name: "Kestrel Pay", industry: "Payments", hq: "Austin, TX", hue: 18, stage: "remediation",
    ownerId: "m_priya", team: ["m_priya", "m_fatima"], trustPlan: false,
    contacts: [{ name: "Marcus Bell", title: "VP Engineering", email: "marcus.bell@kestrelpay.com" }],
    frameworks: ["pci", "soc2"], startedDaysAgo: 96, targetDays: [61, 88], auditors: ["QSA (client-selected)", "Licensed CPA firm (client-selected)"],
  },
  {
    id: "helio", name: "Helio Health", industry: "Digital health", hq: "Boston, MA", hue: 350, stage: "readiness",
    ownerId: "m_daniel", team: ["m_daniel", "m_fatima"], trustPlan: false,
    contacts: [{ name: "Dr. Leah Morgan", title: "Chief Privacy Officer", email: "leah.morgan@heliohealth.com" }],
    frameworks: ["hipaa", "soc2"], startedDaysAgo: 41, targetDays: [104, 132], auditors: ["Third-party assessor", "Licensed CPA firm (client-selected)"],
  },
  {
    id: "lumen", name: "Lumen Analytics", industry: "AI analytics", hq: "Dublin, IE", hue: 280, stage: "remediation",
    ownerId: "m_priya", team: ["m_priya", "m_arjun", "m_fatima"], trustPlan: true,
    contacts: [{ name: "Aoife Brennan", title: "COO", email: "aoife.brennan@lumenanalytics.ie" }],
    frameworks: ["iso27001", "iso42001", "gdpr"], startedDaysAgo: 120, targetDays: [46, 74, 40], auditors: ["Accredited certification body", "Accredited certification body", "Internal readiness review"],
  },
  {
    id: "brightline", name: "Brightline Defense Systems", industry: "Defense manufacturing", hq: "Huntsville, AL", hue: 140, stage: "readiness",
    ownerId: "m_daniel", team: ["m_daniel", "m_arjun"], trustPlan: false,
    contacts: [{ name: "Ray Castillo", title: "Director of IT", email: "ray.castillo@brightlinedefense.com" }],
    frameworks: ["cmmc"], startedDaysAgo: 58, targetDays: [140], auditors: ["C3PAO (client-selected)"],
  },
  {
    id: "vantage", name: "Vantage Learning", industry: "EdTech", hq: "Pune, IN", hue: 36, stage: "onboarding",
    ownerId: "m_arjun", team: ["m_arjun", "m_priya"], trustPlan: false,
    contacts: [{ name: "Neha Kulkarni", title: "Head of Product", email: "neha.kulkarni@vantagelearning.in" }],
    frameworks: ["dpdpa", "iso27001"], startedDaysAgo: 9, targetDays: [150, 190], auditors: ["Internal readiness review", "Accredited certification body"],
  },
  {
    id: "orbit", name: "Orbit HR", industry: "HR software", hq: "London, UK", hue: 196, stage: "certified",
    ownerId: "m_priya", team: ["m_priya", "m_fatima"], trustPlan: true,
    contacts: [{ name: "James Whitfield", title: "CISO", email: "james.whitfield@orbithr.co.uk" }],
    frameworks: ["soc2", "gdpr"], startedDaysAgo: 260, targetDays: [-34, -40], auditors: ["Licensed CPA firm (client-selected)", "Internal readiness review"],
  },
  {
    id: "arcadia", name: "Arcadia Freight", industry: "Logistics", hq: "Rotterdam, NL", hue: 160, stage: "certified",
    ownerId: "m_arjun", team: ["m_arjun"], trustPlan: false,
    contacts: [{ name: "Pieter de Vries", title: "IT Manager", email: "pieter.devries@arcadiafreight.nl" }],
    frameworks: ["iso27001"], startedDaysAgo: 310, targetDays: [-62], auditors: ["Accredited certification body"],
  },
];

const MIX: Record<Stage, [ControlStatus, number][]> = {
  onboarding: [["not_started", 0.82], ["in_progress", 0.18]],
  readiness: [["not_started", 0.34], ["in_progress", 0.3], ["client", 0.14], ["review", 0.1], ["revise", 0.05], ["approved", 0.07]],
  remediation: [["not_started", 0.08], ["in_progress", 0.24], ["client", 0.14], ["review", 0.16], ["revise", 0.1], ["approved", 0.28]],
  audit: [["in_progress", 0.07], ["client", 0.06], ["review", 0.14], ["revise", 0.07], ["approved", 0.66]],
  certified: [["approved", 1]],
};

const EVIDENCE_POOL: Record<DomainId, [string, FileKind][]> = {
  gov: [["Information Security Policy v4.2", "docx"], ["Policy acknowledgement report", "xlsx"], ["Board minutes - security review", "pdf"], ["Org chart with security roles", "pdf"]],
  risk: [["Risk register FY26", "xlsx"], ["Risk assessment methodology", "docx"], ["Risk treatment plan", "xlsx"], ["DPIA - customer analytics", "docx"]],
  access: [["Okta MFA policy export", "png"], ["Quarterly access review - AWS", "xlsx"], ["Joiner-mover-leaver procedure", "docx"], ["Terminated users report", "csv"], ["Privileged roles listing", "csv"]],
  asset: [["Asset inventory", "xlsx"], ["MDM enrollment report", "csv"], ["Data classification standard", "docx"]],
  crypto: [["KMS key rotation settings", "png"], ["TLS configuration scan", "pdf"], ["FIPS 140-3 certificate list", "pdf"], ["RDS encryption settings", "png"]],
  ops: [["SIEM alert rules", "pdf"], ["CloudTrail retention settings", "png"], ["Vulnerability scan - October", "pdf"], ["Penetration test report 2026", "pdf"], ["Patch SLA tracker", "xlsx"]],
  change: [["GitHub branch protection settings", "png"], ["Change management procedure", "docx"], ["Sample change tickets", "zip"], ["CIS baseline benchmark", "pdf"]],
  sdlc: [["Secure SDLC standard", "docx"], ["SAST pipeline configuration", "png"], ["Threat model - payments API", "pdf"], ["Model card - forecasting v3", "pdf"]],
  vendor: [["Vendor inventory", "xlsx"], ["Vendor security questionnaire - Stripe", "pdf"], ["DPA template", "docx"], ["Sub-processor review 2026", "xlsx"]],
  ir: [["Incident response plan", "docx"], ["Tabletop exercise report", "pdf"], ["Breach notification playbook", "docx"]],
  bcdr: [["Backup job report", "csv"], ["Restore test evidence - Q3", "pdf"], ["Disaster recovery plan", "docx"]],
  hr: [["Training completion report", "xlsx"], ["Background check attestation", "pdf"], ["Signed NDA samples", "zip"]],
  physical: [["Badge access report", "csv"], ["Visitor log - HQ", "xlsx"], ["Data center SOC 2 report", "pdf"]],
  privacy: [["Privacy notice", "pdf"], ["Consent records sample", "csv"], ["DSAR log", "xlsx"], ["Retention schedule", "xlsx"], ["Transfer impact assessment", "docx"]],
  cardholder: [["Network segmentation diagram", "pdf"], ["Segmentation test results", "pdf"], ["PAN masking screenshots", "png"]],
  cui: [["CUI marking guide", "docx"], ["Media sanitization log", "xlsx"], ["Enclave boundary diagram", "pdf"]],
};

const GAP_POOL: Record<DomainId, [string, string, string][]> = {
  gov: [["Policy set last approved in 2024", "The security policy set has not been reviewed or approved by management in the last 12 months.", "Schedule a management review, update owners and version history, collect sign-off."]],
  risk: [["Risk register lacks owners for 6 risks", "Six risks above tolerance have no named owner or treatment date.", "Assign owners in the next risk committee and set target dates."]],
  access: [["MFA not enforced on 4 break-glass accounts", "Emergency admin accounts in AWS sit outside the Okta MFA policy.", "Move break-glass accounts to hardware keys, seal credentials, alert on use."], ["Access review evidence missing for September", "The Q3 review was performed but the sign-off export was not kept.", "Re-run the review in the IdP and export sign-offs with timestamps."]],
  asset: [["Laptop inventory not reconciled with MDM", "41 laptops in the asset list are missing from MDM enrollment.", "Reconcile monthly; enroll or retire the missing devices."]],
  crypto: [["Snapshot encryption disabled in us-east-2", "Two RDS snapshots in a secondary region are unencrypted.", "Re-create the snapshots with KMS encryption and enable the default."]],
  ops: [["Log retention set to 90 days", "CloudWatch log groups keep 90 days; the control requires one year.", "Raise retention to 365 days and archive to S3 Glacier."], ["Critical vulnerabilities past SLA", "Three critical findings from the October scan are older than 15 days.", "Patch or apply compensating controls and document exceptions."]],
  change: [["Direct pushes to main allowed on 2 repos", "Branch protection is off for the billing and admin-portal repositories.", "Enable required reviews and status checks on all production repos."]],
  sdlc: [["Dependency scanning not enforced on mobile app", "The mobile pipeline runs scans but does not block releases.", "Make high-severity findings a blocking check."]],
  vendor: [["No security review for 3 sub-processors", "Three sub-processors handling personal data were onboarded without review.", "Collect SOC 2 reports or questionnaires and update the vendor inventory."]],
  ir: [["No tabletop exercise in the last 12 months", "The incident response plan has not been exercised since 2025.", "Run a tabletop with engineering and leadership; record lessons learned."]],
  bcdr: [["Restore test not documented since March", "Backups run nightly but no restore test was recorded for two quarters.", "Run a restore test and keep screenshots and timings."]],
  hr: [["11 staff overdue on annual training", "Training completion is 86% against a 100% target.", "Send reminders, escalate to managers after 7 days."]],
  physical: [["Visitor log not kept for server room", "Visitor entries for the equipment room are not retained.", "Move to a badge-linked visitor system with 12-month retention."]],
  privacy: [["Retention schedule missing for support tickets", "Support tickets with personal data have no retention period.", "Define a 24-month retention and automate deletion in the helpdesk."]],
  cardholder: [["Segmentation test older than 6 months", "The last segmentation test was completed in April.", "Book the semi-annual segmentation test with the testing team."]],
  cui: [["CUI markings missing on engineering drawings", "Drawings shared with suppliers carry no CUI banner markings.", "Apply markings at export and retrain the engineering team."]],
};

const COMMENT_POOL: { body: string; internal: boolean; fromClient?: boolean }[] = [
  { body: "Uploaded the latest export from the admin console. Let me know if you need the raw CSV too.", internal: false, fromClient: true },
  { body: "Screenshot is missing the timestamp. Can you re-export with the date visible?", internal: false },
  { body: "Mapped this to the SOC 2 control as well, so the same evidence covers both.", internal: true },
  { body: "Checked against last year's report; wording matches the new policy version.", internal: true },
  { body: "Auditor will want the population list, not just the sample. Requesting it now.", internal: true },
  { body: "We changed the retention setting yesterday, new screenshot attached.", internal: false, fromClient: true },
  { body: "Looks good to me. Sending to Seema for approval.", internal: true },
  { body: "Can we get the sign-off from the system owner, not IT?", internal: false },
];

const CLIENT_UPLOADER = (c: Client) => `client:${c.id}:0`;

export type Dataset = {
  members: Member[];
  clients: Client[];
  engagements: Engagement[];
  controls: Record<string, Control>;
  evidence: Record<string, Evidence>;
  gaps: Gap[];
  activity: Activity[];
  requests: EvidenceRequest[];
  notifications: Notification[];
  policies: Policy[];
  risks: Risk[];
  audits: Audit[];
  automations: Automation[];
  integrations: Integration[];
  auditEvents: AuditEvent[];
};

export function generate(now = new Date()): Dataset {
  const r = mulberry32(20261113);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const chance = (p: number) => r() < p;
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const at = (days: number, hours = 0) => new Date(now.getTime() + days * 864e5 + hours * 36e5).toISOString();
  const weighted = (mix: [ControlStatus, number][]) => {
    let x = r();
    for (const [s, w] of mix) {
      if ((x -= w) <= 0) return s;
    }
    return mix[mix.length - 1][0];
  };

  const clients: Client[] = [];
  const engagements: Engagement[] = [];
  const controls: Record<string, Control> = {};
  const evidence: Record<string, Evidence> = {};
  const gaps: Gap[] = [];
  const activity: Activity[] = [];
  const requests: EvidenceRequest[] = [];

  for (const seed of CLIENT_SEEDS) {
    const { frameworks, startedDaysAgo, targetDays, auditors, ...rest } = seed;
    const client: Client = {
      ...rest,
      startedAt: at(-startedDaysAgo),
      engagementIds: [],
      publishedAt: seed.id === "orbit" ? at(-21) : undefined,
    };
    clients.push(client);

    const sharedEvidence = new Map<string, string[]>(); // unifiedId -> evidence ids, reused across frameworks
    const doers = client.team.filter((t) => t !== "m_fatima");
    const reviewer = client.team.includes("m_fatima") ? "m_fatima" : client.ownerId;

    frameworks.forEach((fw, fi) => {
      const eid = `${client.id}-${fw}`;
      client.engagementIds.push(eid);
      engagements.push({ id: eid, clientId: client.id, framework: fw, label: FRAMEWORKS[fw].name, target: at(targetDays[fi]), auditor: auditors[fi] });

      unifiedFor(fw).forEach((u, i) => {
        const status = weighted(MIX[client.stage]);
        const owner = pick(doers.length ? doers : client.team);
        const cid = `${eid}-${u.id}`;
        const started = status !== "not_started";
        const due = status === "approved" ? at(-int(4, 60)) : at(chance(0.18) ? -int(1, 9) : int(0, 42));

        const prepAt = status === "approved" ? at(-int(91, 120)) : at(-int(3, 20), -int(0, 8));
        const approvals: Control["approvals"] = { prepared: null, reviewed: null, approved: null };
        if (status === "review" || status === "revise" || status === "approved") approvals.prepared = { by: owner, at: prepAt };
        if (status === "approved" || (status === "review" && chance(0.55))) approvals.reviewed = { by: reviewer, at: status === "approved" ? at(-int(72, 90)) : at(-int(1, 3), -int(0, 6)) };
        if (status === "approved") approvals.approved = { by: "m_seema", at: at(-(chance(0.12) ? int(0, 6) : int(7, 70)), -int(1, 9)) };

        // Evidence, shared across frameworks for the same unified control.
        let evIds: string[] = [];
        if (started) {
          if (sharedEvidence.has(u.id)) evIds = sharedEvidence.get(u.id)!;
          else {
            const n = status === "in_progress" ? int(0, 2) : int(1, 3);
            const pool = EVIDENCE_POOL[u.domain];
            for (let k = 0; k < n; k++) {
              const [name, kind] = pool[(i + k) % pool.length];
              const fromClient = chance(0.6);
              const id = `ev-${client.id}-${u.id}-${k}`;
              evidence[id] = {
                id, clientId: client.id, name, kind,
                sizeKb: kind === "png" ? int(180, 1400) : kind === "zip" ? int(4000, 22000) : int(40, 2600),
                uploadedBy: fromClient ? CLIENT_UPLOADER(client) : owner,
                uploadedAt: at(-int(1, 40), -int(0, 10)),
                version: chance(0.3) ? int(2, 4) : 1,
                controlIds: [],
                source: fromClient ? "client" : "internal",
                state: status === "approved" ? "accepted" : status === "revise" && k === 0 ? "rejected" : chance(0.7) ? "accepted" : "pending",
                expires: /review|scan|report|log|listing|training/i.test(name) ? at(int(-6, 80)) : undefined,
              };
              evIds.push(id);
            }
            sharedEvidence.set(u.id, evIds);
          }
          evIds.forEach((id) => evidence[id].controlIds.push(cid));
        }

        const history: HistoryEntry[] = [{ at: client.startedAt, by: client.ownerId, text: `Added from the unified library as ${u.map[fw]}` }];
        if (started) history.push({ at: at(-int(10, 30)), by: owner, text: "Moved to In progress" });
        if (approvals.prepared) history.push({ at: approvals.prepared.at, by: owner, text: "Prepared and sent for review" });
        if (approvals.reviewed) history.push({ at: approvals.reviewed.at, by: reviewer, text: "QA review passed" });
        if (status === "revise") history.push({ at: at(-int(0, 3), -int(1, 6)), by: reviewer, text: "Sent back for revision" });
        if (approvals.approved) history.push({ at: approvals.approved.at, by: "m_seema", text: "Approved" });

        const comments: Comment[] = [];
        if (started && chance(0.42)) {
          const n = int(1, 3);
          for (let k = 0; k < n; k++) {
            const c = pick(COMMENT_POOL);
            comments.push({
              id: `cm-${cid}-${k}`,
              at: at(-int(0, 9), -int(0, 20)),
              by: c.fromClient ? `client:${client.id}:0` : pick(client.team),
              body: c.body,
              internal: c.internal,
            });
          }
          comments.sort((a, b) => a.at.localeCompare(b.at));
        }

        controls[cid] = {
          id: cid, engagementId: eid, clientId: client.id, unifiedId: u.id, code: u.map[fw]!, title: u.title, summary: u.summary,
          domain: u.domain, status, ownerId: owner, reviewerId: reviewer, due, evidenceIds: evIds, approvals, comments,
          history: history.sort((a, b) => a.at.localeCompare(b.at)),
          reviseReason: status === "revise" ? pick(["Evidence does not cover the full audit period.", "Screenshot has no date or system name visible.", "Policy version in the evidence does not match the approved version.", "Population list missing; sample alone is not enough."]) : undefined,
          order: i,
        };

        // Gaps
        if ((status === "revise" && chance(0.7)) || (status === "in_progress" && chance(0.12)) || (status === "client" && chance(0.1))) {
          const [title, detail, plan] = pick(GAP_POOL[u.domain]);
          const sev: Severity = pick(["critical", "high", "high", "medium", "medium", "low"]);
          gaps.push({
            id: `gap-${cid}`, clientId: client.id, engagementId: eid, controlId: cid, title, detail, plan, severity: sev,
            status: status === "revise" ? pick(["open", "recheck"]) : pick(["open", "remediating", "remediating"]),
            ownerId: owner, due: at(int(-5, 30)), createdAt: at(-int(2, 30)),
          });
        }

        // Requests to the client
        if (status === "client") {
          requests.push({
            id: `rq-${cid}`, clientId: client.id, controlId: cid,
            title: `${u.title}: ${EVIDENCE_POOL[u.domain][0][0]}`,
            note: pick(["Please export from the admin console with the date visible.", "Covering the full audit period, not just the last month.", "Signed by the system owner.", "Latest version, after this quarter's review."]),
            due: at(int(-3, 14)),
            status: chance(0.2) ? "submitted" : "open",
          });
        }
      });
    });
    if (client.stage === "certified") gaps.forEach((g) => g.clientId === client.id && (g.status = "closed"));
  }

  // Activity feed built from what happened recently.
  const recent: Activity[] = [];
  Object.values(controls).forEach((c) => {
    const client = clients.find((x) => x.id === c.clientId)!;
    const fw = FRAMEWORKS[engagements.find((e) => e.id === c.engagementId)!.framework].short;
    if (c.approvals.approved && Date.now() - +new Date(c.approvals.approved.at) < 3 * 864e5)
      recent.push({ id: `a-ap-${c.id}`, at: c.approvals.approved.at, by: "m_seema", kind: "approve", clientId: client.id, controlId: c.id, text: `approved ${fw} ${c.code} for ${client.name}` });
    if (c.status === "revise")
      recent.push({ id: `a-rv-${c.id}`, at: c.history[c.history.length - 1].at, by: c.reviewerId, kind: "revise", clientId: client.id, controlId: c.id, text: `sent ${fw} ${c.code} back for revision` });
    if (c.approvals.prepared && c.status === "review")
      recent.push({ id: `a-pr-${c.id}`, at: c.approvals.prepared.at, by: c.ownerId, kind: "status", clientId: client.id, controlId: c.id, text: `sent ${fw} ${c.code} for review` });
    c.comments.slice(-1).forEach((cm) =>
      recent.push({ id: `a-cm-${cm.id}`, at: cm.at, by: cm.by, kind: "comment", clientId: client.id, controlId: c.id, text: `commented on ${fw} ${c.code}` }),
    );
  });
  Object.values(evidence)
    .filter((e) => e.source === "client")
    .forEach((e) => recent.push({ id: `a-up-${e.id}`, at: e.uploadedAt, by: e.uploadedBy, kind: "upload", clientId: e.clientId, controlId: e.controlIds[0], text: `uploaded ${e.name}.${e.kind}` }));
  activity.push(...recent.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80));

  const waiting = Object.values(controls).filter((c) => c.status === "review" && c.approvals.reviewed);
  const notifications: Notification[] = [
    ...waiting.slice(0, 4).map((c, i) => ({
      id: `n-${c.id}`, at: c.approvals.reviewed!.at, kind: "approve" as const, read: i > 1,
      text: `${clients.find((x) => x.id === c.clientId)!.name} · ${c.code} passed QA and needs your approval`,
      href: `/reviews?c=${c.id}`,
    })),
    ...activity.filter((a) => a.kind === "upload").slice(0, 3).map((a, i) => ({
      id: `n-${a.id}`, at: a.at, kind: "upload" as const, read: i > 0,
      text: `${clients.find((x) => x.id === a.clientId)!.name} ${a.text}`,
      href: `/clients/${a.clientId}`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const modules = generateModules(now, clients, engagements, controls, MEMBERS);
  return { members: MEMBERS, clients, engagements, controls, evidence, gaps, activity, requests, notifications, ...modules };
}

export const clientUserName = (clients: Client[], id: string) => {
  const [, cid, idx] = id.split(":");
  const c = clients.find((x) => x.id === cid);
  return c ? c.contacts[Number(idx)]?.name ?? c.name : "Client";
};
