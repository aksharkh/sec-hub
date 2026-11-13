"use client";

import { motion } from "motion/react";

/** Threads drawn toward the knot: the SecureKnots motif, as thin lines. */
export function Threads({ className }: { className?: string }) {
  const paths = [
    "M-20 120 C 160 140, 220 300, 300 330",
    "M-20 260 C 120 250, 200 320, 300 340",
    "M-20 420 C 140 410, 210 370, 300 350",
    "M-20 560 C 160 520, 230 400, 300 360",
    "M620 80 C 460 140, 400 290, 320 330",
    "M620 300 C 480 300, 400 330, 320 345",
    "M620 520 C 470 480, 390 400, 320 360",
  ];
  return (
    <svg viewBox="0 0 600 640" className={className} fill="none" aria-hidden preserveAspectRatio="xMidYMid slice">
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="url(#thread)"
          strokeWidth={1.2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <defs>
        <linearGradient id="thread" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a3a3a3" stopOpacity="0" />
          <stop offset="0.45" stopColor="#a3a3a3" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#a3a3a3" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
