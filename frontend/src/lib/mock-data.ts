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

export type PromptStatus = "active" | "draft" | "archived" | "review";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  qualityScore: number;
  tags: string[];
  updatedAt: string;
  status: PromptStatus;
  isFavorite: boolean;
  yamlContent: string;
}

export const mockPrompts: PromptTemplate[] = [
  {
    id: "SEO-001",
    name: "SEO Strategy Generation",
    description: "Generates comprehensive SEO keyword strategy and content gaps.",
    category: "SEO Analysis",
    version: "v1.4.2",
    qualityScore: 0.94,
    tags: ["keywords", "content-gap", "serp"],
    updatedAt: "2 minutes ago",
    status: "active",
    isFavorite: true,
    yamlContent: `name: "SEO Strategy Generation"
version: "1.4.2"
description: "Generates comprehensive SEO keyword strategy"
model: "gpt-4-turbo"
temperature: 0.4
system_prompt: |
  You are an expert SEO strategist. 
  Analyze the provided domain and generate a keyword strategy.
parameters:
  - name: "domain"
    type: "string"
    required: true
  - name: "target_audience"
    type: "string"
    required: false
`
  },
  {
    id: "CA-002",
    name: "Competitor Feature Matrix",
    description: "Extracts and compares features between our product and competitors.",
    category: "Competitor Analysis",
    version: "v2.1.0",
    qualityScore: 0.88,
    tags: ["comparison", "features", "market"],
    updatedAt: "3 hours ago",
    status: "active",
    isFavorite: false,
    yamlContent: `name: "Competitor Feature Matrix"
version: "2.1.0"
description: "Extracts and compares features"
model: "claude-3-opus"
temperature: 0.2
system_prompt: |
  Extract feature lists from the competitor website 
  and build a comparison matrix.
parameters:
  - name: "competitor_url"
    type: "string"
    required: true
`
  },
  {
    id: "MR-003",
    name: "TAM/SAM/SOM Market Sizing",
    description: "Calculates market sizes based on industry reports.",
    category: "Market Research",
    version: "v1.0.1",
    qualityScore: 0.91,
    tags: ["market-sizing", "tam", "finance"],
    updatedAt: "1 day ago",
    status: "draft",
    isFavorite: false,
    yamlContent: `name: "TAM/SAM/SOM Market Sizing"
version: "1.0.1"
model: "gpt-4-turbo"
temperature: 0.1
system_prompt: |
  Calculate TAM, SAM, and SOM based on the provided data.
parameters:
  - name: "industry_report"
    type: "string"
    required: true
`
  },
  {
    id: "CS-002",
    name: "Incident Triage Assistant",
    description: "Classifies support tickets by severity and routes to appropriate team.",
    category: "Customer Support",
    version: "v3.0.0",
    qualityScore: 0.98,
    tags: ["triage", "support", "routing"],
    updatedAt: "2 days ago",
    status: "active",
    isFavorite: true,
    yamlContent: `name: "Incident Triage Assistant"
version: "3.0.0"
model: "gpt-4-turbo"
temperature: 0.0
system_prompt: |
  Analyze the support ticket and determine severity (P1-P4).
parameters:
  - name: "ticket_text"
    type: "string"
    required: true
`
  },
  {
    id: "PR-002",
    name: "Affiliate Product Matching",
    description: "Matches user context to the best affiliate products.",
    category: "Product Recommendation",
    version: "v1.1.0",
    qualityScore: 0.82,
    tags: ["affiliate", "matching", "ecommerce"],
    updatedAt: "5 days ago",
    status: "review",
    isFavorite: false,
    yamlContent: `name: "Affiliate Product Matching"
version: "1.1.0"
model: "claude-3-sonnet"
temperature: 0.6
system_prompt: |
  Match the user profile with top 3 affiliate products.
parameters:
  - name: "user_profile"
    type: "string"
    required: true
`
  },
  {
    id: "FC-001",
    name: "Feature Comparison Matrix",
    description: "Generates a feature comparison matrix against competitors.",
    category: "Feature Comparison",
    version: "v1.2.5",
    qualityScore: 0.89,
    tags: ["matrix", "competitors"],
    updatedAt: "1 week ago",
    status: "active",
    isFavorite: false,
    yamlContent: `name: "Feature Comparison Matrix"
version: "1.2.5"
model: "gpt-4o"
temperature: 0.3
system_prompt: |
  Compare features across provided products.
`
  },
  {
    id: "ES-004",
    name: "Executive Summary Generator",
    description: "Distills 50-page reports into a 1-page executive summary.",
    category: "Executive Summary",
    version: "v2.0.1",
    qualityScore: 0.95,
    tags: ["summary", "c-suite", "pdf"],
    updatedAt: "2 weeks ago",
    status: "active",
    isFavorite: true,
    yamlContent: `name: "Executive Summary Generator"
version: "2.0.1"
model: "claude-3-opus"
temperature: 0.2
system_prompt: |
  Summarize the document for a C-suite executive.
`
  },
  {
    id: "RG-001",
    name: "Weekly Marketing Report",
    description: "Consolidates weekly marketing metrics into a narrative report.",
    category: "Report Generation",
    version: "v1.0.0",
    qualityScore: 0.76,
    tags: ["marketing", "metrics", "reporting"],
    updatedAt: "3 weeks ago",
    status: "archived",
    isFavorite: false,
    yamlContent: `name: "Weekly Marketing Report"
version: "1.0.0"
status: "archived"
`
  },
];
