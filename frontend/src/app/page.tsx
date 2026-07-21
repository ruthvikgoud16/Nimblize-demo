"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { ExecutionTimeline } from "@/components/dashboard/execution-timeline";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Badge } from "@/components/ui/badge";
import { fetchFromAPI } from "@/lib/api";
import {
  dashboardMetrics as initialMetrics,
  timelineEvents,
  categoryDistribution as initialCategories,
  quickActions,
  recentActivity,
} from "@/lib/mock-data";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    fetchFromAPI("/api/v1/dashboard/stats")
      .then((data) => {
        if (!data) return;
        setMetrics([
          {
            title: "Prompt Templates",
            value: `${data.activePrompts || 29}`,
            description: "Across 8 categories",
            icon: initialMetrics[0].icon,
            trend: { value: "4 new", positive: true },
            accentColor: "primary" as const,
          },
          {
            title: "Total Executions",
            value: data.totalExecutions?.toLocaleString() || "128",
            description: "Recorded in PostgreSQL",
            icon: initialMetrics[1].icon,
            trend: { value: "12.4%", positive: true },
            accentColor: "success" as const,
          },
          {
            title: "Cache Hit Rate",
            value: data.cacheHitRate || "88.6%",
            description: "Redis semantic cache",
            icon: initialMetrics[2].icon,
            trend: { value: "8%", positive: true },
            accentColor: "warning" as const,
          },
          {
            title: "RAGAS SLA",
            value: data.successRate || "99.4%",
            description: "Composite score ≥ 0.85",
            icon: initialMetrics[3].icon,
            trend: { value: "1.3%", positive: true },
            accentColor: "success" as const,
          },
        ]);

        if (data.categoryDistribution) {
          setCategories(data.categoryDistribution);
        }
      })
      .catch(() => {
        // Fallback to defaults on offline
      });
  }, []);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Studio Overview"
          description="Live platform metrics, active CIMS streams, and prompt registry health."
        >
          <Badge variant="outline" className="border-success/30 text-success">
            <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            All Systems Operational
          </Badge>
        </PageHeader>
      </motion.div>

      {/* Metric Cards Row */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </motion.div>

      {/* Bento Grid: Timeline + Category */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 lg:grid-cols-3"
      >
        <ExecutionTimeline events={timelineEvents} className="lg:col-span-2" />
        <CategoryChart data={categories} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick Actions
        </h2>
        <QuickActionsGrid actions={quickActions} />
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp}>
        <RecentActivity items={recentActivity} />
      </motion.div>
    </motion.div>
  );
}
