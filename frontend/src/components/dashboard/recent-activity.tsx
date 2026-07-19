"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Info,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
  type: "update" | "success" | "warning" | "create" | "info";
}

interface RecentActivityProps {
  items: ActivityItem[];
  className?: string;
}

const typeConfig = {
  update: { icon: RefreshCcw, color: "text-primary" },
  success: { icon: CheckCircle2, color: "text-success" },
  warning: { icon: AlertTriangle, color: "text-warning" },
  create: { icon: PlusCircle, color: "text-chart-4" },
  info: { icon: Info, color: "text-muted-foreground" },
};

export function RecentActivity({ items, className }: RecentActivityProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item, index) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
            >
              <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{item.action}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="text-muted-foreground truncate">
                    {item.target}
                  </span>
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60">
                {item.time}
              </span>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
