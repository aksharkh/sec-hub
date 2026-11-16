"use client";

import { useState } from "react";
import { HomeBento, HomeClassic, HomeEditorial, HomeExecutive, HomeOrbit, HomePoster, HomeTerminal } from "@/components/home/layouts";
import { useHome } from "@/components/home/useHome";
import { Skeleton } from "@/components/ui/misc";
import { ApproveDialog } from "@/components/workspace/ReviewDialogs";
import type { DesignId } from "@/lib/designs";
import type { Control } from "@/lib/types";
import { useDesign } from "@/lib/useDesign";

/** Same data, a different Home for each design. */
const LAYOUT: Record<DesignId, typeof HomeClassic> = {
  meridian: HomeEditorial,
  mono: HomeClassic,
  boardroom: HomeExecutive,
  aurora: HomeBento,
  brutal: HomePoster,
  spatial: HomeOrbit,
  nocturne: HomeTerminal,
};

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-10 pt-7 md:px-6">
      <Skeleton className="h-9 w-80" />
      <Skeleton className="mt-3 h-4 w-[420px] max-w-full" />
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[420px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const h = useHome();
  const design = useDesign();
  const [approving, setApproving] = useState<Control | null>(null);
  if (!h.ready || !h.me) return <HomeSkeleton />;
  const Layout = LAYOUT[design.id];
  return (
    <>
      <Layout h={h} onApprove={setApproving} />
      <ApproveDialog control={approving} open={!!approving} onOpenChange={(o) => !o && setApproving(null)} />
    </>
  );
}
