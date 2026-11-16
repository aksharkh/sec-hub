import {
  BarChart3, Building2, CalendarDays, CircleAlert, ClipboardCheck, FileText, FolderOpen, GitCompareArrows, House, Inbox, Plug,
  ScrollText, Settings, ShieldCheck, Gauge, UsersRound, Workflow, ListChecks,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: typeof House; kbd?: string; count?: "reviews" | "gaps" | "pbc" | "risks"; badge?: string };

export const NAV_GROUPS: { id: string; label: string | null; items: NavItem[] }[] = [
  {
    id: "main",
    label: null,
    items: [
      { href: "/", label: "Home", icon: House, kbd: "G H" },
      { href: "/reviews", label: "Reviews", icon: Inbox, kbd: "G R", count: "reviews" },
      { href: "/calendar", label: "Calendar", icon: CalendarDays, kbd: "G T" },
    ],
  },
  {
    id: "work",
    label: "Client work",
    items: [
      { href: "/clients", label: "Clients", icon: Building2, kbd: "G C" },
      { href: "/audits", label: "Audits", icon: ClipboardCheck, kbd: "G A", count: "pbc" },
      { href: "/evidence", label: "Evidence", icon: FolderOpen, kbd: "G E" },
      { href: "/policies", label: "Policies", icon: FileText, kbd: "G P" },
      { href: "/questionnaires", label: "Questionnaires", icon: ListChecks, badge: "Auto" },
      { href: "/risks", label: "Risks", icon: Gauge, count: "risks" },
      { href: "/gaps", label: "Gaps", icon: CircleAlert, kbd: "G G", count: "gaps" },
    ],
  },
  {
    id: "insight",
    label: "Library & insight",
    items: [
      { href: "/mapping", label: "Control mapping", icon: GitCompareArrows, kbd: "G M" },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    id: "admin",
    label: "Workspace",
    items: [
      { href: "/automations", label: "Automations", icon: Workflow },
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/audit-log", label: "Audit log", icon: ScrollText },
      { href: "/team", label: "Team", icon: UsersRound },
      { href: "/team/roles", label: "Roles & permissions", icon: ShieldCheck },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const NAV = NAV_GROUPS.flatMap((g) => g.items);

export const TRUST_URL = "http://localhost:3040";
