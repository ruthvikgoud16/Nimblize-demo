"use client";

import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { dashboardMetrics } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const recentEvaluations = [
  { id: "EVAL-001", prompt: "SEO Strategy Gen", score: 0.94, latency: "1.2s", pass: true, date: "2 mins ago" },
  { id: "EVAL-002", prompt: "TAM/SAM Sizing", score: 0.81, latency: "4.5s", pass: false, date: "15 mins ago" },
  { id: "EVAL-003", prompt: "Affiliate Match", score: 0.91, latency: "0.8s", pass: true, date: "1 hour ago" },
  { id: "EVAL-004", prompt: "Incident Triage", score: 0.98, latency: "0.3s", pass: true, date: "3 hours ago" },
  { id: "EVAL-005", prompt: "Competitor Matrix", score: 0.86, latency: "2.1s", pass: true, date: "5 hours ago" },
  { id: "EVAL-006", prompt: "Weekly Report", score: 0.74, latency: "12.4s", pass: false, date: "1 day ago" },
];

export default function EvaluationPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Evaluation Dashboard"
        description="Monitor LLM generation quality and RAGAS SLA compliance."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Trend Chart Mock */}
        <Card className="bg-card flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quality Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-end gap-2 p-6 pt-0">
            {/* Extremely simple mock bar chart using CSS */}
            {Array.from({ length: 30 }).map((_, i) => {
              const heights = [72, 85, 45, 90, 60, 80, 95, 70, 55, 88, 62, 78, 84, 91, 50, 75, 82, 68, 93, 76, 83, 79, 87, 89, 94, 73, 81, 86, 65, 92];
              const height = heights[i % heights.length];
              const isWarning = height < 70;
              return (
                <div key={i} className="flex-1 group relative bg-muted/30 rounded-t-sm h-full flex flex-col justify-end">
                  <div 
                    className={`w-full rounded-t-sm transition-all group-hover:opacity-80 ${isWarning ? 'bg-warning' : 'bg-primary'}`} 
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Evaluations Table */}
        <Card className="bg-card flex flex-col h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Evaluations</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/50">
                {recentEvaluations.map((evalRecord) => (
                  <div key={evalRecord.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{evalRecord.prompt}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase font-mono px-1.5 py-0 ${evalRecord.pass ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                          {evalRecord.pass ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{evalRecord.id}</span>
                        <span>•</span>
                        <span>{evalRecord.date}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold font-mono">
                        {(evalRecord.score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {evalRecord.latency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
