import { FRAMEWORKS } from "../catalog";
import type {
  Audit, AuditEvent, Automation, Client, Control, Engagement, FrameworkKey, Integration, Member, PbcItem, PbcStatus, Policy, Risk,
} from "../types";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POLICY_SET: { title: string; category: string; sections: string[]; fw: FrameworkKey[] }[] = [
  { title: "Information Security Policy", category: "Governance", sections: ["Purpose and scope", "Roles and responsibilities", "Policy framework", "Exceptions", "Review and approval"], fw: ["soc2", "iso27001", "fedramp", "pci", "hipaa", "cmmc"] },
  { title: "Access Control Policy", category: "Identity", sections: ["Account lifecycle", "Multi-factor authentication", "Privileged access", "Access reviews", "Remote access"], fw: ["soc2", "iso27001", "fedramp", "pci", "hipaa", "cmmc"] },
  { title: "Incident Response Plan", category: "Operations", sections: ["Severity levels", "Response team", "Detection and triage", "Notification deadlines", "Post-incident review"], fw: ["soc2", "iso27001", "fedramp", "gdpr", "dpdpa", "hipaa", "pci", "cmmc"] },
  { title: "Business Continuity and DR Plan", category: "Resilience", sections: ["Business impact analysis", "Recovery objectives", "Backup strategy", "Exercises", "Plan maintenance"], fw: ["soc2", "iso27001", "fedramp", "hipaa"] },
  { title: "Change Management Policy", category: "Engineering", sections: ["Change types", "Peer review", "Testing", "Emergency changes", "Records"], fw: ["soc2", "iso27001", "fedramp", "pci", "cmmc"] },
  { title: "Vendor Risk Management Policy", category: "Third parties", sections: ["Vendor tiers", "Due diligence", "Contract terms", "Annual review", "Offboarding"], fw: ["soc2", "iso27001", "fedramp", "gdpr", "dpdpa", "pci"] },
  { title: "Data Classification and Handling Standard", category: "Data", sections: ["Classification levels", "Labeling", "Storage and transfer", "Retention", "Disposal"], fw: ["soc2", "iso27001", "gdpr", "dpdpa", "iso42001"] },
  { title: "Privacy Notice and Data Rights Procedure", category: "Privacy", sections: ["Lawful basis", "Notices", "Rights requests", "Verification", "Response deadlines"], fw: ["gdpr", "dpdpa", "hipaa"] },
  { title: "Secure Development Standard", category: "Engineering", sections: ["Threat modeling", "Secure coding", "Code review", "Dependency management", "Release gates"], fw: ["soc2", "iso27001", "fedramp", "pci", "iso42001"] },
  { title: "Acceptable Use Policy", category: "People", sections: ["Company devices", "Email and messaging", "Personal use", "Monitoring", "Violations"], fw: ["soc2", "iso27001", "hipaa", "cmmc"] },
  { title: "AI Use and Governance Policy", category: "AI", sections: ["Approved AI uses", "Impact assessment", "Data for training", "Human oversight", "Model change control"], fw: ["iso42001"] },
  { title: "Encryption and Key Management Standard", category: "Cryptography", sections: ["Approved algorithms", "Data at rest", "Data in transit", "Key rotation", "FIPS validation"], fw: ["soc2", "iso27001", "fedramp", "pci", "cmmc", "hipaa"] },
];

