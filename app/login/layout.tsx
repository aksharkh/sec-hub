import type { Metadata } from "next";
import { SecureKnotsLogo } from "@/components/brand/SecureKnotsLogo";
import { Threads } from "@/components/brand/Threads";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0a0a0a] text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_52%_52%,rgba(255,255,255,0.10),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent)]" />
        <Threads className="absolute inset-0 h-full w-full" />
        <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 -m-10 rounded-full bg-white/10 blur-3xl" />
          <SecureKnotsLogo className="relative h-[132px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]" onDark title="SecureKnots" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <p className="flex items-center gap-2 text-[13px] font-medium text-white/70">
            SecureKnots <span className="text-white/30">/</span> Workspace
          </p>
          <div className="max-w-md">
            <p className="serif text-[40px] leading-[1.05] text-white xl:text-[46px]">
              Every client, control and piece of evidence, <span className="italic text-white/60">in one place.</span>
            </p>
            <ul className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[12.5px] leading-5 text-white/60">
              <li><span className="block font-medium text-white">Microsoft 365</span>Sign in with your work account</li>
              <li><span className="block font-medium text-white">Team and clients</span>One workspace, separate views</li>
              <li><span className="block font-medium text-white">Every action logged</span>Uploads, reviews, approvals</li>
            </ul>
          </div>
        </div>
      </aside>
      <main className="flex min-h-dvh items-center justify-center px-6 py-12">{children}</main>
    </div>
  );
}
