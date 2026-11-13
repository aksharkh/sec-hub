"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CloudDownload, Folder, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch, Tabs } from "@/components/ui/form";
import { Card, PageHeader } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { ME } from "@/lib/mock/seed";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "profile" | "notifications" | "integrations" | "security" | "demo";

function Row({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        {body && <p className="mt-0.5 text-[12.5px] leading-5 text-muted">{body}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function MsLogo() {
  return (
    <svg viewBox="0 0 21 21" className="size-5" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" /><rect x="11" y="1" width="9" height="9" fill="#7fba00" /><rect x="1" y="11" width="9" height="9" fill="#00a4ef" /><rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const FOLDERS = ["Northwind Cloud", "Kestrel Pay", "Helio Health", "Lumen Analytics", "Brightline Defense Systems", "Vantage Learning", "Orbit HR", "Arcadia Freight"];

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!open || step === 0 || step > FOLDERS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 420);
    return () => clearTimeout(t);
  }, [open, step]);
  const done = step > FOLDERS.length;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setStep(0); onOpenChange(o); }}>
      <DialogContent title="Import from OneDrive" description="Reads the Client › Service › Control folders the team uses today and files each document against the matching control.">
        <div className="px-5 py-4">
          {step === 0 ? (
            <div className="rounded-xl border border-line bg-raised p-4 text-[13px] text-ink-2">
              <p className="font-medium text-ink">SecureKnots Shared › Clients</p>
              <p className="mt-1 text-muted">8 client folders · 1,204 files · 2.3 GB</p>
              <p className="mt-3 text-[12.5px] text-muted">Files that can&apos;t be matched to a control go to a review list instead of being guessed.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {FOLDERS.map((f, i) => {
                const state = i + 1 < step ? "done" : i + 1 === step ? "doing" : "wait";
                return (
                  <li key={f} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13px]">
                    <Folder className={cn("size-4", state === "wait" ? "text-faint" : "text-brand")} />
                    <span className={cn("flex-1", state === "wait" ? "text-faint" : "text-ink")}>{f}</span>
                    {state === "done" && <span className="tnum flex items-center gap-1 text-[12px] text-ok"><Check className="size-3.5" />{90 + ((i * 53) % 120)} files</span>}
                    {state === "doing" && <span className="size-3.5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />}
                  </li>
                );
              })}
            </ul>
          )}
          <AnimatePresence>
            {done && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg bg-ok-soft px-3 py-2 text-[12.5px] text-ok">
                1,171 files matched to controls. 33 need a quick look in Evidence › Unmatched.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <DialogFooter>
          {done ? (
            <Button variant="primary" onClick={() => { setStep(0); onOpenChange(false); toast.success("OneDrive import finished"); }}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setStep(0); onOpenChange(false); }}>Cancel</Button>
              <Button variant="primary" disabled={step > 0} onClick={() => setStep(1)}><CloudDownload /> Start import</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [importing, setImporting] = useState(false);
  const me = useStore((s) => s.members.find((m) => m.id === ME));
  const reset = useStore((s) => s.reset);

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-12 pt-7 md:px-6">
      <PageHeader title="Settings" description="Your profile, notifications and how the Workspace connects to the tools SecureKnots already uses." />
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profile", label: "Profile" },
          { value: "notifications", label: "Notifications" },
          { value: "integrations", label: "Integrations" },
          { value: "security", label: "Security" },
          { value: "demo", label: "Demo data" },
        ]}
      />
      <Card className="mt-5 px-5">
        {tab === "profile" && me && (
          <>
            <Row title="Photo and name" body="Shown to the team and, on client-visible comments, to clients.">
              <div className="flex items-center gap-3"><Avatar person={me} size="lg" /><Button size="sm">Change photo</Button></div>
            </Row>
            <Row title="Display name"><Input defaultValue={me.name} className="w-[260px]" /></Row>
            <Row title="Title" body="Appears under your name in client dashboards."><Input defaultValue={me.title} className="w-[260px]" /></Row>
            <Row title="Time zone"><Select value="et" onValueChange={() => {}} className="w-[260px]" options={[{ value: "et", label: "Eastern Time (Wilmington)" }, { value: "uk", label: "London" }, { value: "ist", label: "India Standard Time" }]} /></Row>
          </>
        )}
        {tab === "notifications" && (
          <>
            {[
              ["A control passes QA and needs my approval", "Email and in-app", true],
              ["Something I own is sent back for revision", "Email and in-app", true],
              ["A client uploads evidence or replies", "In-app; daily email digest", true],
              ["A gap I own is past its due date", "Email every Monday", true],
              ["Weekly summary of every engagement", "Email on Friday afternoons", false],
            ].map(([t, b, on]) => (
              <Row key={t as string} title={t as string} body={b as string}><Switch defaultChecked={on as boolean} onCheckedChange={() => toast("Notification preference saved")} /></Row>
            ))}
          </>
        )}
        {tab === "integrations" && (
          <>
            <Row title="Microsoft 365 single sign-on" body="The team signs in with their SecureKnots Microsoft accounts. MFA is enforced by Entra ID.">
              <div className="flex items-center gap-3"><MsLogo /><Badge tone="ok">Connected</Badge></div>
            </Row>
            <Row title="Outlook email" body="Notifications and client requests are sent from compliance@secureknots.com.">
              <Badge tone="ok">Connected</Badge>
            </Row>
            <Row title="OneDrive import" body="Bring the existing Client › Service › Control folders into the Workspace in one pass.">
              <Button variant="primary" onClick={() => setImporting(true)}><CloudDownload /> Import folders</Button>
            </Row>
            <Row title="Microsoft Teams" body="Post approvals and overdue alerts to a team channel.">
              <Button onClick={() => toast("Teams connection", { description: "Opens the Microsoft consent screen in the live product." })}>Connect</Button>
            </Row>
          </>
        )}
        {tab === "security" && (
          <>
            <Row title="Require MFA for clients" body="Client users must set up an authenticator app or passkey before seeing evidence."><Switch defaultChecked /></Row>
            <Row title="Session timeout" body="Signed-out after inactivity."><Select value="8h" onValueChange={() => {}} className="w-[180px]" options={[{ value: "1h", label: "1 hour" }, { value: "8h", label: "8 hours" }, { value: "24h", label: "24 hours" }]} /></Row>
            <Row title="Download watermarking" body="Stamp client evidence with the viewer's name and time when downloaded."><Switch defaultChecked /></Row>
            <Row title="Audit log retention" body="Every view, upload, status change and approval is kept for this long."><Select value="3y" onValueChange={() => {}} className="w-[180px]" options={[{ value: "1y", label: "1 year" }, { value: "3y", label: "3 years" }, { value: "7y", label: "7 years" }]} /></Row>
          </>
        )}
        {tab === "demo" && (
          <Row title="Reset demo data" body="Puts every client, control, upload and approval back to the starting state. Changes you made in this browser are cleared.">
            <Button variant="danger" onClick={() => { reset(); toast.success("Demo data reset"); }}><RefreshCcw /> Reset</Button>
          </Row>
        )}
      </Card>
      <ImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}
