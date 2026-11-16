import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./designs.css";
import "./components.css";

const sans = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });
const jet = JetBrains_Mono({ variable: "--font-jet", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "SecureKnots Workspace", template: "%s · SecureKnots Workspace" },
  description: "Clients, controls, evidence and reviews for the SecureKnots team and its clients.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-design="meridian" className={`${sans.variable} ${mono.variable} ${serif.variable} ${space.variable} ${jet.variable}`}>
      <head>
        {/* Apply the saved design before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var d=localStorage.getItem("sk-design");if(d)document.documentElement.dataset.design=d}catch(e){}` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
