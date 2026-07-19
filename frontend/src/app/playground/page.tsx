"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { mockPrompts, type PromptTemplate } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Settings2, 
  Terminal, 
  Braces, 
  Save, 
  RotateCcw,
  Zap,
  Clock,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PlaygroundPage() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate>(mockPrompts[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Mock execution
  const handleExecute = () => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    // Simulate streaming delay
    setTimeout(() => {
      setExecutionResult(
        "Based on the provided parameters, here is the generated output:\n\n1. Target Audience identified as high-value enterprise.\n2. Primary keywords: 'ai workflow orchestration', 'cims pipeline'.\n3. Competitor gap: Lack of automated HITL review queues.\n\nStrategy: Focus content on bridging the semantic caching with RAG evaluation SLA guarantees."
      );
      setIsExecuting(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-2rem)]">
      <PageHeader
        title="Prompt Playground"
        description="Test, tune, and evaluate your prompt templates in real-time."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button 
            className="gap-2 bg-success text-success-foreground hover:bg-success/90"
            onClick={handleExecute}
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
            Run Prompt
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-6 overflow-hidden mt-6">
        {/* Left Pane: Editor */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between rounded-md border border-border bg-card p-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="w-[300px] justify-between font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <Badge variant="secondary" className="text-[10px]">{selectedPrompt.id}</Badge>
                    <span className="truncate">{selectedPrompt.name}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              } />
              <DropdownMenuContent className="w-[300px]" align="start">
                <DropdownMenuLabel>Active Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {mockPrompts.map(p => (
                  <DropdownMenuItem key={p.id} onClick={() => setSelectedPrompt(p)} className="flex items-center justify-between">
                    <span className="truncate mr-2">{p.name}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{p.version}</Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 px-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                gpt-4-turbo
              </Badge>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                temp: 0.4
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* System Prompt / YAML */}
            <div className="flex flex-col rounded-md border border-border bg-[#0B0F19] overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border/50 bg-background/30 justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  Template Source
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <pre className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  <code>{selectedPrompt.yamlContent}</code>
                </pre>
              </ScrollArea>
            </div>

            {/* Variables */}
            <div className="flex flex-col rounded-md border border-border bg-card overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border/50 bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Braces className="h-4 w-4 text-muted-foreground" />
                  Variables
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Mocking variables extraction from YAML */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                      domain <span className="text-destructive">*</span>
                    </label>
                    <Input 
                      placeholder="e.g., rankvantage.com" 
                      className="font-mono text-sm"
                      value={variables['domain'] || ''}
                      onChange={(e) => setVariables({...variables, domain: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                      target_audience
                    </label>
                    <Textarea 
                      placeholder="e.g., B2B enterprise SaaS decision makers" 
                      className="font-mono text-sm resize-none"
                      rows={3}
                      value={variables['target_audience'] || ''}
                      onChange={(e) => setVariables({...variables, target_audience: e.target.value})}
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Right Pane: Execution & Eval */}
        <div className="flex flex-col gap-4 overflow-hidden border-l border-border pl-6">
          <div className="flex-1 flex flex-col rounded-md border border-border bg-card overflow-hidden">
            <div className="flex items-center px-4 py-2 border-b border-border/50 bg-muted/50 justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                Output
              </div>
              {executionResult && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> 1.2s
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="h-3 w-3" /> 450 tokens
                  </span>
                </div>
              )}
            </div>
            <ScrollArea className="flex-1 p-4">
              <AnimatePresence mode="wait">
                {isExecuting ? (
                  <motion.div
                    key="executing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 pt-12"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <RotateCcw className="h-8 w-8 opacity-20" />
                    </motion.div>
                    <p className="text-sm animate-pulse">Generating response...</p>
                  </motion.div>
                ) : executionResult ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                  >
                    {executionResult}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 pt-12"
                  >
                    <Play className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Click Run Prompt to see the output.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>

          {/* RAGAS Evaluation Scorecard */}
          <div className="h-[200px] flex flex-col rounded-md border border-border bg-card overflow-hidden">
            <div className="flex items-center px-4 py-2 border-b border-border/50 bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                RAGAS Evaluation
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {executionResult ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Faithfulness</p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-success">0.92</span>
                      <span className="text-[10px] text-muted-foreground mb-1 uppercase">Pass</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Answer Relevance</p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-success">0.88</span>
                      <span className="text-[10px] text-muted-foreground mb-1 uppercase">Pass</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Context Precision</p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-warning">0.76</span>
                      <span className="text-[10px] text-muted-foreground mb-1 uppercase">Warn</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Context Recall</p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-success">0.95</span>
                      <span className="text-[10px] text-muted-foreground mb-1 uppercase">Pass</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex items-center justify-center h-full text-xs text-muted-foreground pt-4">
                  Run prompt to calculate evaluation metrics.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
