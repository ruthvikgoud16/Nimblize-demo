"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryItem {
  name: string;
  count: number;
  color: string;
}

interface CategoryChartProps {
  data: CategoryItem[];
  className?: string;
}

export function CategoryChart({ data, className }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Category Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item, index) => {
          const percentage = Math.round((item.count / total) * 100);
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-muted-foreground">{item.name}</span>
                <span className="shrink-0 font-mono font-medium">
                  {item.count}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4, ease: "easeOut" }}
                  className={cn("h-full rounded-full", item.color)}
                />
              </div>
            </motion.div>
          );
        })}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Templates</span>
            <span className="font-mono font-semibold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
