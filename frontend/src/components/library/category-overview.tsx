"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FolderHeart, TrendingUp, Zap, FileText } from "lucide-react";

interface CategoryStat {
  name: string;
  count: number;
  avgQuality: number;
  recentUpdates: number;
  color: string;
  icon: React.ElementType;
}

const categories: CategoryStat[] = [
  {
    name: "Competitor Analysis",
    count: 5,
    avgQuality: 0.91,
    recentUpdates: 2,
    color: "text-chart-1",
    icon: Zap,
  },
  {
    name: "SEO Analysis",
    count: 5,
    avgQuality: 0.88,
    recentUpdates: 1,
    color: "text-chart-2",
    icon: TrendingUp,
  },
  {
    name: "Customer Support",
    count: 3,
    avgQuality: 0.95,
    recentUpdates: 3,
    color: "text-success",
    icon: FolderHeart,
  },
  {
    name: "All Others",
    count: 16,
    avgQuality: 0.84,
    recentUpdates: 5,
    color: "text-primary",
    icon: FileText,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function CategoryOverview() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {categories.map((cat) => (
        <motion.div key={cat.name} variants={item} whileHover={{ y: -2 }}>
          <Card className="overflow-hidden transition-colors hover:border-border/80 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <cat.icon className={cn("h-4 w-4", cat.color)} />
                    {cat.name}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                      {cat.count}
                    </span>
                    <span className="text-xs text-muted-foreground">prompts</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {(cat.avgQuality * 100).toFixed(0)}%
                  </span>
                  <span>avg quality</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">
                    {cat.recentUpdates}
                  </span>
                  <span>updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
