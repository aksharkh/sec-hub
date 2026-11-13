"use client";

import { Assistant } from "@/components/assistant/Assistant";
import { NewClientWizard } from "@/components/clients/NewClientWizard";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { SidebarBody } from "@/components/shell/Sidebar";
import { ShortcutsDialog, Topbar } from "@/components/shell/Topbar";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className={cn("hidden shrink-0 transition-[width] duration-300 ease-out-expo lg:block", collapsed ? "w-[60px]" : "w-[248px]")}>
        <SidebarBody collapsed={collapsed} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
        <main id="main" className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface lg:rounded-xl lg:border lg:border-line lg:shadow-panel">
          <Topbar />
          <div id="scroll" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
      <ShortcutsDialog />
      <NewClientWizard />
      <Assistant />
    </div>
  );
}
