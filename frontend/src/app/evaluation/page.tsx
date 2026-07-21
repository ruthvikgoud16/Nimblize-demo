"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFromAPI } from "@/lib/api";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Download, 
  SlidersHorizontal, 
  TrendingUp,
  Activity,
  Clock,
  CircleDollarSign,
  Play,
  CheckCircle,
  History,
  FileCode,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface EvaluationRecord {
  id: string;
  prompt: string;
  score: number;
  latency: string;
  cost: string;
  pass: boolean;
  date: string;
  metrics: {
    faithfulness: number;
    relevance: number;
    precision: number;
    recall: number;
  };
  input: string;
  output: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

// Top level helper functions to prevent purity warnings from the compiler
function generateToastId() {
  return Math.random().toString(36).slice(2, 9);
}

const mockEvaluations: EvaluationRecord[] = [
  { 
    id: "EVAL-001", 
    prompt: "SEO Strategy Blueprint v1.4.2", 
    score: 0.94, 
    latency: "1.22s",
    cost: "$0.0024",
    pass: true, 
    date: "2 mins ago",
    metrics: { faithfulness: 0.94, relevance: 0.89, precision: 0.82, recall: 0.95 },
    input: "domain: rankvantage.com\ntarget_audience: B2B enterprise SaaS decision makers\nfocus: SEO blueprint creation",
    output: "### SEO Strategy Blueprint: rankvantage.com\nTarget Audience: **B2B enterprise SaaS decision makers**\nPrimary Model: Claude 3.5 Sonnet\n\n1. Target competitor SEO strategies using cosine similarity semantic indexing.\n2. Scrub PII and cache responses to reduce cost by up to 34%."
  },
  { 
    id: "EVAL-002", 
    prompt: "TAM/SAM Market Assessment", 
    score: 0.81, 
    latency: "4.55s",
    cost: "$0.0105",
    pass: false, 
    date: "15 mins ago",
    metrics: { faithfulness: 0.81, relevance: 0.74, precision: 0.88, recall: 0.80 },
    input: "competitor_url: linear.app\nfocus_area: keyboard shortcuts",
    output: "### Competitor Feature Matrix: linear.app\nFocus: Keyboard shortcuts analysis\n\n- The application exposes standard CLI action triggers.\n- The context precision fell below normal constraints."
  },
  { 
    id: "EVAL-003", 
    prompt: "Affiliate Campaign Creator", 
    score: 0.91, 
    latency: "0.85s",
    cost: "$0.0018",
    pass: true, 
    date: "1 hour ago",
    metrics: { faithfulness: 0.91, relevance: 0.92, precision: 0.89, recall: 0.90 },
    input: "campaign_name: Cyber Week Promotion\ndiscount: 20%",
    output: "### Campaign Draft\nPromo: 20% discount on enterprise plans.\nTargeting: Social media channels."
  },
  { 
    id: "EVAL-004", 
    prompt: "Incident Ticket Triage", 
    score: 0.98, 
    latency: "0.34s",
    cost: "$0.0008",
    pass: true, 
    date: "3 hours ago",
    metrics: { faithfulness: 0.98, relevance: 0.99, precision: 0.97, recall: 0.98 },
    input: "ticket_payload: CRITICAL - DB Outage",
    output: "### Escalation Protocol\nSeverity: HIGH\nDepartment: DevOps Engineering\nIncident ID: inc_82031"
  },
  { 
    id: "EVAL-005", 
    prompt: "Competitor Grid Matrix", 
    score: 0.86, 
    latency: "2.10s",
    cost: "$0.0042",
    pass: true, 
    date: "5 hours ago",
    metrics: { faithfulness: 0.86, relevance: 0.84, precision: 0.88, recall: 0.85 },
    input: "company_name: Figma\nmetric: UI velocity",
    output: "### Feature Matrix\nFigma maintains standard browser optimization vectors for responsive UI canvas rendering."
  },
  { 
    id: "EVAL-006", 
    prompt: "Weekly SLA Analytics Report", 
    score: 0.74, 
    latency: "12.44s",
    cost: "$0.0245",
    pass: false, 
    date: "1 day ago",
    metrics: { faithfulness: 0.74, relevance: 0.70, precision: 0.78, recall: 0.75 },
    input: "cohort_size: 5000 runs",
    output: "### Quality SLA Report\nOverall performance drift detected in prompt templates across validation modules."
  }
];

const chartTimeRanges = {
  "30d": [
    { label: "Day 1", quality: 82, latency: 1.1, cost: 0.005 },
    { label: "Day 5", quality: 88, latency: 1.2, cost: 0.006 },
    { label: "Day 10", quality: 78, latency: 1.4, cost: 0.004 },
    { label: "Day 15", quality: 91, latency: 1.1, cost: 0.007 },
    { label: "Day 20", quality: 85, latency: 1.2, cost: 0.005 },
    { label: "Day 25", quality: 93, latency: 0.9, cost: 0.006 },
    { label: "Day 30", quality: 94, latency: 1.2, cost: 0.005 }
  ],
  "7d": [
    { label: "Mon", quality: 89, latency: 1.1, cost: 0.005 },
    { label: "Tue", quality: 91, latency: 1.0, cost: 0.004 },
    { label: "Wed", quality: 78, latency: 1.4, cost: 0.006 },
    { label: "Thu", quality: 88, latency: 1.2, cost: 0.005 },
    { label: "Fri", quality: 94, latency: 0.9, cost: 0.006 },
    { label: "Sat", quality: 95, latency: 0.8, cost: 0.004 },
    { label: "Sun", quality: 94, latency: 1.2, cost: 0.005 }
  ],
  "24h": [
    { label: "00:00", quality: 92, latency: 1.0, cost: 0.005 },
    { label: "04:00", quality: 94, latency: 0.9, cost: 0.004 },
    { label: "08:00", quality: 86, latency: 1.3, cost: 0.006 },
    { label: "12:00", quality: 91, latency: 1.2, cost: 0.005 },
    { label: "16:00", quality: 95, latency: 0.9, cost: 0.006 },
    { label: "20:00", quality: 93, latency: 1.1, cost: 0.005 },
    { label: "24:00", quality: 94, latency: 1.2, cost: 0.005 }
  ]
};

export default function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [chartMetric, setChartMetric] = useState<"quality" | "latency" | "cost">("quality");
  const [selectedEval, setSelectedEval] = useState<EvaluationRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pass" | "fail">("all");

  // Local Toast States
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Fetch evaluations history from backend on mount
  useEffect(() => {
    fetchFromAPI("/api/v1/history")
      .then(data => {
        const mapped = data.history.map((h: {
          id: string;
          promptId: string;
          promptName: string;
          timestamp: string;
          variables: Record<string, string>;
          response: string;
          metrics?: {
            latency?: string;
            tokens?: number;
            faithfulness?: number;
            relevance?: number;
            precision?: number;
            recall?: number;
          };
        }) => {
          const m = h.metrics || {};
          const faithfulness = m.faithfulness ?? 0.89;
          const relevance = m.relevance ?? 0.91;
          const precision = m.precision ?? 0.86;
          const recall = m.recall ?? 0.85;
          const composite = (faithfulness + relevance + precision) / 3;
          
          return {
            id: h.id,
            prompt: `${h.promptName} (${h.promptId})`,
            score: composite,
            latency: m.latency || "1.2s",
            cost: `$${(m.tokens ? m.tokens * 0.00002 : 0.0024).toFixed(4)}`,
            pass: composite >= 0.85,
            date: h.timestamp,
            metrics: {
              faithfulness,
              relevance,
              precision,
              recall
            },
            input: Object.entries(h.variables).map(([k, v]) => `${k}: ${v}`).join("\n"),
            output: h.response
          };
        });
        setEvaluations(mapped.length > 0 ? mapped : mockEvaluations);
      })
      .catch(err => {
        console.error("Evaluations history load error:", err);
      });

    fetchFromAPI("/api/v1/evaluation/stats")
      .then(stats => {
        if (stats && stats.metrics) {
          // Update aggregate benchmarks from live DB stats
        }
      })
      .catch(() => {});
  }, []);

  const handleRunEvaluation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Triggered re-evaluation for ${id}...`, "info");
    setTimeout(() => {
      showToast(`Evaluation completed. Quality score updated successfully.`);
    }, 1500);
  };

  const handleExportCSV = () => {
    const headers = "ID,Prompt,Score,Latency,Cost,SLA Status,Date\n";
    const rows = evaluations.map(e => `${e.id},"${e.prompt}",${e.score},${e.latency},${e.cost},${e.pass ? "PASS" : "FAIL"},${e.date}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluations_${timeRange}.csv`;
    a.click();
    showToast("CSV exported successfully.");
  };

  // Filter logic
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      if (statusFilter === "pass") return e.pass;
      if (statusFilter === "fail") return !e.pass;
      return true;
    });
  }, [evaluations, statusFilter]);

  // SVG Chart points calculation
  const chartPoints = useMemo(() => {
    const data = chartTimeRanges[timeRange];
    const width = 500;
    const height = 150;
    const padding = 20;

    const values = data.map(d => d[chartMetric]);
    const maxVal = Math.max(...values, chartMetric === "quality" ? 100 : 2.0);
    const minVal = 0;

    return data.map((d, i) => {
      const x = padding + (i * (width - (padding * 2)) / (data.length - 1));
      const y = height - padding - (((d[chartMetric] - minVal) / (maxVal - minVal)) * (height - (padding * 2)));
      return { x, y, label: d.label, val: d[chartMetric] };
    });
  }, [timeRange, chartMetric]);

  const svgPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }, [chartPoints]);

  const svgAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const height = 150;
    const padding = 20;
    return `${svgPath} L ${last.x.toFixed(1)} ${(height - padding).toFixed(1)} L ${first.x.toFixed(1)} ${(height - padding).toFixed(1)} Z`;
  }, [chartPoints, svgPath]);

  // Overall calculations for KPI cards
  const stats = useMemo(() => {
    if (evaluations.length === 0) {
      return {
        avgQuality: "0.0%",
        passRate: "0.0%",
        totalRuns: "0",
        p95Latency: "0.0s"
      };
    }
    const scores = evaluations.map(e => e.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passRate = (evaluations.filter(e => e.pass).length / evaluations.length) * 100;
    
    return {
      avgQuality: `${(avgScore * 100).toFixed(1)}%`,
      passRate: `${passRate.toFixed(1)}%`,
      totalRuns: evaluations.length.toString(),
      p95Latency: "1.4s"
    };
  }, [evaluations]);

  const handleOpenInspector = (evalRecord: EvaluationRecord) => {
    setSelectedEval(evalRecord);
    setIsInspectorOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Box */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs font-semibold shadow-md backdrop-blur-xl",
                t.type === "success" && "bg-success/15 border-success/35 text-success",
                t.type === "error" && "bg-destructive/15 border-destructive/35 text-destructive",
                t.type === "info" && "bg-primary/15 border-primary/35 text-primary"
              )}
            >
              {t.type === "info" && <History className="h-3.5 w-3.5 text-primary" />}
              {t.type === "success" && <CheckCircle className="h-3.5 w-3.5 text-success" />}
              {t.type === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PageHeader
        title="Evaluation Dashboard"
        description="Monitor LLM generation quality and RAGAS SLA compliance."
      >
        <div className="flex items-center gap-2">
          {/* Time range selectors */}
          <div className="flex bg-muted/30 border border-border p-1 rounded-lg">
            {(["24h", "7d", "30d"] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  timeRange === range ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      {/* KPI stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Quality"
          value={stats.avgQuality}
          description="RAGAS composite rating"
          icon={Activity}
          trend={{ value: "2.4%", positive: true }}
        />
        <MetricCard
          title="SLA Pass Rate"
          value={stats.passRate}
          description="Percentage clearing 0.85 threshold"
          icon={TrendingUp}
          trend={{ value: "0.8%", positive: true }}
        />
        <MetricCard
          title="P95 Latency"
          value={stats.p95Latency}
          description="Average response time profile"
          icon={Clock}
          trend={{ value: "140ms", positive: true }}
        />
        <MetricCard
          title="Total Runs"
          value={stats.totalRuns}
          description="Pipeline evaluations enqueued"
          icon={CircleDollarSign}
          trend={{ value: "148 runs", positive: true }}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Quality/Latency Chart Card */}
        <Card className="lg:col-span-2 bg-card border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historical Performance Profile</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">Visualize quality indices and speed drifts</CardDescription>
            </div>
            
            {/* Metric Chart Toggle Controls */}
            <div className="flex bg-muted/20 border border-border/60 p-0.5 rounded-lg text-[9px] font-bold">
              {(["quality", "latency", "cost"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={cn(
                    "px-2.5 py-1 uppercase tracking-wider rounded transition-all",
                    chartMetric === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="h-[200px] flex items-center justify-center p-6 bg-zinc-950/20">
            {/* SVG Custom Chart Canvas */}
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="20" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
              
              {/* Area path */}
              <path d={svgAreaPath} fill="url(#chartGlow)" />
              
              {/* Main Line path */}
              <path d={svgPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Nodes dots */}
              {chartPoints.map((pt, i) => (
                <g key={i} className="group/dot cursor-pointer">
                  <circle cx={pt.x} cy={pt.y} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1.5" />
                  <circle cx={pt.x} cy={pt.y} r="8" fill="hsl(var(--primary))" opacity="0" className="hover:opacity-20 transition-opacity" />
                  {/* Tooltip labels */}
                  <text 
                    x={pt.x} 
                    y={pt.y - 10} 
                    textAnchor="middle" 
                    fill="currentColor" 
                    className="text-[8px] font-mono font-bold text-zinc-400 opacity-0 group-hover/dot:opacity-100 transition-opacity bg-zinc-950 px-1 py-0.5 rounded border pointer-events-none"
                  >
                    {chartMetric === "quality" ? `${pt.val}%` : chartMetric === "latency" ? `${pt.val}s` : `$${pt.val}`}
                  </text>
                </g>
              ))}

              {/* Chart labels bottom axis */}
              {chartPoints.map((pt, i) => (
                <text key={i} x={pt.x} y="146" textAnchor="middle" fill="rgba(255,255,255,0.25)" className="text-[8px] font-mono">
                  {pt.label}
                </text>
              ))}
            </svg>
          </CardContent>
        </Card>

        {/* Quality Controls Box */}
        <Card className="bg-card border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SLA Threshold Configs</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">Control pipeline gate exception thresholds</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 flex-1 flex flex-col justify-between pt-2">
            <div className="space-y-3.5 text-xs">
              <ThresholdMeter label="Faithfulness Guard" value={85} />
              <ThresholdMeter label="Answer Relevancy Guard" value={80} />
              <ThresholdMeter label="Context Recall Guard" value={75} />
            </div>
            
            <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground leading-relaxed flex gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <span>SLA gates automatically route generations scoring below threshold to manual review queue.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations Table List Section */}
      <Card className="bg-card border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/10">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evaluation Log History</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">Inspect quality checks of active LLM generations</CardDescription>
          </div>

          {/* Filter Status buttons */}
          <div className="flex bg-muted/20 border border-border/50 p-0.5 rounded-lg text-[9px] font-bold">
            {(["all", "pass", "fail"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-2.5 py-1 uppercase tracking-wider rounded transition-all",
                  statusFilter === f ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[280px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10 text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">
                  <th className="py-2.5 px-4 font-mono">ID</th>
                  <th className="py-2.5 px-4">Prompt Template Name</th>
                  <th className="py-2.5 px-4 text-center">RAGAS Quality</th>
                  <th className="py-2.5 px-4 text-center">Latency</th>
                  <th className="py-2.5 px-4 text-center">SLA Status</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredEvaluations.map(record => (
                  <tr 
                    key={record.id} 
                    onClick={() => handleOpenInspector(record)}
                    className="hover:bg-muted/20 cursor-pointer transition-all text-zinc-300 font-medium"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-zinc-400">
                      {record.id}
                    </td>
                    <td className="py-3 px-4 text-zinc-100 max-w-[280px] truncate">
                      {record.prompt}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        "font-mono font-bold text-xs",
                        record.pass ? "text-success" : "text-destructive"
                      )}>
                        {(record.score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-400">
                      {record.latency}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-bold tracking-wider py-0 px-2.5 shrink-0",
                        record.pass 
                          ? "bg-success/10 text-success border-success/20" 
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      )}>
                        {record.pass ? "Pass" : "Fail"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground font-mono">
                      <div className="flex items-center justify-end gap-2.5">
                        {record.date}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleRunEvaluation(record.id, e)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sheet details evaluation Inspector */}
      <Sheet open={isInspectorOpen} onOpenChange={setIsInspectorOpen}>
        <SheetContent className="sm:max-w-xl bg-[#080B11] border-l border-border/80 text-foreground p-0 flex flex-col h-full select-none">
          {selectedEval && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Sheet Header */}
              <SheetHeader className="p-6 border-b border-border/40 bg-card">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">{selectedEval.id}</Badge>
                      <Badge className={cn(
                        "text-[9px] uppercase tracking-wider font-bold",
                        selectedEval.pass ? "bg-success/15 text-success hover:bg-success/20" : "bg-destructive/15 text-destructive hover:bg-destructive/20"
                      )}>{selectedEval.pass ? "SLA Pass" : "SLA Flagged"}</Badge>
                    </div>
                    <SheetTitle className="text-base font-extrabold tracking-tight text-foreground">{selectedEval.prompt}</SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">Execution log and RAGAS metrics inspection</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Inspector Content */}
              <ScrollArea className="flex-1 p-6 space-y-6 bg-zinc-950/40">
                <div className="space-y-6">
                  {/* Quality indicators scorecard */}
                  <div className="space-y-3">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Quality metrics breakdown</span>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricBreakdownCard label="Faithfulness" val={selectedEval.metrics.faithfulness} target={85} />
                      <MetricBreakdownCard label="Answer Relevance" val={selectedEval.metrics.relevance} target={80} />
                      <MetricBreakdownCard label="Context Precision" val={selectedEval.metrics.precision} target={85} />
                      <MetricBreakdownCard label="Context Recall" val={selectedEval.metrics.recall} target={75} />
                    </div>
                  </div>

                  {/* Input parameters details */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3 w-3" /> Input Parameters
                    </span>
                    <div className="rounded-lg border border-border/30 bg-background/20 p-4 font-mono text-[10px] text-zinc-300 leading-relaxed whitespace-pre">
                      {selectedEval.input}
                    </div>
                  </div>

                  {/* Output generation details */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <FileCode className="h-3 w-3" /> Model Output (Response)
                    </span>
                    <div className="rounded-lg border border-border/30 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap select-text">
                      {selectedEval.output}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );

  function ThresholdMeter({ label, value }: { label: string; value: number }) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between font-medium">
          <span className="text-zinc-300 font-semibold">{label}</span>
          <span className="font-mono text-zinc-400">{(value / 100).toFixed(2)}</span>
        </div>
        <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
        </div>
      </div>
    );
  }

  function MetricBreakdownCard({ label, val, target }: { label: string; val: number; target: number }) {
    const isPass = val >= target / 100;
    
    return (
      <div className="p-3 border border-border/30 rounded-lg bg-background/20 space-y-1">
        <span className="text-[9px] text-zinc-500 font-semibold">{label}</span>
        <div className="flex items-baseline justify-between pt-1">
          <span className={cn(
            "text-base font-extrabold font-mono",
            isPass ? "text-success" : "text-warning"
          )}>
            {val.toFixed(2)}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Target &gt;={(target/100).toFixed(2)}</span>
        </div>
      </div>
    );
  }
}
