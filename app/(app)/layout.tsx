"use client";

import { Assistant } from "@/components/assistant/Assistant";
import { SmartDrop } from "@/components/ai/SmartDrop";
import { NewClientWizard } from "@/components/clients/NewClientWizard";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { AuroraShell, BoardroomShell, BrutalShell, MeridianShell, MonoShell, NocturneShell, SpatialShell } from "@/components/shell/shells";
import { ShortcutsDialog } from "@/components/shell/Topbar";
import { useDesign } from "@/lib/useDesign";

const SHELLS = {
  meridian: MeridianShell,
  mono: MonoShell,
  boardroom: BoardroomShell,
  aurora: AuroraShell,
  brutal: BrutalShell,
  spatial: SpatialShell,
  nocturne: NocturneShell,
} as const;

/** Each design has its own app frame: navigation, header and page chrome. Pages are shared. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const design = useDesign();
  const Shell = SHELLS[design.id];
  return (
    <>
      <div data-shell={design.id} className="contents">
        <Shell>{children}</Shell>
      </div>
      <CommandPalette />
      <ShortcutsDialog />
      <NewClientWizard />
      <Assistant />
      <SmartDrop />
    </>
  );
}
