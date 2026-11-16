export type DesignId = "meridian" | "mono" | "boardroom" | "aurora" | "brutal" | "spatial" | "nocturne";
export type ChartKind = "editorial" | "dots" | "classic" | "rings" | "blocks" | "iso" | "neon";

export const DESIGNS: {
  id: DesignId;
  name: string;
  tagline: string;
  audience: string;
  scheme: "both" | "light" | "dark";
  chart: ChartKind;
}[] = [
  { id: "meridian", name: "Meridian", tagline: "Matches secureknots.com. A morning newspaper: top navigation, serif headlines", audience: "Brand", scheme: "both", chart: "editorial" },
  { id: "mono", name: "Mono", tagline: "A Linear-style sidebar in black, white and gray. Quiet and precise", audience: "Minimal", scheme: "both", chart: "dots" },
  { id: "boardroom", name: "Boardroom", tagline: "Navy side rail, large type and an executive summary with red, amber, green", audience: "Every generation", scheme: "light", chart: "classic" },
  { id: "aurora", name: "Aurora", tagline: "Frosted glass, a bento home and a dock at the bottom of the screen", audience: "Gen Z", scheme: "light", chart: "rings" },
  { id: "brutal", name: "Brutal", tagline: "Tab strip, a live alert ticker, hard shadows and a poster home", audience: "Gen Z", scheme: "light", chart: "blocks" },
  { id: "spatial", name: "Spatial", tagline: "A floating glass window, an icon ornament and 3D charts", audience: "Futuristic", scheme: "dark", chart: "iso" },
  { id: "nocturne", name: "Nocturne", tagline: "A terminal: command bar, file tree, status line and ASCII charts", audience: "Night owls", scheme: "dark", chart: "neon" },
];

export const designOf = (id: string | undefined) => DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];

export const CHARTS: { id: ChartKind; label: string }[] = [
  { id: "iso", label: "3D towers" },
  { id: "rings", label: "Rings" },
  { id: "neon", label: "Neon bars" },
  { id: "blocks", label: "Blocks" },
  { id: "dots", label: "Dot matrix" },
  { id: "classic", label: "Classic bars" },
  { id: "editorial", label: "Editorial" },
];
