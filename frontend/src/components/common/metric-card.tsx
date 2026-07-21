"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accentColor?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const accentMap = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  accentColor = "primary",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-stretch duration-300 ease-out p-5 group rounded-xl cursor-pointer select-none",
        className
      )}
    >
      {/* Top hover sliding layer */}
      <span className="absolute inset-0 z-20 block w-full h-full duration-300 ease-out bg-transparent border border-transparent border-dashed group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 group-hover:border-neutral-300 dark:group-hover:border-neutral-700 rounded-xl group-hover:bg-card"></span>
      
      {/* Bottom shadow border layer */}
      <span className="absolute inset-0 z-10 block w-full h-full duration-300 ease-out border border-dashed rounded-xl border-neutral-300 dark:border-neutral-700 group-hover:translate-x-1.5 group-hover:translate-y-1.5"></span>

      {/* Top accent line that moves with the top layer */}
      <div className={cn("absolute left-4 right-4 top-0 h-[2.5px] z-30 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 rounded-full", accentMap[accentColor])} />

      {/* Content layer */}
      <span className="relative z-30 block duration-300 ease-out group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 w-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-muted/80">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        )}
      </span>
    </div>
  );
}
