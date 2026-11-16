"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarRange, Check, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Code, FrameworkChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/form";
import { FileIcon } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { UNIFIED } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { FileKind } from "@/lib/types";
import { cn } from "@/lib/utils";

type Found = { name: string; kind: FileKind; sizeKb: number; label: string; uc: string[]; conf: number; period: string };

const RULES: [RegExp, string, string[]][] = [
  [/access.?review|user.?access|entitlement/i, "Access review sign-off", ["UC-ACC-03", "UC-ACC-01"]],
  [/mfa|okta|authenticat|2fa|passkey/i, "MFA configuration export", ["UC-ACC-02", "UC-ACC-05"]],
  [/termin|leaver|offboard/i, "Leaver access removal report", ["UC-ACC-01"]],
  [/privileg|admin/i, "Privileged access listing", ["UC-ACC-04"]],
  [/polic/i, "Policy document", ["UC-GOV-01"]],
  [/incident|ir.?plan|tabletop/i, "Incident response evidence", ["UC-INR-01", "UC-INR-02"]],
  [/backup|restore|dr\b|disaster/i, "Backup and restore test", ["UC-BCP-01", "UC-BCP-02"]],
  [/vuln|scan|nessus|qualys|patch/i, "Vulnerability scan report", ["UC-OPS-03"]],
  [/pen.?test|pentest|penetration/i, "Penetration test report", ["UC-OPS-04"]],
  [/train|awareness|phish/i, "Training completion report", ["UC-HR-01"]],
  [/vendor|supplier|sub.?processor|soc.?2.?report/i, "Vendor review", ["UC-VEN-01", "UC-VEN-02"]],
  [/encrypt|kms|key.?rotation/i, "Encryption settings", ["UC-CRY-01"]],
  [/tls|ssl|certificate/i, "TLS configuration", ["UC-CRY-02"]],
  [/log|cloudtrail|siem|splunk|datadog/i, "Logging configuration", ["UC-OPS-01", "UC-OPS-02"]],
  [/change|github|branch|pull.?request|jira/i, "Change management records", ["UC-CHG-01", "UC-SDL-01"]],
  [/risk/i, "Risk assessment", ["UC-RSK-01", "UC-RSK-02"]],
  [/asset|inventory|mdm|intune/i, "Asset inventory", ["UC-AST-01"]],
  [/privacy|consent|dsar|notice/i, "Privacy records", ["UC-PRV-01", "UC-PRV-02"]],
  [/background|nda|screening/i, "Background checks and NDAs", ["UC-HR-02"]],
];

const kindOf = (n: string): FileKind => {
  const e = n.split(".").pop()?.toLowerCase() ?? "";
  return e === "pdf" ? "pdf" : ["doc", "docx", "txt", "md"].includes(e) ? "docx" : ["xls", "xlsx"].includes(e) ? "xlsx" : e === "csv" ? "csv" : ["png", "jpg", "jpeg", "webp"].includes(e) ? "png" : "zip";
};

function analyze(name: string, sizeKb: number): Found {
  const hit = RULES.find(([re]) => re.test(name));
  const q = /q([1-4])/i.exec(name)?.[1];
  const period = q ? ["Jan 1 to Mar 31", "Apr 1 to Jun 30", "Jul 1 to Sep 30", "Oct 1 to Dec 31"][Number(q) - 1] + ", 2026" : "Aug 14 to Nov 12, 2026";
  return {
    name, kind: kindOf(name), sizeKb, period,
    label: hit?.[1] ?? "Supporting document",
    uc: hit?.[2] ?? ["UC-GOV-01"],
    conf: hit ? 86 + (name.length % 12) : 58,
  };
}

export const openSmartUpload = () => window.dispatchEvent(new CustomEvent("sk:smart-upload"));

