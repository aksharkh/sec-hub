import type { Control, Engagement, Evidence } from "./types";

/** Stable pseudo-hash so the demo's checks don't change between reloads. */
const h = (s: string) => {
  let x = 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(x);
};

export type Check = { label: string; pass: boolean; note?: string };

/** What the evidence pre-check looks at for one file. */
export function checksFor(e: Evidence): Check[] {
  const k = h(e.id);
  const rejected = e.state === "rejected";
  const list: Check[] = [
    { label: "Covers the full audit period", pass: !(rejected && k % 2 === 0) && k % 7 !== 0, note: "Earliest entry is 6 weeks after the period starts" },
    { label: "Matches what the control asks for", pass: k % 11 !== 0, note: "Looks like a different system's export" },
  ];
  if (e.kind === "png") list.push({ label: "Date and system name visible", pass: !(rejected && k % 2 === 1) && k % 5 !== 0, note: "No timestamp or hostname in the screenshot" });
  if (e.kind === "pdf" || e.kind === "docx") list.push({ label: "Approved or signed by an owner", pass: k % 4 !== 0, note: "No approval page or signature found" });
  if (e.kind === "xlsx" || e.kind === "csv") list.push({ label: "Complete population, not a sample", pass: k % 6 !== 0, note: "Row count is lower than the user count in scope" });
  if (e.expires) list.push({ label: "Still fresh", pass: new Date(e.expires).getTime() > Date.now(), note: "Past its refresh date" });
  return list;
}

export function precheck(files: Evidence[]) {
  const all = files.flatMap((f) => checksFor(f).map((c) => ({ ...c, file: f })));
  const failed = all.filter((c) => !c.pass);
  return { total: all.length, passed: all.length - failed.length, failed };
}

/**
 * Forecast when an engagement reaches 100% approved, from the pace since kickoff.
 * Returns the projected date and days early (+) or late (-) against the target.
 */
export function forecast(controls: Control[], e: Engagement, startedAt: string) {
  const total = controls.length || 1;
  const done = controls.filter((c) => c.status === "approved").length;
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsed = Math.max(7, (now - start) / 864e5);
  // In-review and revise work counts partly toward pace: it is close to done.
  const near = controls.filter((c) => c.status === "review" || c.status === "revise").length * 0.6;
  // Current pace: the faster of the lifetime average and the last four weeks of approvals.
  const recent = controls.filter((c) => c.approvals.approved && now - new Date(c.approvals.approved.at).getTime() < 28 * 864e5).length;
  const pace = Math.max(0.05, (done + near) / elapsed, (recent + near * 0.25) / 28);
  const remaining = total - done;
  const projected = new Date(now + (remaining / pace) * 864e5);
  const target = new Date(e.target).getTime();
  const slack = Math.round((target - projected.getTime()) / 864e5);
  // Under 10% approved there is not enough history for a meaningful projection.
  const early = done / total < 0.1;
  return { done, total, pace, projected: projected.toISOString(), slack, start: new Date(start).toISOString(), pct: Math.round((done / total) * 100), now, early };
}
