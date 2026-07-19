"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Network, 
  Terminal, 
  ArrowRight, 
  Settings2,
  FileCode2,
  ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchitectureNode {
  id: string;
  label: string;
  purpose: string;
  dependencies: string[];
  files: string[];
  executionOrder: number;
  type: "orchestrator" | "storage" | "validator" | "external";
}

const mockNodes: ArchitectureNode[] = [
  {
    id: "registry",
    label: "Prompt Registry",
    purpose: "Validates and parses incoming prompt declarations defined in YAML assets.",
    dependencies: ["semantic-cache"],
    files: ["backend/prompt_registry.py", "assets/prompts/**/*.yaml"],
    executionOrder: 1,
    type: "orchestrator"
  },
  {
    id: "cache",
    label: "Semantic Cache",
    purpose: "Queries Redis Vector DB to match semantically equivalent queries using embeddings.",
    dependencies: ["llm-gateway"],
    files: ["backend/semantic_cache.py", "backend/redis_client.py"],
    executionOrder: 2,
    type: "storage"
  },
  {
    id: "llm-gateway",
    label: "LLM Gateway",
    purpose: "Distributes calls to Anthropic, OpenAI, or local Llama models with automatic retry logic.",
    dependencies: ["validator"],
    files: ["backend/llm_gateway.py", "backend/providers/"],
    executionOrder: 3,
    type: "external"
  },
  {
    id: "validator",
    label: "Fidelity Validator",
    purpose: "Applies Pydantic strict schemas on the generated LLM text outputs.",
    dependencies: ["ragas-eval"],
    files: ["backend/validation/validator.py", "backend/schemas/"],
    executionOrder: 4,
    type: "validator"
  },
  {
    id: "ragas-eval",
    label: "RAGAS Evaluator",
    purpose: "Runs evaluations for Faithfulness, Latency, and Context recall to check against SLA.",
    dependencies: [],
    files: ["backend/evaluation/ragas_evaluator.py"],
    executionOrder: 5,
    type: "validator"
  }
];

export default function WorkflowPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("registry");

  const selectedNode = mockNodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-2rem)]">
      <PageHeader
        title="Workflow Explorer"
        description="Trace the system architecture and runtime module dependencies in real-time."
      />

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-6 mt-6 overflow-hidden">
        {/* Node Layout Canvas */}
        <div className="flex flex-col rounded-md border border-border bg-card overflow-hidden relative">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Network className="h-4 w-4 text-primary" />
              Architecture Trace Canvas
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#09090b]">
            <div className="w-full max-w-lg space-y-4">
              {mockNodes.map((node, index) => {
                const isActive = node.id === selectedNodeId;
                const isLast = index === mockNodes.length - 1;
                
                return (
                  <div key={node.id} className="flex flex-col items-center">
                    <motion.div
                      className={cn(
                        "w-full max-w-sm p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                        isActive ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(99,102,241,0.15)]" : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
                      )}
                      onClick={() => setSelectedNodeId(node.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-muted flex items-center justify-center text-[10px] font-mono font-bold">
                            {node.executionOrder}
                          </span>
                          <span className="text-sm font-semibold">{node.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{node.purpose}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-mono">
                        {node.type}
                      </Badge>
                    </motion.div>
                    
                    {!isLast && (
                      <div className="h-6 w-[2px] bg-border my-1 relative">
                        <ArrowRight className="h-3 w-3 absolute -bottom-1 -left-[5px] rotate-90 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="flex flex-col rounded-md border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/50">
            <div className="text-sm font-medium">Module Details</div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-base font-bold">{selectedNode.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Order of Execution: {selectedNode.executionOrder}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purpose</h4>
                    <p className="text-sm leading-relaxed text-zinc-300">{selectedNode.purpose}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ListOrdered className="h-3.5 w-3.5" /> Direct Downstream Dependencies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.dependencies.length > 0 ? (
                        selectedNode.dependencies.map(dep => (
                          <Badge key={dep} variant="outline" className="font-mono text-[10px] bg-zinc-950">
                            {dep}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground font-italic">None</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5" /> Code & File Sources
                    </h4>
                    <div className="space-y-1.5">
                      {selectedNode.files.map(file => (
                        <div key={file} className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-900 font-mono text-[10px] text-zinc-400">
                          <Terminal className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-sm text-muted-foreground text-center pt-10">Select an architecture module node to explore detail</div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
