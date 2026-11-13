"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [ok, setOk] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const set = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      setCode((c) => c.map((x, j) => (j === i ? "" : x)));
      return;
    }
    const next = [...code];
    digits.split("").forEach((d, k) => { if (i + k < 6) next[i + k] = d; });
    setCode(next);
    const focus = Math.min(5, i + digits.length);
    refs.current[focus]?.focus();
    if (next.every(Boolean)) {
      setOk(true);
      setTimeout(() => router.push("/"), 900);
    }
  };

  return (
    <div className="fade-up w-full max-w-[380px]">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Back</Link>
      <div className="mt-8 grid size-12 place-items-center rounded-2xl border border-line bg-raised text-brand shadow-xs">
        {ok ? <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }}><Check className="size-5 text-ok" /></motion.span> : <Smartphone className="size-5" />}
      </div>
      <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.025em] text-ink">{ok ? "Verified" : "Enter your code"}</h1>
      <p className="mt-1.5 text-[14px] text-muted">{ok ? "Opening your workspace." : "Open Microsoft Authenticator and enter the 6-digit code for SecureKnots."}</p>
      <div className="mt-8 flex gap-2" onPaste={(e) => { e.preventDefault(); set(0, e.clipboardData.getData("text")); }}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={d}
            autoFocus={i === 0}
            inputMode="numeric"
            maxLength={6}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
            className={cn(
              "tnum h-14 w-full min-w-0 rounded-xl border bg-surface text-center text-[22px] font-semibold text-ink shadow-xs outline-none transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_var(--ring)]",
              ok ? "border-ok" : "border-line-strong",
              i === 2 && "mr-2",
            )}
          />
        ))}
      </div>
      <p className="mt-4 text-[12.5px] text-muted">Demo: type any six digits.</p>
    </div>
  );
}
