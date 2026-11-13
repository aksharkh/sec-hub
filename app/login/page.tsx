"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

function MsLogo() {
  return (
    <svg viewBox="0 0 21 21" className="size-[18px]" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" /><rect x="11" y="1" width="9" height="9" fill="#7fba00" /><rect x="1" y="11" width="9" height="9" fill="#00a4ef" /><rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"ms" | "email" | null>(null);
  const go = (how: "ms" | "email") => {
    setBusy(how);
    setTimeout(() => router.push("/login/verify"), 700);
  };
  return (
    <div className="fade-up w-full max-w-[380px]">
      <SecureKnotsLogo className="h-11 lg:hidden" title="SecureKnots" />
      <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.025em] text-ink lg:mt-0">Sign in to Workspace</h1>
      <p className="mt-1.5 text-[14px] text-muted">For the SecureKnots team and invited client users.</p>

      <Button variant="secondary" size="lg" className="mt-8 w-full gap-2.5" onClick={() => go("ms")} disabled={!!busy}>
        {busy === "ms" ? <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink" /> : <MsLogo />}
        Continue with Microsoft 365
      </Button>

      <div className="my-6 flex items-center gap-3 text-[12px] text-faint">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); go("email"); }} className="space-y-4">
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required defaultValue="seema.abdul@secureknots.com" autoComplete="username" />
        </div>
        <div>
          <Label htmlFor="pw" hint={<Link href="/login" className="text-brand hover:underline">Forgot password?</Link>}>Password</Label>
          <div className="relative">
            <Input id="pw" type={show ? "text" : "password"} required defaultValue="demo-password" autoComplete="current-password" className="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!!busy}>
          {busy === "email" ? <span className="size-4 animate-spin rounded-full border-2 border-on-brand/30 border-t-on-brand" /> : <>Continue <ArrowRight /></>}
        </Button>
      </form>

      <p className="mt-8 text-[12.5px] leading-5 text-muted">
        Client users: use the link in your invitation email. Every sign-in needs a second factor.
      </p>
    </div>
  );
}
