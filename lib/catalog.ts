import type { ControlStatus, DomainId, FrameworkKey, GapStatus, Role, Severity, Stage } from "./types";

export type Tone = "ok" | "warn" | "bad" | "rev" | "info" | "neutral" | "brand";

export const FRAMEWORKS: Record<FrameworkKey, { name: string; short: string; family: string; hue: number }> = {
  fedramp: { name: "FedRAMP 20x", short: "FedRAMP", family: "Government", hue: 222 },
  soc2: { name: "SOC 2 Type II", short: "SOC 2", family: "Assurance", hue: 256 },
  iso27001: { name: "ISO/IEC 27001:2022", short: "ISO 27001", family: "Assurance", hue: 196 },
  iso42001: { name: "ISO/IEC 42001:2023", short: "ISO 42001", family: "Privacy & AI", hue: 280 },
  gdpr: { name: "GDPR", short: "GDPR", family: "Privacy & AI", hue: 168 },
  dpdpa: { name: "DPDPA 2023", short: "DPDPA", family: "Privacy & AI", hue: 30 },
  hipaa: { name: "HIPAA Security Rule", short: "HIPAA", family: "Privacy & AI", hue: 350 },
  pci: { name: "PCI DSS v4.0.1", short: "PCI DSS", family: "Financial", hue: 12 },
  cmmc: { name: "CMMC Level 2", short: "CMMC L2", family: "Government", hue: 140 },
};

export const FRAMEWORK_ORDER: FrameworkKey[] = ["fedramp", "soc2", "iso27001", "iso42001", "gdpr", "dpdpa", "hipaa", "pci", "cmmc"];

/** The 16 control domains of the SecureKnots unified library (same as secureknots.com). */
export const DOMAINS: { id: DomainId; name: string }[] = [
  { id: "gov", name: "Governance & Policy" },
  { id: "risk", name: "Risk Assessment" },
  { id: "access", name: "Access Control" },
  { id: "asset", name: "Asset Management" },
  { id: "crypto", name: "Cryptography" },
  { id: "ops", name: "Logging & Monitoring" },
  { id: "change", name: "Change Management" },
  { id: "sdlc", name: "Secure SDLC" },
  { id: "vendor", name: "Vendor Risk" },
  { id: "ir", name: "Incident Response" },
  { id: "bcdr", name: "Continuity & DR" },
  { id: "hr", name: "People Security" },
  { id: "physical", name: "Physical Security" },
  { id: "privacy", name: "Privacy & Data Rights" },
  { id: "cardholder", name: "Cardholder Data" },
  { id: "cui", name: "CUI Handling" },
];

export const domainName = (id: DomainId) => DOMAINS.find((d) => d.id === id)?.name ?? id;

export const STATUS: Record<ControlStatus, { label: string; tone: Tone; short: string }> = {
  not_started: { label: "Not started", short: "To do", tone: "neutral" },
  in_progress: { label: "In progress", short: "Doing", tone: "info" },
  client: { label: "Waiting on client", short: "Client", tone: "warn" },
  review: { label: "In review", short: "Review", tone: "rev" },
  revise: { label: "Revise", short: "Revise", tone: "bad" },
  approved: { label: "Approved", short: "Done", tone: "ok" },
};

export const STATUS_ORDER: ControlStatus[] = ["not_started", "in_progress", "client", "review", "revise", "approved"];

export const STAGES: { id: Stage; label: string }[] = [
  { id: "onboarding", label: "Onboarding" },
  { id: "readiness", label: "Readiness" },
  { id: "remediation", label: "Remediation" },
  { id: "audit", label: "Audit" },
  { id: "certified", label: "Certified" },
];

export const ROLES: Record<Role, { label: string; blurb: string }> = {
  admin: { label: "Admin", blurb: "Full access, final approvals, billing and settings" },
  lead: { label: "Compliance lead", blurb: "Runs engagements, assigns work, approves reviews" },
  consultant: { label: "Consultant", blurb: "Prepares controls and evidence for assigned clients" },
  reviewer: { label: "QA reviewer", blurb: "Reviews prepared controls before admin approval" },
  sales: { label: "Sales", blurb: "Sees client list, stages and plans; no evidence" },
  marketing: { label: "Marketing", blurb: "Sees published trust pages and case material only" },
};

