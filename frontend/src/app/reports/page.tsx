"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Search, 
  Download, 
  Calendar, 
  Filter
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  summary: string;
  category: string;
  created_at: string;
  author: string;
  status: "success" | "warning" | "error";
  score: number;
  content: string;
}

const mockReports: Report[] = [
  {
    id: "REP-001",
    title: "SEO Strategy Evaluation Report",
    summary: "Comprehensive breakdown of Claude 3 Opus generation relevance and semantic caching efficiency.",
    category: "SEO Strategy",
    created_at: "2 hours ago",
    author: "System (Cron)",
    status: "success",
    score: 0.94,
    content: `# SEO Strategy Evaluation Report

## Executive Summary
This evaluation report assesses the output fidelity of **Claude 3 Opus** utilizing prompt version **v2.1**. Over a cohort of 500 generated blog post summaries, the model maintained high SLA scores, specifically in the areas of **Faithfulness** and **Context Recall**.

## Core Metrics
- **Average Quality Score:** 94%
- **P95 Latency:** 1.2s
- **Cache Hit Rate:** 34% (Redis Semantic Cache active)

## Detailed RAGAS Evaluation
- **Faithfulness:** 0.94 (Pass)
- **Answer Relevance:** 0.88 (Pass)
- **Context Precision:** 0.76 (Warning - Context chunk boundaries were slightly overlapping)
- **Context Recall:** 0.95 (Pass)

## Recommendation
Transition prompt v2.1 to production. Cache hit rates indicate high semantic reuse on similar domain payloads.
`
  },
  {
    id: "REP-002",
    title: "Technology Differentiator Drift Analysis",
    summary: "Investigating accuracy degradation in competitor matrices over the past 7 days.",
    category: "Feature Comparison",
    created_at: "1 day ago",
    author: "Sarah Jenkins",
    status: "warning",
    score: 0.78,
    content: `# Technology Differentiator Drift Analysis

## Executive Summary
A slight degradation in competitor grid matching was identified between July 12 and July 19. Context Precision fell from 0.88 to 0.78.

## Root Cause Analysis
The source context format in downstream vector chunks changed structure without notifying the prompt registry parser. 

## Recommendation
Roll back prompt template to **v1.8** or update the regex chunk parser to handle the new nested Markdown table objects.
`
  },
  {
    id: "REP-053",
    title: "PII Leakage Audit",
    summary: "Automated scan checking for phone, email, and secret key tokens in public-facing incident responses.",
    category: "Compliance",
    created_at: "3 days ago",
    author: "SecOps Auditor",
    status: "success",
    score: 1.0,
    content: `# PII Leakage Audit (SLA Clear)

## Compliance Overview
Zero instances of raw email addresses, API tokens, or phone numbers were detected across 1,200 sampled generation trials.

## Details
- **Email Regex Matcher:** 0 hits
- **Private Key Regex Matcher:** 0 hits
- **Phone Number Matcher:** 0 hits
`
  }
];

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredReports = useMemo(() => {
    return mockReports.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleOpenDrawer = (report: Report) => {
    setSelectedReport(report);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reports Center"
        description="View, export, and manage generated execution and audit reports."
      >
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search reports..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:border-primary/30 transition-all group cursor-pointer" onClick={() => handleOpenDrawer(report)}>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {report.id}
                </Badge>
                <Badge variant="outline" className={`text-[10px] uppercase ${
                  report.status === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                }`}>
                  {report.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors leading-snug">
                  {report.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {report.summary}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px] text-muted-foreground border-t border-border/50">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {report.created_at}
                </span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  Score: {(report.score * 100).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          {selectedReport && (
            <>
              <SheetHeader className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {selectedReport.id}
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </Button>
                </div>
                <SheetTitle className="text-lg font-bold pt-2">{selectedReport.title}</SheetTitle>
                <SheetDescription className="text-xs">{selectedReport.summary}</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 p-6 bg-[#0B0F19]">
                <div className="prose prose-zinc dark:prose-invert max-w-none text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {selectedReport.content}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
