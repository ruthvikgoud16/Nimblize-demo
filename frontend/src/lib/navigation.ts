import {
  LayoutDashboard,
  Library,
  FlaskConical,
  Workflow,
  BarChart3,
  UserCheck,
  Settings,
  FileText,
  Network,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Platform overview and live metrics",
  },
  {
    label: "Prompt Library",
    href: "/library",
    icon: Library,
    description: "Browse and manage prompt templates",
  },
  {
    label: "Playground",
    href: "/playground",
    icon: FlaskConical,
    description: "Test and tune prompt parameters",
  },
  {
    label: "Automation",
    href: "/automation",
    icon: Workflow,
    description: "CIMS pipeline orchestration",
  },
  {
    label: "Workflow Explorer",
    href: "/workflow",
    icon: Network,
    description: "System architecture and node tracing",
  },
  {
    label: "Evaluation",
    href: "/evaluation",
    icon: BarChart3,
    description: "RAGAS quality metrics and SLA",
  },
  {
    label: "Reports Center",
    href: "/reports",
    icon: FileText,
    description: "Generated markdown and PDF reports",
  },
  {
    label: "Review Queue",
    href: "/review",
    icon: UserCheck,
    description: "Human-in-the-loop review console",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Environment and provider configuration",
  },
];