export const SEVERITY: Record<Severity, { label: string; tone: Tone; rank: number }> = {
  critical: { label: "Critical", tone: "bad", rank: 0 },
  high: { label: "High", tone: "warn", rank: 1 },
  medium: { label: "Medium", tone: "info", rank: 2 },
  low: { label: "Low", tone: "neutral", rank: 3 },
};

export const GAP_STATUS: Record<GapStatus, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "bad" },
  remediating: { label: "Remediating", tone: "info" },
  recheck: { label: "Recheck", tone: "rev" },
  closed: { label: "Closed", tone: "ok" },
};

export type UnifiedControl = {
  id: string;
  domain: DomainId;
  title: string;
  summary: string;
  map: Partial<Record<FrameworkKey, string>>;
};

/**
 * SecureKnots' unified control library. Titles and summaries are SecureKnots'
 * own wording; the framework references are identifiers only.
 */
export const UNIFIED: UnifiedControl[] = [
  { id: "UC-GOV-01", domain: "gov", title: "Information security policy set", summary: "A management-approved set of security policies, reviewed at least once a year and acknowledged by every employee.", map: { soc2: "CC5.3", iso27001: "A.5.1", pci: "12.1.1", hipaa: "164.316(a)", gdpr: "Art. 24", dpdpa: "§8(4)", fedramp: "KSI-PIY-03", cmmc: "CA.L2-3.12.4" } },
  { id: "UC-GOV-02", domain: "gov", title: "Security roles and responsibilities", summary: "Named owners for security, privacy and compliance, with responsibilities written into job descriptions.", map: { soc2: "CC1.3", iso27001: "A.5.2", pci: "12.4.1", hipaa: "164.308(a)(2)", gdpr: "Art. 37", dpdpa: "§8(9)", iso42001: "A.3.2" } },
  { id: "UC-GOV-03", domain: "gov", title: "Management review of the program", summary: "Leadership reviews security objectives, incidents, audit results and open risks on a fixed schedule, with minutes kept.", map: { soc2: "CC4.1", iso27001: "Cl. 9.3", iso42001: "Cl. 9.3", pci: "12.4.2" } },
  { id: "UC-GOV-04", domain: "gov", title: "System boundary and scope", summary: "A documented scope of systems, data flows and third-party services in the assessment boundary, kept current.", map: { soc2: "CC2.1", iso27001: "Cl. 4.3", fedramp: "KSI-PIY-01", cmmc: "CA.L2-3.12.4", pci: "12.5.2" } },
  { id: "UC-AI-01", domain: "gov", title: "AI policy and objectives", summary: "A policy covering how AI systems are developed and used, with measurable objectives and an accountable owner.", map: { iso42001: "A.2.2" } },
  { id: "UC-RSK-01", domain: "risk", title: "Annual risk assessment", summary: "Threats, vulnerabilities and impacts assessed across in-scope systems at least yearly and after major changes.", map: { soc2: "CC3.2", iso27001: "Cl. 6.1.2", pci: "12.3.1", hipaa: "164.308(a)(1)(ii)(A)", cmmc: "RA.L2-3.11.1", fedramp: "KSI-PIY-04", gdpr: "Art. 32", iso42001: "Cl. 6.1.2" } },
  { id: "UC-RSK-02", domain: "risk", title: "Risk treatment plan with owners", summary: "Every risk above tolerance has a treatment decision, an owner and a target date, tracked to closure.", map: { soc2: "CC9.1", iso27001: "Cl. 6.1.3", hipaa: "164.308(a)(1)(ii)(B)", iso42001: "Cl. 6.1.3" } },
  { id: "UC-RSK-03", domain: "risk", title: "AI system impact assessment", summary: "Each AI system is assessed for its effect on individuals and society before release and when it changes.", map: { iso42001: "A.5.2" } },
  { id: "UC-RSK-04", domain: "risk", title: "Data protection impact assessment", summary: "High-risk processing is assessed for privacy impact before it starts, with mitigations recorded.", map: { gdpr: "Art. 35", dpdpa: "§10(2)(c)" } },
  { id: "UC-ACC-01", domain: "access", title: "Joiner, mover and leaver process", summary: "Accounts are created from approved requests, changed when roles change and removed within one business day of exit.", map: { soc2: "CC6.2", iso27001: "A.5.16", pci: "8.2.1", hipaa: "164.312(a)(2)(i)", cmmc: "AC.L2-3.1.1", fedramp: "KSI-IAM-02" } },
  { id: "UC-ACC-02", domain: "access", title: "Phishing-resistant MFA", summary: "Multi-factor authentication on all workforce and administrative access, using phishing-resistant methods where possible.", map: { soc2: "CC6.1", iso27001: "A.8.5", pci: "8.4.2", hipaa: "164.312(d)", cmmc: "IA.L2-3.5.3", fedramp: "KSI-IAM-01", dpdpa: "§8(5)" } },
  { id: "UC-ACC-03", domain: "access", title: "Quarterly access reviews", summary: "System owners confirm every user's access each quarter; removals are tracked to completion.", map: { soc2: "CC6.3", iso27001: "A.5.18", pci: "7.2.4", hipaa: "164.308(a)(4)", cmmc: "AC.L2-3.1.5", fedramp: "KSI-IAM-03" } },
  { id: "UC-ACC-04", domain: "access", title: "Privileged access management", summary: "Admin rights are limited, time-bound and logged, with break-glass accounts sealed and monitored.", map: { soc2: "CC6.1", iso27001: "A.8.2", pci: "7.2.1", cmmc: "AC.L2-3.1.6", fedramp: "KSI-IAM-05" } },
  { id: "UC-ACC-05", domain: "access", title: "Password and session standards", summary: "Minimum password length, lockout and session timeouts enforced by the identity provider.", map: { soc2: "CC6.1", iso27001: "A.5.17", pci: "8.3.6", cmmc: "IA.L2-3.5.7" } },
  { id: "UC-AST-01", domain: "asset", title: "Asset and software inventory", summary: "An inventory of hardware, cloud resources and software, reconciled monthly with an owner per asset.", map: { soc2: "CC6.1", iso27001: "A.5.9", pci: "12.5.1", hipaa: "164.310(d)(1)", cmmc: "CM.L2-3.4.1", fedramp: "KSI-PIY-01", iso42001: "A.4.2" } },
  { id: "UC-AST-02", domain: "asset", title: "Data classification and handling", summary: "Data is labeled by sensitivity, with handling rules for storage, sharing and disposal at each level.", map: { soc2: "C1.1", iso27001: "A.5.12", pci: "9.4.2", gdpr: "Art. 30", iso42001: "A.7.2" } },
  { id: "UC-CRY-01", domain: "crypto", title: "Encryption at rest", summary: "Production data stores and backups are encrypted with managed keys and documented key rotation.", map: { soc2: "CC6.1", iso27001: "A.8.24", pci: "3.5.1", hipaa: "164.312(a)(2)(iv)", cmmc: "SC.L2-3.13.16", fedramp: "KSI-SVC-02", gdpr: "Art. 32", dpdpa: "§8(5)" } },
  { id: "UC-CRY-02", domain: "crypto", title: "Encryption in transit", summary: "TLS 1.2 or higher on every external and internal service; legacy protocols disabled.", map: { soc2: "CC6.7", iso27001: "A.8.24", pci: "4.2.1", hipaa: "164.312(e)(1)", cmmc: "SC.L2-3.13.8", fedramp: "KSI-SVC-02" } },
  { id: "UC-CRY-03", domain: "crypto", title: "FIPS-validated cryptography", summary: "Federal and CUI data protected only by FIPS 140 validated modules, with certificate numbers recorded.", map: { cmmc: "SC.L2-3.13.11", fedramp: "KSI-SVC-03" } },
  { id: "UC-OPS-01", domain: "ops", title: "Centralized audit logging", summary: "Security-relevant events from all in-scope systems are collected centrally and kept for at least one year.", map: { soc2: "CC7.2", iso27001: "A.8.15", pci: "10.2.1", hipaa: "164.312(b)", cmmc: "AU.L2-3.3.1", fedramp: "KSI-MLA-01" } },
  { id: "UC-OPS-02", domain: "ops", title: "Log review and alerting", summary: "High-risk events raise alerts to an on-call owner; alerts and their handling are reviewed weekly.", map: { soc2: "CC7.3", iso27001: "A.8.16", pci: "10.4.1", cmmc: "AU.L2-3.3.5", fedramp: "KSI-MLA-02" } },
  { id: "UC-OPS-03", domain: "ops", title: "Vulnerability scanning and patching", summary: "Authenticated scans at least monthly; critical findings fixed within 15 days and high within 30.", map: { soc2: "CC7.1", iso27001: "A.8.8", pci: "11.3.1", cmmc: "RA.L2-3.11.2", fedramp: "KSI-MLA-05", hipaa: "164.308(a)(1)(ii)(B)" } },
  { id: "UC-OPS-04", domain: "ops", title: "Annual penetration test", summary: "An independent penetration test of the external surface and core application every year, with retests.", map: { soc2: "CC4.1", iso27001: "A.8.8", pci: "11.4.1", cmmc: "CA.L2-3.12.1", fedramp: "KSI-MLA-06" } },
  { id: "UC-CHG-01", domain: "change", title: "Change approval and peer review", summary: "Production changes are peer reviewed, tested and approved, with emergency changes reviewed after the fact.", map: { soc2: "CC8.1", iso27001: "A.8.32", pci: "6.5.1", cmmc: "CM.L2-3.4.3", fedramp: "KSI-CMT-01", iso42001: "A.6.2.5" } },
  { id: "UC-CHG-02", domain: "change", title: "Secure configuration baselines", summary: "Hardened baselines for servers, containers and cloud accounts, with drift detected automatically.", map: { soc2: "CC7.1", iso27001: "A.8.9", pci: "2.2.1", cmmc: "CM.L2-3.4.2", fedramp: "KSI-SVC-04" } },
  { id: "UC-SDL-01", domain: "sdlc", title: "Secure development lifecycle", summary: "Security requirements, threat modeling and secure coding standards built into how software is designed and shipped.", map: { soc2: "CC8.1", iso27001: "A.8.25", pci: "6.2.1", fedramp: "KSI-CMT-03", iso42001: "A.6.2.3" } },
  { id: "UC-SDL-02", domain: "sdlc", title: "Code and dependency scanning", summary: "Static analysis and dependency checks run on every merge; blocking findings stop the release.", map: { soc2: "CC7.1", iso27001: "A.8.28", pci: "6.2.4", fedramp: "KSI-CMT-02" } },
  { id: "UC-AI-02", domain: "sdlc", title: "AI lifecycle documentation", summary: "Training data sources, model versions, evaluations and release decisions recorded for every AI system.", map: { iso42001: "A.6.2.2" } },
  { id: "UC-VEN-01", domain: "vendor", title: "Vendor due diligence and contracts", summary: "Vendors handling sensitive data are assessed before onboarding and bound by security and privacy terms.", map: { soc2: "CC9.2", iso27001: "A.5.19", pci: "12.8.1", hipaa: "164.308(b)(1)", gdpr: "Art. 28", dpdpa: "§8(2)", fedramp: "KSI-TPR-01", iso42001: "A.10.2" } },
  { id: "UC-VEN-02", domain: "vendor", title: "Annual vendor review", summary: "Critical vendors are re-reviewed every year using their latest SOC reports or certificates.", map: { soc2: "CC9.2", iso27001: "A.5.22", pci: "12.8.4", fedramp: "KSI-TPR-02" } },
  { id: "UC-INR-01", domain: "ir", title: "Incident response plan and drills", summary: "A tested incident response plan with roles, severity levels and a tabletop exercise at least once a year.", map: { soc2: "CC7.4", iso27001: "A.5.24", pci: "12.10.1", hipaa: "164.308(a)(6)", cmmc: "IR.L2-3.6.1", fedramp: "KSI-INR-01", gdpr: "Art. 33", dpdpa: "§8(6)" } },
  { id: "UC-INR-02", domain: "ir", title: "Breach notification timelines", summary: "Regulator, customer and individual notifications prepared in advance, with deadlines tracked per law.", map: { gdpr: "Art. 33", dpdpa: "§8(6)", hipaa: "164.404", cmmc: "IR.L2-3.6.2", fedramp: "KSI-INR-02" } },
  { id: "UC-BCP-01", domain: "bcdr", title: "Backups and restore tests", summary: "Automated, encrypted backups with a documented restore test every quarter.", map: { soc2: "A1.2", iso27001: "A.8.13", hipaa: "164.308(a)(7)(ii)(A)", fedramp: "KSI-RPL-03" } },
  { id: "UC-BCP-02", domain: "bcdr", title: "Business continuity and DR plan", summary: "Recovery objectives per service and a disaster recovery plan exercised at least once a year.", map: { soc2: "A1.3", iso27001: "A.5.30", hipaa: "164.308(a)(7)", fedramp: "KSI-RPL-01" } },
  { id: "UC-HR-01", domain: "hr", title: "Security awareness training", summary: "Training at hire and every year, plus phishing simulations, with completion tracked per person.", map: { soc2: "CC2.2", iso27001: "A.6.3", pci: "12.6.1", hipaa: "164.308(a)(5)", cmmc: "AT.L2-3.2.1", fedramp: "KSI-CED-01" } },
  { id: "UC-HR-02", domain: "hr", title: "Background checks and NDAs", summary: "Screening before access to sensitive systems, and confidentiality agreements signed by all staff.", map: { soc2: "CC1.4", iso27001: "A.6.1", pci: "12.7.1", cmmc: "PS.L2-3.9.1" } },
  { id: "UC-PHY-01", domain: "physical", title: "Physical access to facilities", summary: "Badge-controlled access to offices and equipment rooms, with visitor logs and quarterly access reviews.", map: { soc2: "CC6.4", iso27001: "A.7.2", pci: "9.2.1", hipaa: "164.310(a)(1)", cmmc: "PE.L2-3.10.1" } },
  { id: "UC-PRV-01", domain: "privacy", title: "Privacy notice and consent", summary: "Clear notices at collection and consent captured, recorded and withdrawable where consent is the basis.", map: { gdpr: "Art. 13", dpdpa: "§5", hipaa: "164.520" } },
  { id: "UC-PRV-02", domain: "privacy", title: "Individual rights requests", summary: "Access, correction and erasure requests verified, answered within legal deadlines and logged.", map: { gdpr: "Art. 15", dpdpa: "§11", hipaa: "164.524" } },
  { id: "UC-PRV-03", domain: "privacy", title: "Retention and erasure", summary: "Retention periods per data category, with automated deletion when the purpose ends.", map: { gdpr: "Art. 17", dpdpa: "§8(7)", hipaa: "164.316(b)(2)", iso42001: "A.7.4" } },
  { id: "UC-PRV-04", domain: "privacy", title: "Cross-border transfers", summary: "Transfers outside the home jurisdiction mapped and covered by an approved mechanism.", map: { gdpr: "Art. 46", dpdpa: "§16" } },
  { id: "UC-CHD-01", domain: "cardholder", title: "Cardholder data environment segmentation", summary: "The card data environment is isolated by network controls, with segmentation tested every six months.", map: { pci: "1.3.1" } },
  { id: "UC-CHD-02", domain: "cardholder", title: "PAN masking and truncation", summary: "Card numbers masked on display and unreadable in storage, with access limited to a business need.", map: { pci: "3.4.1" } },
  { id: "UC-CUI-01", domain: "cui", title: "CUI identification and marking", summary: "Controlled Unclassified Information identified at intake, marked and tracked through every system it touches.", map: { cmmc: "MP.L2-3.8.4" } },
  { id: "UC-CUI-02", domain: "cui", title: "CUI media protection", summary: "Media holding CUI is access-controlled, encrypted in transport and sanitized before disposal or reuse.", map: { cmmc: "MP.L2-3.8.3" } },
];

export const unifiedFor = (fw: FrameworkKey) => UNIFIED.filter((u) => u.map[fw]);

export const TONE_CLASS: Record<Tone, { soft: string; fg: string; dot: string; solid: string }> = {
  ok: { soft: "bg-ok-soft", fg: "text-ok", dot: "bg-ok-dot", solid: "bg-ok" },
  warn: { soft: "bg-warn-soft", fg: "text-warn", dot: "bg-warn-dot", solid: "bg-warn" },
  bad: { soft: "bg-bad-soft", fg: "text-bad", dot: "bg-bad-dot", solid: "bg-bad" },
  rev: { soft: "bg-rev-soft", fg: "text-rev", dot: "bg-rev-dot", solid: "bg-rev" },
  info: { soft: "bg-info-soft", fg: "text-info", dot: "bg-info-dot", solid: "bg-info" },
  neutral: { soft: "bg-neutral-soft", fg: "text-neutral", dot: "bg-neutral-dot", solid: "bg-neutral" },
  brand: { soft: "bg-brand-soft", fg: "text-brand-ink", dot: "bg-brand", solid: "bg-brand" },
};
