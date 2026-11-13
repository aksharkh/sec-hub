import type { PolicyStatus } from "./types";

export const POLICY_STATUS: Record<PolicyStatus, { label: string; tone: "ok" | "rev" | "neutral" | "warn" }> = {
  approved: { label: "Approved", tone: "ok" },
  in_review: { label: "In review", tone: "rev" },
  draft: { label: "Draft", tone: "neutral" },
  retired: { label: "Retired", tone: "warn" },
};
