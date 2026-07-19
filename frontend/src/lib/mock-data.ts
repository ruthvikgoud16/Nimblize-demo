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
  versions: string[];
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
    versions: ["v1.4.2", "v1.4.1", "v1.4.0"],
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
  Analyze the website {{domain}} for target audience {{target_audience}}.
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
    versions: ["v2.1.0", "v2.0.0", "v1.9.0"],
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
  Analyze the competitor website {{competitor_url}} focusing on {{focus_area}}.
parameters:
  - name: "competitor_url"
    type: "string"
    required: true
  - name: "focus_area"
    type: "string"
    required: false
`
  },
  {
    id: "MR-003",
    name: "TAM/SAM/SOM Market Sizing",
    description: "Calculates market sizes based on industry reports.",
    category: "Market Research",
    version: "v1.0.1",
    versions: ["v1.0.1", "v1.0.0"],
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
  Calculate TAM, SAM, and SOM based on industry reports for {{industry_report}} in {{region}}.
parameters:
  - name: "industry_report"
    type: "string"
    required: true
  - name: "region"
    type: "string"
    required: false
`
  },
  {
    id: "CS-002",
    name: "Incident Triage Assistant",
    description: "Classifies support tickets by severity and routes to appropriate team.",
    category: "Customer Support",
    version: "v3.0.0",
    versions: ["v3.0.0", "v2.5.0", "v1.0.0"],
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
  Analyze support ticket {{ticket_text}} received via {{channel}}.
parameters:
  - name: "ticket_text"
    type: "string"
    required: true
  - name: "channel"
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
    versions: ["v1.1.0", "v1.0.0"],
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
  Match user profile {{user_profile}} to top {{category_limit}} affiliate products.
parameters:
  - name: "user_profile"
    type: "string"
    required: true
  - name: "category_limit"
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
    versions: ["v1.2.5", "v1.2.0", "v1.0.0"],
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
  Compare features for {{product_name}} against competitors {{competitor_list}}.
parameters:
  - name: "product_name"
    type: "string"
    required: true
  - name: "competitor_list"
    type: "string"
    required: true
`
  },
  {
    id: "ES-004",
    name: "Executive Summary Generator",
    description: "Distills 50-page reports into a 1-page executive summary.",
    category: "Executive Summary",
    version: "v2.0.1",
    versions: ["v2.0.1", "v2.0.0", "v1.0.0"],
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
  Summarize document {{raw_document}} in maximum {{max_words}} words.
parameters:
  - name: "raw_document"
    type: "string"
    required: true
  - name: "max_words"
    type: "string"
    required: false
`
  },
  {
    id: "RG-001",
    name: "Weekly Marketing Report",
    description: "Consolidates weekly marketing metrics into a narrative report.",
    category: "Report Generation",
    version: "v1.0.0",
    versions: ["v1.0.0"],
    qualityScore: 0.76,
    tags: ["marketing", "metrics", "reporting"],
    updatedAt: "3 weeks ago",
    status: "archived",
    isFavorite: false,
    yamlContent: `name: "Weekly Marketing Report"
version: "1.0.0"
system_prompt: |
  Consolidate marketing metrics for week {{week_number}} from channel {{source_channel}}.
parameters:
  - name: "week_number"
    type: "string"
    required: true
  - name: "source_channel"
    type: "string"
    required: false
`
  },
];

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "success" | "warning" | "error" | "info";
}

export const mockNotifications: SystemNotification[] = [
  {
    id: "notif-1",
    title: "RAGAS Score Warning",
    message: "Evaluation score for CA-002 dropped below 0.85 threshold to 0.79.",
    timestamp: "5 mins ago",
    read: false,
    type: "warning",
  },
  {
    id: "notif-2",
    title: "Audit Completed",
    message: "Scheduled PII scan over weekly support incident responses is complete. 0 leaks found.",
    timestamp: "1 hour ago",
    read: false,
    type: "success",
  },
  {
    id: "notif-3",
    title: "New Prompt Deployed",
    message: "Incident Triage Assistant (CS-002) v3.0.0 was pushed to production by Sarah.",
    timestamp: "4 hours ago",
    read: true,
    type: "info",
  },
  {
    id: "notif-4",
    title: "Pipeline Failure",
    message: "Report Generation pipeline failed at Ingestion node due to DNS timeout.",
    timestamp: "1 day ago",
    read: true,
    type: "error",
  }
];

export interface PlaygroundHistoryItem {
  id: string;
  promptId: string;
  promptName: string;
  timestamp: string;
  variables: Record<string, string>;
  response: string;
  metrics: {
    faithfulness: number;
    relevance: number;
    precision: number;
    recall: number;
    latency: string;
    tokens: number;
  };
}

export const mockPlaygroundHistory: PlaygroundHistoryItem[] = [
  {
    id: "hist-1",
    promptId: "SEO-001",
    promptName: "SEO Strategy Generation",
    timestamp: "10 mins ago",
    variables: { domain: "rankvantage.com", target_audience: "Enterprise marketers" },
    response: "Based on the provided parameters, here is the generated output:\n\n1. Target Audience identified as high-value enterprise.\n2. Primary keywords: 'ai workflow orchestration', 'cims pipeline'.\n3. Competitor gap: Lack of automated HITL review queues.\n\nStrategy: Focus content on bridging the semantic caching with RAG evaluation SLA guarantees.",
    metrics: { faithfulness: 0.92, relevance: 0.88, precision: 0.85, recall: 0.94, latency: "1.2s", tokens: 412 }
  },
  {
    id: "hist-2",
    promptId: "CA-002",
    promptName: "Competitor Feature Matrix",
    timestamp: "1 hour ago",
    variables: { competitor_url: "linear.app" },
    response: "Linear Feature Matrix Summary:\n\n- Keyboards and shortcuts: 100% core accessibility.\n- Local sync speed: Instant offline database updates.\n- Command interface: Central command registry matches user preferences fully.",
    metrics: { faithfulness: 0.89, relevance: 0.91, precision: 0.82, recall: 0.90, latency: "1.8s", tokens: 350 }
  }
];

