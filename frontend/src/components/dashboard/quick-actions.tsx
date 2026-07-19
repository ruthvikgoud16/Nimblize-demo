"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05, duration: 0.25 }}
        >
          <Link href={action.href}>
            <Card className="group cursor-pointer transition-colors hover:border-primary/30 hover:bg-accent/50">
              <CardContent className="flex items-center gap-4 p-4">
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
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
