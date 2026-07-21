import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionsGrid({ actions, className }: QuickActionsGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="relative flex flex-col items-stretch duration-300 ease-out p-4 group rounded-xl cursor-pointer select-none"
        >
          {/* Top hover sliding layer */}
          <span className="absolute inset-0 z-20 block w-full h-full duration-300 ease-out bg-transparent border border-transparent border-dashed group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:border-neutral-300 dark:group-hover:border-neutral-700 rounded-xl group-hover:bg-card"></span>
          
          {/* Bottom shadow border layer */}
          <span className="absolute inset-0 z-10 block w-full h-full duration-300 ease-out border border-dashed rounded-xl border-neutral-300 dark:border-neutral-700 group-hover:translate-x-1 group-hover:translate-y-1"></span>

          {/* Content layer */}
          <span className="relative z-30 flex items-center gap-4 duration-300 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1 w-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </span>
        </Link>
      ))}
    </div>
  );
}