const RISK_SET: { title: string; category: string; uc: string[] }[] = [
  { title: "Compromised admin credentials lead to cloud account takeover", category: "Identity", uc: ["UC-ACC-02", "UC-ACC-04"] },
  { title: "Ransomware encrypts production databases", category: "Resilience", uc: ["UC-BCP-01", "UC-BCP-02"] },
  { title: "Critical vendor suffers a breach affecting customer data", category: "Third parties", uc: ["UC-VEN-01", "UC-VEN-02"] },
  { title: "Unpatched internet-facing service is exploited", category: "Vulnerability", uc: ["UC-OPS-03", "UC-OPS-04"] },
  { title: "Insider exports sensitive data before leaving", category: "People", uc: ["UC-ACC-01", "UC-OPS-02"] },
  { title: "Misconfigured storage bucket exposes backups", category: "Cloud", uc: ["UC-CHG-02", "UC-CRY-01"] },
  { title: "Breach not reported within regulatory deadline", category: "Compliance", uc: ["UC-INR-02", "UC-INR-01"] },
  { title: "Malicious dependency enters the release pipeline", category: "Supply chain", uc: ["UC-SDL-02", "UC-SDL-01"] },
  { title: "Loss of key engineer delays incident recovery", category: "People", uc: ["UC-BCP-02", "UC-GOV-02"] },
  { title: "AI model produces biased or unsafe outputs", category: "AI", uc: ["UC-RSK-03", "UC-AI-02"] },
  { title: "Personal data retained beyond its purpose", category: "Privacy", uc: ["UC-PRV-03"] },
  { title: "Phishing campaign targets finance team", category: "People", uc: ["UC-HR-01", "UC-ACC-02"] },
];

const PBC_REQUESTS = [
  "Population of all users with production access as of the period end",
  "Quarterly access review sign-offs for Q1 to Q3",
  "Sample of 25 changes with tickets, approvals and deployment logs",
  "Evidence of MFA enforcement for all workforce accounts",
  "Incident log for the audit period with response timelines",
  "Backup restore test results for two quarters",
  "Vendor inventory with risk tier and last review date",
  "Security awareness training completion report",
  "New hire list with background check dates",
  "Terminated users list with access removal timestamps",
  "Vulnerability scan reports and remediation tracker",
  "Board or management review minutes covering security",
  "Penetration test report and retest letter",
  "Encryption configuration for production data stores",
];

const MEMBERS_FOR_WORK = ["m_arjun", "m_priya", "m_daniel"];

