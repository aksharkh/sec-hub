"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Tooltip } from "radix-ui";
import { useStore } from "@/lib/store";

function StoreBoot() {
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).finally(() => useStore.getState().init());
  }, []);
  return null;
}

function Toasts() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      offset={20}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex w-[360px] items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink shadow-pop",
          title: "font-medium leading-5",
          description: "text-muted leading-5 mt-0.5",
          actionButton:
            "ml-auto shrink-0 rounded-md bg-subtle px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-subtle-2 transition-colors",
          icon: "mt-0.5",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <Tooltip.Provider delayDuration={250} skipDelayDuration={150}>
        <StoreBoot />
        {children}
        <Toasts />
      </Tooltip.Provider>
    </ThemeProvider>
  );
}