export function SmartDrop() {
  const pathname = usePathname();
  const clients = useStore((s) => s.clients);
  const engagements = useStore((s) => s.engagements);
  const controls = useStore((s) => s.controls);
  const fileTo = useStore((s) => s.fileTo);
  const [over, setOver] = useState(false);
  const [files, setFiles] = useState<Found[] | null>(null);
  const [phase, setPhase] = useState<"reading" | "ready">("reading");
  const [client, setClient] = useState("northwind");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const start = (list: FileList | null) => {
    if (!list?.length) return;
    const fromUrl = /^\/clients\/([^/]+)/.exec(pathname)?.[1];
    const named = clients.find((c) => Array.from(list).some((f) => f.name.toLowerCase().includes(c.name.split(" ")[0].toLowerCase())));
    setClient(named?.id ?? fromUrl ?? "northwind");
    setFiles(Array.from(list).map((f) => analyze(f.name, Math.max(12, f.size / 1024))));
    setPicked({});
    setPhase("reading");
    setTimeout(() => setPhase("ready"), 1500);
  };

  useEffect(() => {
    const isFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => { if (!isFiles(e)) return; depth.current++; setOver(true); };
    const leave = (e: DragEvent) => { if (!isFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); };
    const overFn = (e: DragEvent) => { if (isFiles(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!isFiles(e)) return;
      depth.current = 0;
      setOver(false);
      // Drop targets inside the page (control dropzones) handle their own files.
      if ((e.target as HTMLElement).closest("[data-dropzone]")) return;
      e.preventDefault();
      start(e.dataTransfer?.files ?? null);
    };
    const pick = () => input.current?.click();
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", overFn);
    window.addEventListener("drop", drop);
    window.addEventListener("sk:smart-upload", pick);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", overFn);
      window.removeEventListener("drop", drop);
      window.removeEventListener("sk:smart-upload", pick);
    };
  });

  /** Every control in the client's frameworks that the detected evidence type satisfies. */
  const matches = useMemo(() => {
    if (!files) return [];
    const engs = engagements.filter((e) => e.clientId === client);
    return files.map((f) => {
      const targets = f.uc.flatMap((u) =>
        engs.map((e) => controls[`${e.id}-${u}`]).filter(Boolean).map((c) => ({ c, fw: engs.find((e) => e.id === c.engagementId)!.framework, uc: u })),
      );
      return { f, targets };
    });
  }, [files, engagements, controls, client]);

  const key = (i: number, cid: string) => `${i}:${cid}`;
  const on = (i: number, cid: string) => picked[key(i, cid)] ?? true;
  const total = matches.reduce((n, m, i) => n + m.targets.filter((t) => on(i, t.c.id)).length, 0);
  const fws = new Set(matches.flatMap((m, i) => m.targets.filter((t) => on(i, t.c.id)).map((t) => t.fw))).size;

  const fileAll = () => {
    matches.forEach((m, i) => {
      const chosen = m.targets.filter((t) => on(i, t.c.id)).map((t) => t.c.id);
      if (chosen.length) fileTo(chosen, { name: m.f.name, kind: m.f.kind, sizeKb: m.f.sizeKb });
    });
    toast.success(`${files!.length} file${files!.length > 1 ? "s" : ""} filed to ${total} controls`, { description: `Across ${fws} framework${fws > 1 ? "s" : ""} for ${clients.find((c) => c.id === client)?.name}. No folders, no manual mapping.` });
    setFiles(null);
  };

  return (
    <>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => { start(e.target.files); e.target.value = ""; }} />
      <AnimatePresence>
        {over && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-[95] grid place-items-center bg-canvas/70 backdrop-blur-md">
            <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-brand/60" />
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} className="text-center">
              <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} className="mx-auto grid size-20 place-items-center rounded-3xl border border-line bg-surface shadow-pop">
                <SecureKnotsLogo variant="knot" className="h-10 text-ink" />
              </motion.div>
              <p className="serif mt-5 text-[34px] leading-tight text-ink">Drop to file it automatically</p>
              <p className="mt-1 text-[14px] text-muted">SecureKnots reads each file and links it to every control it satisfies, in every framework.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!files} onOpenChange={(o) => !o && setFiles(null)}>
        <DialogContent wide title="Smart filing" description="Each file is read, classified and matched to the client's controls. Untick anything you don't want filed.">
          {phase === "reading" ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="relative grid size-16 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand/15" />
                <span className="grid size-14 place-items-center rounded-full bg-ink text-inverse"><Wand2 className="size-6" /></span>
              </div>
              <p className="mt-5 text-[15px] font-semibold text-ink">Reading {files?.length} file{files && files.length > 1 ? "s" : ""}</p>
              <p className="mt-1 text-[13px] text-muted">Detecting document type, dates covered and system names</p>
            </div>
          ) : (
            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-muted">Client</span>
                <Select size="sm" className="w-[220px]" value={client} onValueChange={setClient} options={clients.map((c) => ({ value: c.id, label: c.name }))} />
              </div>
              {matches.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-xl border border-line">
                  <div className="flex items-start gap-3 border-b border-line px-3.5 py-3">
                    <FileIcon kind={m.f.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">{m.f.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                        <span className="flex items-center gap-1 font-medium text-ink-2"><Sparkles className="size-3" />{m.f.label}</span>
                        <span className="flex items-center gap-1"><CalendarRange className="size-3" />Covers {m.f.period}</span>
                      </p>
                    </div>
                    <span className={cn("tnum shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold", m.f.conf >= 80 ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>{m.f.conf}% match</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {m.targets.length === 0 && <li className="px-3.5 py-2.5 text-[12.5px] text-muted">No matching control in this client&apos;s frameworks. It will be kept in Evidence as unfiled.</li>}
                    {m.targets.map((t) => (
                      <li key={t.c.id} className="flex items-center gap-3 px-3.5 py-2">
                        <Checkbox checked={on(i, t.c.id)} onCheckedChange={(v) => setPicked((p) => ({ ...p, [key(i, t.c.id)]: !!v }))} aria-label={`File to ${t.c.code}`} />
                        <FrameworkChip fw={t.fw} size="sm" />
                        <Code className="text-[11.5px]">{t.c.code}</Code>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{UNIFIED.find((u) => u.id === t.uc)?.title}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}
          {phase === "ready" && (
            <DialogFooter className="justify-between">
              <span className="text-[12.5px] text-muted"><b className="tnum text-ink">{total}</b> controls across <b className="tnum text-ink">{fws}</b> framework{fws === 1 ? "" : "s"}</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setFiles(null)}>Cancel</Button>
                <Button variant="primary" disabled={!total} onClick={fileAll}><Check /> File everything</Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
