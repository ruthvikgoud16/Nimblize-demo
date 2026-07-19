"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchFromAPI } from "@/lib/api";
import { 
  Play, 
  Settings2,
  Workflow,
  CheckCircle2,
  CircleDashed,
  RotateCcw,
  Zap,
  Terminal,
  Activity,
  Database,
  BrainCircuit,
  FileSearch,
  FileCheck2,
  UserCheck,
  AlertTriangle,
  Server,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// Top level helper functions to prevent purity warnings from the compiler
function generateRandomDuration(min: number, max: number) {
  return `${(min + Math.random() * (max - min)).toFixed(2)}s`;
}

type NodeStatus = "idle" | "running" | "completed" | "error" | "bypassed";

interface PipelineNode {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: NodeStatus;
  duration?: string;
  logs: string[];
  latency: string;
  cost: string;
  successRate: string;
  config: Record<string, string>;
}

const defaultNodes: PipelineNode[] = [
  {
    id: "webhook",
    label: "Webhook Ingestion",
    description: "Accepts raw trigger events from CIMS webhooks",
    icon: Zap,
    status: "idle",
    latency: "12ms",
    cost: "$0.00002",
    successRate: "100.0%",
    config: {
      "Trigger Type": "HTTP Webhook POST",
      "Endpoint Path": "/api/v1/pipeline/run",
      "Format": "JSON Payload",
      "PII Scrubber": "Presidio Enabled"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "registry",
    label: "Prompt Registry",
    description: "Indexes YAML configurations and version metrics",
    icon: Database,
    status: "idle",
    latency: "8ms",
    cost: "$0.00001",
    successRate: "99.98%",
    config: {
      "Registry Directory": "assets/prompts/",
      "Active Prompts Loaded": "29 templates",
      "Default Category": "SEO Analysis",
      "Cache Hit Lookup": "Redis Semantic Active"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "llm",
    label: "LLM Generation",
    description: "Streams prompt requests to Claude 3.5 Sonnet",
    icon: BrainCircuit,
    status: "idle",
    latency: "1.4s",
    cost: "$0.01250",
    successRate: "98.7%",
    config: {
      "Model Provider": "Anthropic API Gateway",
      "Default Temperature": "0.4",
      "Max Tokens": "1,024 t",
      "Fallback Gateway": "GPT-4o (Active)"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "validation",
    label: "Schema Validation",
    description: "Applies strict Pydantic formatting structures",
    icon: FileSearch,
    status: "idle",
    latency: "15ms",
    cost: "$0.00005",
    successRate: "99.85%",
    config: {
      "Validator Type": "Pydantic V2 Parser",
      "Required Fields": "keywords, seo_score, summary",
      "Strict Type Casting": "Enabled",
      "Self-Correction Retry": "1 Max Attempt"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "evaluation",
    label: "RAGAS Evaluation",
    description: "Scores faithfulness and relevance metrics",
    icon: Activity,
    status: "idle",
    latency: "240ms",
    cost: "$0.00045",
    successRate: "97.4%",
    config: {
      "Evaluation Package": "RAGAS Quality Gate",
      "SLA Threshold": "0.85 Minimum",
      "Metrics Assessed": "Faithfulness, Answer Relevance",
      "Failure Routing": "HITL Manual Queue"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "review",
    label: "Human Review Queue",
    description: "Requires moderator override on low SLA outputs",
    icon: UserCheck,
    status: "idle",
    latency: "Manual (Async)",
    cost: "--",
    successRate: "100.0%",
    config: {
      "Review Trigger": "Evaluation score < 0.85",
      "Moderator Slack Hook": "Active",
      "Action Protocol": "Accept, Edit, or Redo",
      "Auto-Bypass Idle Time": "24 hours"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "report",
    label: "Report Generation",
    description: "Compiles markdown statistics and logs",
    icon: FileText,
    status: "idle",
    latency: "80ms",
    cost: "$0.00010",
    successRate: "100.0%",
    config: {
      "Report Category": "Weekly Marketing Audit",
      "Format Target": "Markdown & PDF Sync",
      "SLA Metadata Tagging": "Enabled",
      "Storage Target": "GCS /reports bucket"
    },
    logs: ["Waiting for execution..."],
  },
  {
    id: "completed",
    label: "Pipeline Completed",
    description: "All pipeline operations finish successfully",
    icon: FileCheck2,
    status: "idle",
    latency: "0ms",
    cost: "--",
    successRate: "100.0%",
    config: {
      "Webhook Notification": "Done",
      "Email SLA Report": "Sent",
      "Redis Cache Update": "Committed"
    },
    logs: ["Waiting for execution..."],
  }
];

export default function AutomationStudioPage() {
  const [nodes, setNodes] = useState<PipelineNode[]>(defaultNodes);
  const [activeNodeId, setActiveNodeId] = useState<string>("webhook");
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const handleRunPipeline = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    
    // Reset all nodes to idle
    const currentNodes = defaultNodes.map(n => ({
      ...n,
      status: "idle" as NodeStatus,
      logs: ["Preparing execution sequence..."]
    }));
    setNodes(currentNodes);
    
    try {
      // Execute the real FastAPI backend pipeline
      const rawTextPayload = simulateFailure 
        ? "SLA_FAILURE: Encountered low quality scraper text containing spam links." 
        : "RankVantage is a leading SEO intelligence application that automates competitor auditing.";
        
      const response = await fetchFromAPI("/api/v1/pipeline/run", {
        method: "POST",
        body: JSON.stringify({
          raw_text: rawTextPayload,
          source_url: "https://rankvantage.com"
        })
      });

      // Play back the execution animation step-by-step
      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        
        // Find matching backend log stage
        const backendLogStage = response.logs?.find((l: { stage: string; logs: string[] }) => l.stage === node.id);
        
        if (node.id === "review" && !response.hitl_review_required) {
          currentNodes[i] = {
            ...node,
            status: "bypassed",
            logs: ["Skipping review queue. RAGAS evaluation score cleared quality SLA (> 0.85)."]
          };
          setNodes([...currentNodes]);
          continue;
        }

        setActiveNodeId(node.id);
        
        // Mark as running
        currentNodes[i] = { 
          ...node, 
          status: "running",
          logs: [
            `Starting automated node [${node.id}]`,
            `Acquiring execution lock from backend...`,
            `Running core analysis processes...`
          ]
        };
        setNodes([...currentNodes]);
        
        // Short delay for visual polish
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Set completed logs and status from real backend
        const isNodeError = node.id === "evaluation" && response.hitl_review_required;
        const finalStatus: NodeStatus = isNodeError 
          ? "error" 
          : (node.id === "review" && response.hitl_review_required)
            ? "completed" // Review completes override
            : "completed";
            
        const backendLogs = backendLogStage?.logs || ["Operation completed successfully."];
        
        currentNodes[i] = { 
          ...node, 
          status: finalStatus, 
          duration: node.id === "llm" ? "1.4s" : generateRandomDuration(0.1, 0.5),
          logs: [
            ...currentNodes[i].logs,
            ...backendLogs,
            `Instance released successfully.`
          ]
        };
        setNodes([...currentNodes]);
        
        if (isNodeError) {
          // If evaluation failed, skip ahead to review queue (which is completed as review completes override)
          // Wait briefly for routing animation
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
      
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      // Mark active node as error if API throws
      setNodes(prev => prev.map((n, i) => i === 0 ? { ...n, status: "error", logs: [...n.logs, `Backend Error: ${errMsg}`] } : n));
    } finally {
      setIsExecuting(false);
    }
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-1.5rem)]">
      <PageHeader
        title="Automation Studio"
        description="Visual orchestration of CIMS pipelines and evaluations."
      >
        <div className="flex items-center gap-4">
          {/* Failure simulator checkbox */}
          <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-lg bg-card">
            <input 
              type="checkbox" 
              id="simulate-failure" 
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            <label htmlFor="simulate-failure" className="text-xs font-semibold text-muted-foreground select-none cursor-pointer flex items-center gap-1.5">
              <AlertTriangle className={cn("h-3.5 w-3.5", simulateFailure ? "text-warning animate-pulse" : "text-muted-foreground")} />
              Simulate SLA Failure
            </label>
          </div>

          <Button variant="outline" size="icon" className="h-9 w-9">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button 
            className={cn(
              "gap-2 min-w-[125px]",
              isExecuting ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/95"
            )}
            onClick={handleRunPipeline}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw className="h-4 w-4" />
              </motion.div>
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Pipeline
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 grid lg:grid-cols-[1fr_380px] gap-5 mt-4 overflow-hidden">
        {/* Left Pane: Pipeline Graph */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/30 justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Workflow className="h-3.5 w-3.5 text-primary" />
              Pipeline Graph
            </div>
            {isExecuting && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse text-[10px]">
                Executing
              </Badge>
            )}
          </div>
          
          <ScrollArea className="flex-1 p-6 bg-[#080B11]">
            <div className="max-w-md mx-auto py-4 space-y-3 relative">
              {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                const isActive = activeNodeId === node.id;
                
                return (
                  <div key={node.id} className="relative">
                    {/* Animated vertical connection line */}
                    {!isLast && (
                      <div className="absolute left-[1.5rem] top-11 bottom-[-16px] w-[2px] bg-border/40 z-0">
                        {node.status === "completed" && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 0.4 }}
                            className="w-full bg-success" 
                          />
                        )}
                        {node.status === "error" && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 0.4 }}
                            className="w-full bg-warning" 
                          />
                        )}
                        {node.status === "running" && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "100%" }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="w-full bg-primary" 
                          />
                        )}
                        {node.status === "bypassed" && (
                          <div className="w-full h-full bg-muted-foreground/30 border-dashed" />
                        )}
                      </div>
                    )}
                    
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setActiveNodeId(node.id)}
                      className={cn(
                        "relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer z-10",
                        isActive 
                          ? "bg-muted/40 border-primary shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                          : "bg-card border-border/80 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center border",
                          node.status === "completed" && "bg-success/15 border-success/35 text-success",
                          node.status === "running" && "bg-primary/15 border-primary/35 text-primary animate-pulse",
                          node.status === "error" && "bg-warning/15 border-warning/35 text-warning",
                          node.status === "bypassed" && "bg-muted/30 border-muted text-muted-foreground",
                          node.status === "idle" && "bg-muted/10 border-border text-muted-foreground"
                        )}>
                          <node.icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-xs font-bold",
                              node.status === "bypassed" ? "text-muted-foreground" : "text-foreground"
                            )}>{node.label}</span>
                            {node.duration && (
                              <span className="text-[10px] text-muted-foreground font-mono">({node.duration})</span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[240px] mt-0.5">{node.description}</span>
                        </div>
                      </div>

                      {/* Status indicator badges */}
                      <div>
                        {node.status === "completed" && (
                          <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0" />
                        )}
                        {node.status === "running" && (
                          <CircleDashed className="h-4.5 w-4.5 text-primary animate-spin shrink-0" />
                        )}
                        {node.status === "error" && (
                          <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0" />
                        )}
                        {node.status === "bypassed" && (
                          <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">bypassed</span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Pane: Logs & Detail Panel */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              Node Inspector
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-5 bg-[#070A10]">
            {activeNode ? (
              <div className="space-y-6">
                {/* Node Title Header */}
                <div className="flex gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border",
                    activeNode.status === "completed" && "bg-success/15 border-success/35 text-success",
                    activeNode.status === "running" && "bg-primary/15 border-primary/35 text-primary",
                    activeNode.status === "error" && "bg-warning/15 border-warning/35 text-warning",
                    activeNode.status === "bypassed" && "bg-muted/30 border-muted text-muted-foreground",
                    activeNode.status === "idle" && "bg-muted/10 border-border text-muted-foreground"
                  )}>
                    <activeNode.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100">{activeNode.label}</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{activeNode.description}</p>
                  </div>
                </div>

                {/* Node Performance Statistics */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="p-2 border border-border/40 rounded-lg bg-background/20 text-center">
                    <span className="text-zinc-500 uppercase block tracking-wider mb-1 text-[8px]">Latency</span>
                    <span className="font-bold text-zinc-200">{activeNode.latency}</span>
                  </div>
                  <div className="p-2 border border-border/40 rounded-lg bg-background/20 text-center">
                    <span className="text-zinc-500 uppercase block tracking-wider mb-1 text-[8px]">Cost</span>
                    <span className="font-bold text-zinc-200">{activeNode.cost}</span>
                  </div>
                  <div className="p-2 border border-border/40 rounded-lg bg-background/20 text-center">
                    <span className="text-zinc-500 uppercase block tracking-wider mb-1 text-[8px]">SLA rate</span>
                    <span className="font-bold text-zinc-200">{activeNode.successRate}</span>
                  </div>
                </div>

                {/* Node Configurations Block */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Server className="h-3 w-3" /> Instance Configuration
                  </span>
                  <div className="rounded-lg border border-border/30 bg-background/20 p-3 space-y-1.5 font-mono text-[10px]">
                    {Object.entries(activeNode.config).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-zinc-500">{key}:</span>
                        <span className="text-zinc-300 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Node Console Logs */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3 w-3" /> Console Output
                  </span>
                  <div className="rounded-lg border border-border/30 bg-zinc-950 p-3 font-mono text-[10px] space-y-1.5 leading-relaxed overflow-hidden">
                    {activeNode.logs.map((log, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex gap-2 text-zinc-400 select-text",
                          log.includes("completed") && "text-success",
                          (log.includes("WARNING") || log.includes("DLQ") || log.includes("⚠️")) && "text-warning",
                          log.includes("Skipping") && "text-muted-foreground italic"
                        )}
                      >
                        <span className="text-zinc-600 shrink-0">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                        <span>{log}</span>
                      </motion.div>
                    ))}
                    {activeNode.status === "running" && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="text-zinc-500 flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        processing...
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 text-center mt-10">Select a pipeline node to view logs</div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
