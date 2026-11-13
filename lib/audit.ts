import type { Tone } from "./catalog";
import type { AuditPhase, PbcStatus } from "./types";

export const PHASE: Record<AuditPhase, { label: string; tone: Tone }> = {
  planning: { label: "Planning", tone: "neutral" },
  fieldwork: { label: "Fieldwork", tone: "rev" },
  reporting: { label: "Reporting", tone: "info" },
  complete: { label: "Complete", tone: "ok" },
};
export const PHASE_ORDER: AuditPhase[] = ["planning", "fieldwork", "reporting", "complete"];

export const PBC: Record<PbcStatus, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "neutral" },
  in_progress: { label: "Collecting", tone: "info" },
  submitted: { label: "With auditor", tone: "rev" },
  followup: { label: "Follow-up", tone: "warn" },
  accepted: { label: "Accepted", tone: "ok" },
};
export const PBC_ORDER: PbcStatus[] = ["requested", "in_progress", "submitted", "followup", "accepted"];
