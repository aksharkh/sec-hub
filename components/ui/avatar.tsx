import type { CSSProperties } from "react";
import type { Person } from "@/lib/store";
import { cn, initials } from "@/lib/utils";

const SIZES = { xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-7 text-[11px]", lg: "size-9 text-[13px]", xl: "size-12 text-[16px]" };

export function Avatar({ person, size = "md", className, ring }: { person: Pick<Person, "name" | "hue" | "client">; size?: keyof typeof SIZES; className?: string; ring?: boolean }) {
  return (
    <span
      title={person.name}
      style={{ "--h": person.hue } as CSSProperties}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-tight",
        "bg-[hsl(var(--h)_62%_91%)] text-[hsl(var(--h)_45%_30%)] dark:bg-[hsl(var(--h)_10%_20%)] dark:text-[hsl(var(--h)_25%_84%)]",
        person.client && "rounded-[30%]",
        ring && "ring-2 ring-surface",
        SIZES[size],
        className,
      )}
    >
      {initials(person.name)}
    </span>
  );
}

export function AvatarStack({ people, max = 3, size = "sm" }: { people: Pick<Person, "name" | "hue" | "client">[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((p) => (
        <Avatar key={p.name} person={p} size={size} ring />
      ))}
      {rest > 0 && (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-subtle-2 font-medium text-muted ring-2 ring-surface", SIZES[size])}>+{rest}</span>
      )}
    </span>
  );
}

/** Client logo stand-in: a monogram tile in the client's hue. */
export function ClientMark({ name, hue, size = "md", className }: { name: string; hue: number; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = { sm: "size-6 rounded-md text-[10px]", md: "size-8 rounded-lg text-[12px]", lg: "size-11 rounded-xl text-[15px]", xl: "size-14 rounded-2xl text-[19px]" }[size];
  return (
    <span
      style={{ "--h": hue } as CSSProperties}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold tracking-tight text-white",
        "bg-[linear-gradient(160deg,hsl(var(--h)_58%_52%),hsl(var(--h)_62%_38%))] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(15_23_41/0.18)]",
        s,
        className,
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
      <span className="relative">{initials(name)}</span>
    </span>
  );
}
