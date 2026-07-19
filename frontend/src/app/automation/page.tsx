"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileCheck2
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeStatus = "idle" | "running" | "completed" | "error";

interface PipelineNode {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: NodeStatus;
  duration?: string;
  logs: string[];
}

const initialNodes: PipelineNode[] = [
  {
    id: "trigger",
    label: "Webhook Trigger",
    description: "Listen for incoming CIMS payloads",
    icon: Zap,
    status: "idle",
    logs: ["Waiting for execution..."],
  },
  {
    id: "ingestion",
    label: "Data Ingestion",
    description: "Extract and structure target URL",
    icon: Database,
    status: "idle",
    logs: ["Waiting for execution..."],
  },
  {
    id: "llm",
    label: "LLM Generation",
    description: "Generate response via Claude 3 Opus",
    icon: BrainCircuit,
    status: "idle",
    logs: ["Waiting for execution..."],
  },
  {
    id: "validation",
    label: "Schema Validation",
    description: "Verify Pydantic strict schema",
    icon: FileSearch,
    status: "idle",
    logs: ["Waiting for execution..."],
  },
  {
    id: "evaluation",
    label: "RAGAS Evaluation",
    description: "Score generation quality",
    icon: Activity,
    status: "idle",
    logs: ["Waiting for execution..."],
  },
  {
    id: "completion",
    label: "Report Generation",
    description: "Compile and store final report",
    icon: FileCheck2,
    status: "idle",
    logs: ["Waiting for execution..."],
  }
];

export default function AutomationStudioPage() {
  const [nodes, setNodes] = useState<PipelineNode[]>(initialNodes);
  const [activeNodeId, setActiveNodeId] = useState<string>("trigger");
  const [isExecuting, setIsExecuting] = useState(false);

  const handleRunPipeline = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    
    let currentNodes = [...initialNodes];
    setNodes(currentNodes);
    
    for (let i = 0; i < currentNodes.length; i++) {
      setActiveNodeId(currentNodes[i].id);
      
      // Mark as running
      currentNodes[i] = { 
        ...currentNodes[i], 
        status: "running",
        logs: [`Starting ${currentNodes[i].label}...`, `Executing core logic...`]
      };
      setNodes([...currentNodes]);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
      
      // Mark as completed
      currentNodes[i] = { 
        ...currentNodes[i], 
        status: "completed", 
        duration: `${(Math.random() * 1.5 + 0.1).toFixed(1)}s`,
        logs: [...currentNodes[i].logs, `Successfully completed.`]
      };
      setNodes([...currentNodes]);
    }
    
    setIsExecuting(false);
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-2rem)]">
      <PageHeader
        title="Automation Studio"
        description="Visual orchestration of CIMS pipelines and evaluations."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button 
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
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

      <div className="flex-1 grid lg:grid-cols-[1fr_350px] gap-6 mt-6 overflow-hidden">
        {/* Left Pane: Pipeline Graph */}
        <div className="flex flex-col rounded-md border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/50 justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Workflow className="h-4 w-4 text-primary" />
              Pipeline Graph
            </div>
            {isExecuting && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                Executing
              </Badge>
            )}
          </div>
          <ScrollArea className="flex-1 p-8">
            <div className="max-w-xl mx-auto space-y-2">
              {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                const isActive = activeNodeId === node.id;
                
                return (
                  <div key={node.id} className="relative">
                    {!isLast && (
                      <div className="absolute left-[1.35rem] top-10 bottom-[-8px] w-[2px] bg-border z-0">
                        {node.status === "completed" && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "100%" }}
                            className="w-full bg-success" 
                          />
                        )}
                      </div>
                    )}
                    <motion.div
                      className={cn(
                        "relative z-10 flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all",
                        isActive ? "bg-accent/50 border-primary/50 shadow-sm" : "bg-card border-border hover:border-border/80",
                        node.status === "running" && "border-primary/50 bg-primary/5"
                      )}
                      onClick={() => setActiveNodeId(node.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className={cn(
                        "mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-full border bg-background",
                        node.status === "completed" ? "border-success text-success" :
                        node.status === "running" ? "border-primary text-primary" :
                        node.status === "error" ? "border-destructive text-destructive" :
                        "border-muted-foreground/30 text-muted-foreground"
                      )}>
                        {node.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : node.status === "running" ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <RotateCcw className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <CircleDashed className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                            {node.label}
                          </h4>
                          {node.duration && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                              {node.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {node.description}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Pane: Logs & Detail */}
        <div className="flex flex-col rounded-md border border-border bg-[#0B0F19] overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-background/30 justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Terminal className="h-4 w-4" />
              Runtime Logs
            </div>
            {activeNode && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {activeNode.id}
              </Badge>
            )}
          </div>
          <ScrollArea className="flex-1 p-4">
            {activeNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border/30">
                  <div className="p-2 rounded bg-primary/20 text-primary">
                    <activeNode.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{activeNode.label}</h3>
                    <p className="text-xs text-zinc-400">{activeNode.description}</p>
                  </div>
                </div>
                <div className="font-mono text-xs space-y-2">
                  {activeNode.logs.map((log, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3 text-zinc-400",
                        log.includes("Successfully") && "text-success",
                        log.includes("Error") && "text-destructive"
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
            ) : (
              <div className="text-sm text-zinc-500 text-center mt-10">Select a node to view logs</div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
