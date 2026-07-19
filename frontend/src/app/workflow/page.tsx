"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchFromAPI } from "@/lib/api";
import { 
  Network, 
  Terminal, 
  FileCode2, 
  ListOrdered,
  BookOpen,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchitectureNode {
  id: string;
  label: string;
  purpose: string;
  layer: "Ingestion" | "Core Processing" | "Validation & Security" | "Metrics & Output";
  dependencies: string[];
  upstream: string[];
  files: string[];
  documentation: string;
  executionOrder: number;
  type: "orchestrator" | "storage" | "validator" | "external" | "security";
  healthStatus: "healthy" | "warning";
}

export default function WorkflowPage() {
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("registry");

  useEffect(() => {
    fetchFromAPI("/api/v1/workflow/nodes")
      .then(data => {
        setNodes(data.nodes);
        if (data.nodes.length > 0) {
          // Default to registry if present, or first node
          const hasRegistry = data.nodes.some((n: ArchitectureNode) => n.id === "registry");
          setSelectedNodeId(hasRegistry ? "registry" : data.nodes[0].id);
        }
      })
      .catch(err => console.error("Workflow fetch error:", err));
  }, []);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // Group nodes by layer for the architectural grid layout
  const layers = useMemo(() => {
    return {
      "Ingestion": nodes.filter(n => n.layer === "Ingestion"),
      "Core Processing": nodes.filter(n => n.layer === "Core Processing"),
      "Validation & Security": nodes.filter(n => n.layer === "Validation & Security"),
      "Metrics & Output": nodes.filter(n => n.layer === "Metrics & Output")
    };
  }, [nodes]);

  const isRelated = (nodeId: string) => {
    if (!selectedNode) return false;
    if (nodeId === selectedNodeId) return true;
    return selectedNode.dependencies.includes(nodeId) || selectedNode.upstream.includes(nodeId);
  };

  if (nodes.length === 0) {
    return (
      <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col items-center justify-center bg-[#070A11]">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
          />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
            Inspecting Backend Architecture...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-1.5rem)]">
      <PageHeader
        title="Workflow Explorer"
        description="Trace the system architecture and runtime module dependencies in real-time."
      />

      <div className="flex-1 grid lg:grid-cols-[1fr_420px] gap-5 mt-4 overflow-hidden">
        {/* Node Layout Canvas */}
        <div className="flex flex-col rounded-xl border border-border bg-[#070A11] overflow-hidden relative">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/30 justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Network className="h-3.5 w-3.5 text-primary" />
              Architecture Trace Map
            </div>
            <div className="flex gap-4 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Core
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Healthy
              </span>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-6 relative animate-fadeIn">
            <div className="space-y-8 max-w-2xl mx-auto py-2">
              {(Object.keys(layers) as Array<keyof typeof layers>).map(layerName => (
                <div key={layerName} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/20 pb-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      {layerName} Layer
                    </span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    {layers[layerName].map(node => {
                      const isActive = node.id === selectedNodeId;
                      const related = isRelated(node.id);
                      
                      return (
                        <motion.div
                          key={node.id}
                          className={cn(
                            "relative p-4 rounded-xl border cursor-pointer transition-all duration-200",
                            isActive 
                              ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                              : related 
                              ? "bg-background/80 border-primary/45 shadow-sm"
                              : "bg-zinc-950/90 border-border/80 hover:border-border",
                            node.healthStatus === "warning" && !isActive && "border-warning/50 bg-warning/5"
                          )}
                          onClick={() => setSelectedNodeId(node.id)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* Inner contents */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/40 h-4 min-w-4 px-1 rounded flex items-center justify-center border">
                                  {node.executionOrder}
                                </span>
                                <span className="text-xs font-bold text-foreground">{node.label}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">
                                {node.purpose}
                              </p>
                            </div>
                            
                            {/* Health indicator */}
                            <span className={cn(
                              "h-2 w-2 rounded-full mt-1 shrink-0",
                              node.healthStatus === "healthy" ? "bg-success" : "bg-warning"
                            )} />
                          </div>

                          {/* Upstream/Downstream indicators */}
                          {related && !isActive && (
                            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-primary/70 flex items-center gap-1">
                              {selectedNode && selectedNode.dependencies.includes(node.id) ? (
                                <>
                                  Downstream <ArrowUpRight className="h-2.5 w-2.5" />
                                </>
                              ) : (
                                <>
                                  Upstream <ArrowUpRight className="h-2.5 w-2.5 rotate-180" />
                                </>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Info Panel */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Module Specifications
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-5 bg-[#070A10]">
            {selectedNode ? (
              <div className="space-y-6">
                {/* Node Title & Health Warning */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h2 className="text-sm font-extrabold text-foreground">{selectedNode.label}</h2>
                    <Badge variant="outline" className={cn(
                      "text-[9px] uppercase tracking-wider font-bold",
                      selectedNode.healthStatus === "healthy" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                    )}>
                      {selectedNode.healthStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.purpose}</p>
                </div>

                {/* Health Warning Alert Box */}
                {selectedNode.healthStatus === "warning" && (
                  <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-[10px] text-warning flex items-start gap-2 leading-relaxed">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase tracking-wider mb-0.5">SLA Threshold Alert</span>
                      Evaluating scores may drop below 0.85 depending on scraped content density. Trigger enqueues HITL exception logs.
                    </div>
                  </div>
                )}

                {/* Execution Order and Type */}
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  <div className="p-3 border border-border/40 rounded-lg bg-background/20">
                    <span className="text-zinc-500 uppercase block tracking-wider mb-1 text-[8px] flex items-center gap-1">
                      <ListOrdered className="h-3 w-3" /> Execution Step
                    </span>
                    <span className="font-bold text-zinc-200"># 0{selectedNode.executionOrder}</span>
                  </div>
                  <div className="p-3 border border-border/40 rounded-lg bg-background/20">
                    <span className="text-zinc-500 uppercase block tracking-wider mb-1 text-[8px] flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> Module Type
                    </span>
                    <span className="font-bold text-zinc-200 uppercase">{selectedNode.type}</span>
                  </div>
                </div>

                {/* Code files mapping */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <FileCode2 className="h-3 w-3" /> Source Code Files
                  </span>
                  <div className="rounded-lg border border-border/30 bg-background/20 p-3 space-y-1.5 font-mono text-[10px]">
                    {selectedNode.files.map(file => (
                      <div key={file} className="flex justify-between items-center text-zinc-400">
                        <span className="truncate max-w-[280px]">{file}</span>
                        <ArrowUpRight className="h-3 w-3 text-zinc-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline python docstrings / Class specifications */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3 w-3" /> Python Class Docstring
                  </span>
                  <div className="rounded-lg border border-border/30 bg-zinc-950 p-4 font-mono text-[10px] leading-relaxed overflow-hidden text-zinc-300 select-text whitespace-pre-wrap">
                    {selectedNode.documentation}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 text-center mt-10">Select a pipeline module to trace trace specs</div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
