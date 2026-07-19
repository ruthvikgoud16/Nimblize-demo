import {
  FileText,
  Database,
  Gauge,
  ShieldCheck,
  Library,
  FlaskConical,
  Workflow,
  BarChart3,
} from "lucide-react";

export const dashboardMetrics = [
  {
    title: "Prompt Templates",
    value: "29",
    description: "Across 8 categories",
    icon: FileText,
    trend: { value: "4 new", positive: true },
    accentColor: "primary" as const,
  },
  {
    title: "Vector Chunks",
    value: "1,248",
    description: "pgvector HNSW indexed",
    icon: Database,
    trend: { value: "12%", positive: true },
    accentColor: "success" as const,
  },
  {
    title: "Cache Hit Rate",
    value: "72%",
    description: "Redis semantic cache",
    icon: Gauge,
    trend: { value: "8%", positive: true },
    accentColor: "warning" as const,
  },
  {
    title: "RAGAS SLA",
    value: "94.2%",
    description: "Composite score ≥ 0.85",
    icon: ShieldCheck,
    trend: { value: "1.3%", positive: true },
    accentColor: "success" as const,
  },
];

export const timelineEvents = [
  {
    id: "1",
    stage: "Trigger Ingestion",
    status: "completed" as const,
    timestamp: "19:00:10",
    detail: "Manual trigger for rankvantage.com",
  },
  {
    id: "2",
    stage: "PII Redaction",
    status: "completed" as const,
    timestamp: "19:00:12",
    detail: "Presidio scrubbed 3 entities (EMAIL, PHONE, PERSON)",
  },
  {
    id: "3",
    stage: "Cache Lookup",
    status: "completed" as const,
    timestamp: "19:00:13",
    detail: "Cache miss — proceeding to RAG retrieval",
  },
  {
    id: "4",
    stage: "pgvector Retrieval",
    status: "completed" as const,
    timestamp: "19:00:15",
    detail: "Retrieved 12 context chunks (cosine ≥ 0.82)",
  },
  {
    id: "5",
    stage: "Agent Extraction",
    status: "completed" as const,
    timestamp: "19:00:18",
    detail: "Structured profile extracted on attempt 1",
  },
  {
    id: "6",
    stage: "Strategy Generation",
    status: "completed" as const,
    timestamp: "19:00:22",
    detail: "SWOT analysis and gap report generated",
  },
  {
    id: "7",
    stage: "RAGAS Evaluation",
    status: "warning" as const,
    timestamp: "19:00:25",
    detail: "Composite score: 0.79 — Below 0.85 threshold",
  },
  {
    id: "8",
    stage: "HITL Queue",
    status: "pending" as const,
    timestamp: "19:00:25",
    detail: "Enqueued for manual review",
  },
];

export const categoryDistribution = [
  { name: "Competitor Analysis", count: 5, color: "bg-chart-1" },
  { name: "SEO Analysis", count: 5, color: "bg-chart-2" },
  { name: "Report Generation", count: 4, color: "bg-chart-3" },
  { name: "Product Recommendation", count: 3, color: "bg-chart-4" },
  { name: "Feature Comparison", count: 3, color: "bg-chart-5" },
  { name: "Market Research", count: 3, color: "bg-primary" },
  { name: "Customer Support", count: 3, color: "bg-success" },
  { name: "Executive Summary", count: 3, color: "bg-warning" },
];

export const quickActions = [
  {
    label: "Browse Prompts",
    description: "Explore 29 YAML templates",
    icon: Library,
    href: "/library",
  },
  {
    label: "Prompt Playground",
    description: "Test and tune parameters",
    icon: FlaskConical,
    href: "/playground",
  },
  {
    label: "Run Pipeline",
    description: "Trigger CIMS automation",
    icon: Workflow,
    href: "/automation",
  },
  {
    label: "View Metrics",
    description: "RAGAS evaluation center",
    icon: BarChart3,
    href: "/evaluation",
  },
];

export const recentActivity = [
  {
    id: "1",
    action: "Prompt Updated",
    target: "SEO-001 SEO Strategy Generation",
    time: "2 minutes ago",
    type: "update" as const,
  },
  {
    id: "2",
    action: "Pipeline Completed",
    target: "rankvantage.com ingestion",
    time: "8 minutes ago",
    type: "success" as const,
  },
  {
    id: "3",
    action: "HITL Review Pending",
    target: "techcrunch.com flagged (score: 0.79)",
    time: "12 minutes ago",
    type: "warning" as const,
  },
  {
    id: "4",
    action: "New Prompt Added",
    target: "MR-003 TAM/SAM/SOM Market Sizing",
    time: "1 hour ago",
    type: "create" as const,
  },
  {
    id: "5",
    action: "Cache Invalidated",
    target: "Redis semantic cache flushed",
    time: "3 hours ago",
    type: "info" as const,
  },
];
