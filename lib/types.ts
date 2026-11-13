export type FrameworkKey = "soc2" | "iso27001" | "iso42001" | "gdpr" | "dpdpa" | "hipaa" | "pci" | "cmmc" | "fedramp";

export type DomainId =
  | "gov" | "risk" | "access" | "asset" | "crypto" | "ops" | "change" | "sdlc"
  | "vendor" | "ir" | "bcdr" | "hr" | "physical" | "privacy" | "cardholder" | "cui";

export type ControlStatus = "not_started" | "in_progress" | "client" | "review" | "revise" | "approved";

export type Stage = "onboarding" | "readiness" | "remediation" | "audit" | "certified";

export type Role = "admin" | "lead" | "consultant" | "reviewer" | "sales" | "marketing";

export type Member = {
  id: string;
  name: string;
  title: string;
  role: Role;
  email: string;
  hue: number;
  location: string;
};

export type ClientContact = { name: string; title: string; email: string };

export type Client = {
  id: string;
  name: string;
  industry: string;
  hq: string;
  hue: number;
  stage: Stage;
  ownerId: string;
  team: string[];
  trustPlan: boolean;
  contacts: ClientContact[];
  startedAt: string;
  engagementIds: string[];
  publishedAt?: string;
};

export type Engagement = {
  id: string;
  clientId: string;
  framework: FrameworkKey;
  label: string;
  target: string;
  auditor: string;
};

export type ApprovalStep = { by: string; at: string } | null;

export type HistoryEntry = { at: string; by: string; text: string };

export type Comment = {
  id: string;
  at: string;
  by: string;
  body: string;
  internal: boolean;
};

export type Control = {
  id: string;
  engagementId: string;
  clientId: string;
  unifiedId: string;
  code: string;
  title: string;
  summary: string;
  domain: DomainId;
  status: ControlStatus;
  ownerId: string;
  reviewerId: string;
  due: string;
  evidenceIds: string[];
  approvals: { prepared: ApprovalStep; reviewed: ApprovalStep; approved: ApprovalStep };
  comments: Comment[];
  history: HistoryEntry[];
  reviseReason?: string;
  order: number;
};

export type FileKind = "pdf" | "docx" | "xlsx" | "png" | "csv" | "zip";

export type Evidence = {
  id: string;
  clientId: string;
  name: string;
  kind: FileKind;
  sizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  controlIds: string[];
  source: "client" | "internal";
  state: "accepted" | "pending" | "rejected";
  /** Evidence that goes stale (access reviews, scans) must be refreshed by this date. */
  expires?: string;
};

export type Severity = "critical" | "high" | "medium" | "low";
export type GapStatus = "open" | "remediating" | "recheck" | "closed";

export type Gap = {
  id: string;
  clientId: string;
  engagementId: string;
  controlId: string;
  title: string;
  detail: string;
  plan: string;
  severity: Severity;
  status: GapStatus;
  ownerId: string;
  due: string;
  createdAt: string;
};

export type ActivityKind = "status" | "upload" | "comment" | "approve" | "revise" | "gap" | "publish" | "assign";

export type Activity = {
  id: string;
  at: string;
  by: string;
  kind: ActivityKind;
  clientId: string;
  controlId?: string;
  text: string;
};

export type EvidenceRequest = {
  id: string;
  clientId: string;
  controlId: string;
  title: string;
  note: string;
  due: string;
  status: "open" | "submitted" | "accepted";
};

export type Notification = {
  id: string;
  at: string;
  text: string;
  href: string;
  read: boolean;
  kind: ActivityKind;
};

/* ───────── Modules added for the full product ───────── */

export type PolicyStatus = "draft" | "in_review" | "approved" | "retired";

export type Policy = {
  id: string;
  clientId: string;
  title: string;
  category: string;
  ownerId: string;
  version: string;
  status: PolicyStatus;
  updatedAt: string;
  reviewDue: string;
  ackRate: number;
  employees: number;
  frameworks: FrameworkKey[];
  sections: string[];
  words: number;
  versions: { v: string; at: string; by: string; note: string }[];
};

export type RiskTreatment = "mitigate" | "accept" | "transfer" | "avoid";
export type RiskStatus = "open" | "treating" | "accepted" | "closed";

export type Risk = {
  id: string;
  clientId: string;
  ref: string;
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  residualLikelihood: number;
  residualImpact: number;
  treatment: RiskTreatment;
  status: RiskStatus;
  ownerId: string;
  unifiedIds: string[];
  reviewedAt: string;
  notes: string;
};

export type PbcStatus = "requested" | "in_progress" | "submitted" | "accepted" | "followup";

export type PbcItem = {
  id: string;
  ref: string;
  request: string;
  controlId?: string;
  status: PbcStatus;
  due: string;
  assigneeId: string;
  sample?: number;
};

export type AuditPhase = "planning" | "fieldwork" | "reporting" | "complete";

export type Audit = {
  id: string;
  clientId: string;
  engagementId: string;
  firm: string;
  lead: string;
  kind: string;
  start: string;
  end: string;
  phase: AuditPhase;
  pbc: PbcItem[];
  meetings: { at: string; title: string; who: string }[];
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
  runs: number;
  lastRun?: string;
};

export type Integration = {
  id: string;
  name: string;
  category: "Identity" | "Cloud" | "Collaboration" | "Engineering" | "HR & devices" | "Ticketing";
  description: string;
  connected: boolean;
  collects: string[];
  items: number;
  lastSync?: string;
  mark: string;
  color: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  where: string;
};