export function generateModules(now: Date, clients: Client[], engagements: Engagement[], controls: Record<string, Control>, members: Member[]) {
  const r = rng(424242);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const at = (days: number, hours = 0) => new Date(now.getTime() + days * 864e5 + hours * 36e5).toISOString();

  /* Policies: the set that applies to each client's frameworks */
  const policies: Policy[] = [];
  clients.forEach((c) => {
    const fws = engagements.filter((e) => e.clientId === c.id).map((e) => e.framework);
    POLICY_SET.filter((p) => p.fw.some((f) => fws.includes(f))).forEach((p, i) => {
      const status: Policy["status"] =
        c.stage === "certified" || c.stage === "audit" ? (r() < 0.9 ? "approved" : "in_review") : c.stage === "onboarding" ? (r() < 0.6 ? "draft" : "in_review") : pick(["approved", "approved", "in_review", "draft"]);
      const major = status === "draft" ? 1 : int(2, 5);
      const minor = int(0, 3);
      const owner = pick(c.team.filter((t) => MEMBERS_FOR_WORK.includes(t)).length ? c.team.filter((t) => MEMBERS_FOR_WORK.includes(t)) : MEMBERS_FOR_WORK);
      const versions = Array.from({ length: Math.min(major + minor - 1, 5) }, (_, k) => ({
        v: `${Math.max(1, major - Math.floor(k / 2))}.${Math.max(0, minor - k)}`,
        at: at(-(k * 70 + int(5, 40))),
        by: k === 0 && status === "approved" ? "m_seema" : owner,
        note: k === 0 ? (status === "approved" ? "Approved after annual review" : "Updated for new framework requirements") : pick(["Annual review, no material changes", "Added MFA requirement for contractors", "Aligned with ISO/IEC 27001:2022 Annex A", "Clarified roles after reorganization", "Added cloud-specific procedures"]),
      }));
      policies.push({
        id: `pol-${c.id}-${i}`, clientId: c.id, title: p.title, category: p.category, ownerId: owner,
        version: `${major}.${minor}`, status, updatedAt: versions[0]?.at ?? at(-int(3, 60)), reviewDue: at(int(-20, 300)),
        ackRate: status === "approved" ? int(72, 100) : 0, employees: int(40, 420), frameworks: p.fw.filter((f) => fws.includes(f)),
        sections: p.sections, words: int(1400, 5200), versions,
      });
    });
  });

  /* Risk register */
  const risks: Risk[] = [];
  clients.forEach((c) => {
    const n = c.stage === "onboarding" ? 3 : int(5, 8);
    const pool = [...RISK_SET].sort(() => r() - 0.5).slice(0, n);
    pool.forEach((x, i) => {
      const l = int(2, 5);
      const im = int(2, 5);
      const treated = c.stage !== "onboarding";
      risks.push({
        id: `rk-${c.id}-${i}`, clientId: c.id, ref: `R-${String(i + 1).padStart(3, "0")}`, title: x.title, category: x.category,
        likelihood: l, impact: im,
        residualLikelihood: treated ? Math.max(1, l - int(1, 3)) : l, residualImpact: treated ? Math.max(1, im - int(0, 2)) : im,
        treatment: pick(["mitigate", "mitigate", "mitigate", "transfer", "accept"]),
        status: c.stage === "certified" ? pick(["closed", "accepted", "treating"]) : pick(["open", "treating", "treating", "accepted"]),
        ownerId: pick(c.team), unifiedIds: x.uc, reviewedAt: at(-int(3, 80)),
        notes: pick(["Reviewed with the client's CTO; treatment plan agreed.", "Residual score assumes the MFA rollout completes this quarter.", "Insurance covers part of the financial impact.", "Accepted by management with a 12-month review."]),
      });
    });
  });

  /* Audits with PBC (provided-by-client) lists */
  const audits: Audit[] = [];
  const auditFirms: Record<FrameworkKey, [string, string]> = {
    fedramp: ["Independent assessor (client-selected)", "FedRAMP 20x independent assessment"],
    soc2: ["CPA firm (client-selected)", "SOC 2 Type II examination"],
    iso27001: ["Certification body (client-selected)", "ISO/IEC 27001 Stage 2 audit"],
    iso42001: ["Certification body (client-selected)", "ISO/IEC 42001 Stage 1 audit"],
    pci: ["QSA (client-selected)", "PCI DSS assessment"],
    hipaa: ["Third-party assessor", "HIPAA security assessment"],
    cmmc: ["C3PAO (client-selected)", "CMMC Level 2 assessment"],
    gdpr: ["Internal readiness review", "GDPR readiness review"],
    dpdpa: ["Internal readiness review", "DPDPA readiness review"],
  };
  engagements
    .filter((e) => {
      const c = clients.find((x) => x.id === e.clientId)!;
      return c.stage === "audit" || c.stage === "remediation" || c.stage === "certified";
    })
    .forEach((e, ei) => {
      const c = clients.find((x) => x.id === e.clientId)!;
      const [firm, kind] = auditFirms[e.framework];
      const tgt = new Date(e.target).getTime();
      const start = new Date(tgt - 21 * 864e5).toISOString();
      const end = new Date(tgt + 14 * 864e5).toISOString();
      const days = (tgt - now.getTime()) / 864e5;
      const phase: Audit["phase"] = c.stage === "certified" ? "complete" : days < 0 ? "reporting" : days < 30 ? "fieldwork" : "planning";
      const ecs = Object.values(controls).filter((x) => x.engagementId === e.id);
      const n = phase === "planning" ? int(6, 9) : int(10, 14);
      const pbc: PbcItem[] = PBC_REQUESTS.slice(0, n).map((req, i) => {
        const st: PbcStatus = phase === "complete" ? "accepted" : phase === "planning" ? pick(["requested", "requested", "in_progress"]) : pick(["accepted", "accepted", "submitted", "in_progress", "requested", "followup"]);
        return {
          id: `pbc-${e.id}-${i}`, ref: `PBC-${String(i + 1).padStart(3, "0")}`, request: req, controlId: ecs[(i * 3) % Math.max(1, ecs.length)]?.id,
          status: st, due: at(phase === "complete" ? -int(30, 60) : int(-4, 20)), assigneeId: pick(c.team), sample: req.startsWith("Sample") ? 25 : req.startsWith("Population") ? undefined : r() < 0.3 ? int(5, 15) : undefined,
        };
      });
      audits.push({
        id: `au-${e.id}`, clientId: c.id, engagementId: e.id, firm, lead: pick(["Lead assessor: M. Ortega", "Engagement partner: S. Whitman", "Lead auditor: K. Iyer", "Lead assessor: J. Novak"]), kind,
        start, end, phase, pbc,
        meetings: [
          { at: new Date(tgt - 24 * 864e5 + 15 * 36e5).toISOString(), title: "Audit kickoff", who: "Auditor, client, SecureKnots" },
          { at: new Date(tgt - 14 * 864e5 + 14 * 36e5).toISOString(), title: "Access control walkthrough", who: "Auditor, client IT" },
          { at: new Date(tgt - 7 * 864e5 + 16 * 36e5).toISOString(), title: "Change management walkthrough", who: "Auditor, engineering" },
          { at: new Date(tgt + 10 * 864e5 + 15 * 36e5).toISOString(), title: "Closing meeting", who: "Auditor, client leadership" },
        ],
      });
      void ei;
    });

  /* Automations */
  const automations: Automation[] = [
    { id: "au1", name: "Notify QA when work is ready", trigger: "Control moves to In review", condition: "Any client", action: "Notify the control's QA reviewer", enabled: true, runs: 412, lastRun: at(0, -1) },
    { id: "au2", name: "Escalate critical gaps", trigger: "Gap is created", condition: "Severity is Critical", action: "Notify admin and the engagement owner", enabled: true, runs: 38, lastRun: at(-2) },
    { id: "au3", name: "Refresh quarterly evidence", trigger: "Evidence expires in 14 days", condition: "Evidence type is access review or scan", action: "Send an evidence request to the client", enabled: true, runs: 96, lastRun: at(-1, -3) },
    { id: "au4", name: "Chase overdue client requests", trigger: "Client request is overdue", condition: "Overdue by 3 days", action: "Email the client contact and CC the owner", enabled: true, runs: 141, lastRun: at(0, -5) },
    { id: "au5", name: "Weekly client digest", trigger: "Every Friday at 4 PM", condition: "Client has open requests", action: "Email a progress summary to the client admin", enabled: false, runs: 22, lastRun: at(-21) },
    { id: "au6", name: "Lock evidence on approval", trigger: "Control is approved", condition: "Any framework", action: "Lock linked evidence and add it to the audit packet", enabled: true, runs: 603, lastRun: at(0, -2) },
    { id: "au7", name: "Policy review reminders", trigger: "Policy review is due in 30 days", condition: "Policy is approved", action: "Create a task for the policy owner", enabled: true, runs: 57, lastRun: at(-6) },
  ];

  /* Integrations: connected now, or ready for automated evidence collection later */
  const integrations: Integration[] = [
    { id: "m365", name: "Microsoft 365", category: "Identity", description: "Single sign-on for the team, Outlook notifications and calendar invites.", connected: true, collects: ["Sign-in policy", "MFA enrollment report"], items: 14, lastSync: at(0, -1), mark: "M", color: "#2563eb" },
    { id: "onedrive", name: "OneDrive & SharePoint", category: "Collaboration", description: "Import the existing client folders and sync documents both ways.", connected: true, collects: ["Client folders", "Policy documents"], items: 1171, lastSync: at(0, -3), mark: "OD", color: "#0ea5e9" },
    { id: "teams", name: "Microsoft Teams", category: "Collaboration", description: "Post approvals, overdue alerts and client replies to a channel.", connected: false, collects: [], items: 0, mark: "T", color: "#6366f1" },
    { id: "aws", name: "Amazon Web Services", category: "Cloud", description: "Read-only role that collects IAM, CloudTrail, Config and encryption settings as evidence.", connected: false, collects: ["IAM users and MFA", "CloudTrail retention", "KMS key rotation", "S3 encryption"], items: 0, mark: "AWS", color: "#f59e0b" },
    { id: "azure", name: "Microsoft Azure", category: "Cloud", description: "Collects Entra ID, Defender for Cloud and storage encryption settings.", connected: false, collects: ["Conditional access", "Defender score", "Storage encryption"], items: 0, mark: "Az", color: "#0284c7" },
    { id: "gcp", name: "Google Cloud", category: "Cloud", description: "Collects IAM, audit logging and Security Command Center findings.", connected: false, collects: ["IAM bindings", "Audit log sinks"], items: 0, mark: "GC", color: "#16a34a" },
    { id: "okta", name: "Okta", category: "Identity", description: "Access reviews and MFA reports straight from the identity provider.", connected: false, collects: ["User list", "MFA factors", "Deprovisioning log"], items: 0, mark: "O", color: "#1d4ed8" },
    { id: "github", name: "GitHub", category: "Engineering", description: "Branch protection, pull request reviews and dependency alerts as change-management evidence.", connected: false, collects: ["Branch protection", "PR approvals", "Dependabot alerts"], items: 0, mark: "GH", color: "#171717" },
    { id: "jira", name: "Jira", category: "Ticketing", description: "Sync remediation tasks and change tickets with the gap register.", connected: false, collects: ["Change tickets", "Remediation tasks"], items: 0, mark: "J", color: "#2563eb" },
    { id: "intune", name: "Microsoft Intune", category: "HR & devices", description: "Device encryption, OS versions and MDM enrollment for every laptop.", connected: false, collects: ["Disk encryption", "MDM enrollment"], items: 0, mark: "In", color: "#0891b2" },
    { id: "bamboo", name: "BambooHR", category: "HR & devices", description: "Joiners and leavers for access reviews and training tracking.", connected: false, collects: ["New hires", "Terminations"], items: 0, mark: "B", color: "#65a30d" },
    { id: "slack", name: "Slack", category: "Collaboration", description: "Alerts and approvals for teams that work in Slack.", connected: false, collects: [], items: 0, mark: "S", color: "#7c3aed" },
  ];

  /* Audit log: who did what, from where */
  const places = [["Wilmington, US", "73.162.18."], ["Bengaluru, IN", "49.207.52."], ["London, UK", "81.98.140."]] as const;
  const actions: [string, (c: Client) => string][] = [
    ["Signed in", () => "Microsoft 365 SSO, MFA passed"],
    ["Approved control", (c) => `${c.name} · ${pick(Object.values(FRAMEWORKS)).short} control`],
    ["Uploaded evidence", (c) => `${c.name} · ${pick(["Access review", "Scan report", "Policy export", "Screenshot"])}`],
    ["Exported register", (c) => `${c.name} control register (Excel)`],
    ["Changed permission", () => "Consultant · Upload evidence"],
    ["Sent client request", (c) => `${c.contacts[0].name}, ${c.name}`],
    ["Viewed evidence", (c) => `${c.name} · ${pick(["Okta MFA policy export", "Risk register FY26", "Incident response plan"])}`],
    ["Published to Trust", (c) => `${c.name} trust center`],
  ];
  const auditEvents: AuditEvent[] = Array.from({ length: 160 }, (_, i) => {
    const m = pick(members.filter((x) => !["sales", "marketing"].includes(x.role)));
    const [act, tgt] = pick(actions);
    const place = m.location.includes("Bengaluru") ? places[1] : m.location.includes("London") ? places[2] : places[0];
    return { id: `ev-log-${i}`, at: at(-r() * 30, -r() * 12), actor: m.id, action: act, target: tgt(pick(clients)), ip: `${place[1]}${int(2, 250)}`, where: place[0] };
  }).sort((a, b) => b.at.localeCompare(a.at));

  return { policies, risks, audits, automations, integrations, auditEvents };
}
