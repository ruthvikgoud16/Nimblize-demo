"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface TimelineEvent {
  id: string;
  stage: string;
  status: "completed" | "warning" | "pending" | "error";
  timestamp: string;
  detail: string;
}

interface ExecutionTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    dotClass: "bg-success",
    lineClass: "bg-success/30",
    badgeVariant: "outline" as const,
    badgeClass: "border-success/30 text-success",
    label: "Done",
  },
  warning: {
    icon: AlertTriangle,
    dotClass: "bg-warning",
    lineClass: "bg-warning/30",
    badgeVariant: "outline" as const,
    badgeClass: "border-warning/30 text-warning",
    label: "Warning",
  },
  pending: {
    icon: Clock,
    dotClass: "bg-muted-foreground",
    lineClass: "bg-border",
    badgeVariant: "outline" as const,
    badgeClass: "border-border text-muted-foreground",
    label: "Pending",
  },
  error: {
    icon: AlertTriangle,
    dotClass: "bg-destructive",
    lineClass: "bg-destructive/30",
    badgeVariant: "outline" as const,
    badgeClass: "border-destructive/30 text-destructive",
    label: "Error",
  },
};

export function ExecutionTimeline({ events, className }: ExecutionTimelineProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          CIMS Execution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {events.map((event, index) => {
          const config = statusConfig[event.status];
          const isLast = index === events.length - 1;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="relative flex items-start gap-3 pb-4"
            >
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[5px] top-5 h-[calc(100%-8px)] w-[1px]",
                    config.lineClass
                  )}
                />
              )}

              {/* Dot */}
              <div
                className={cn(
                  "mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-2 ring-background",
                  config.dotClass
                )}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{event.stage}</p>
                  <Badge
                    variant={config.badgeVariant}
                    className={cn("shrink-0 text-[10px]", config.badgeClass)}
                  >
                    {config.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.detail}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                  {event.timestamp}
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
