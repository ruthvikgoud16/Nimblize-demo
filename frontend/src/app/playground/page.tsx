"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { type PromptTemplate, type PlaygroundHistoryItem } from "@/lib/mock-data";
import { fetchFromAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Terminal, 
  Braces, 
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Star,
  Search,
  Copy,
  History,
  Download,
  Maximize2,
  GitCompare,
  Trash2,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Custom toast simple state
interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

// Helper functions defined outside component to avoid React Compiler purity analysis warnings

function calculateRandomLatency(base: number, range: number) {
  return `${(base + Math.random() * range).toFixed(2)}s`;
}

function generateToastId() {
  return Math.random().toString(36).slice(2, 9);
}

function extractVariablesFromYAML(yaml: string) {
  const vars: { name: string; required: boolean; type: string }[] = [];
  const lines = yaml.split('\n');
  let inParams = false;
  let currentParam: { name: string; required: boolean; type: string } | null = null;
  
  for (const line of lines) {
    if (line.trim().startsWith('parameters:')) {
      inParams = true;
      continue;
    }
    if (inParams) {
      if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
        inParams = false;
        continue;
      }
      
      const paramNameMatch = line.match(/^\s*-\s*name:\s*["']([^"']+)["']/);
      if (paramNameMatch) {
        if (currentParam) vars.push(currentParam);
        currentParam = { name: paramNameMatch[1], required: false, type: 'string' };
        continue;
      }
      
      const typeMatch = line.match(/^\s*type:\s*["']([^"']+)["']/);
      if (typeMatch && currentParam) {
        currentParam.type = typeMatch[1];
        continue;
      }
      
      const reqMatch = line.match(/^\s*required:\s*(true|false)/);
      if (reqMatch && currentParam) {
        currentParam.required = reqMatch[1] === 'true';
        continue;
      }
    }
  }
  if (currentParam) vars.push(currentParam);
  
  // Fallback brace scanner
  const braceMatches = yaml.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (braceMatches) {
    for (const match of braceMatches) {
      const name = match.replace(/\{\{|\}\}/g, '').trim();
      if (!vars.some(v => v.name === name)) {
        vars.push({ name, required: true, type: 'string' });
      }
    }
  }
  
  return vars;
}

export default function PlaygroundPage() {
  // Prompts State
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string>("1.0.0");
  
  // Tabs State
  const [activeLeftTab, setActiveLeftTab] = useState<"variables" | "yaml" | "history">("variables");
  
  // UI & Execution State
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<string>("");
  const [executionProgress, setExecutionProgress] = useState(0);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [latency, setLatency] = useState("0s");
  const [tokenStats, setTokenStats] = useState({ input: 0, output: 0, total: 0, cost: 0 });
  const [showResults, setShowResults] = useState(false);

  // Variables state
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // History state
  const [history, setHistory] = useState<PlaygroundHistoryItem[]>([]);

  // Comparison State
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparePrompt, setComparePrompt] = useState<PromptTemplate | null>(null);
  const [compareStreamedResponse, setCompareStreamedResponse] = useState("");
  const [compareShowResults, setCompareShowResults] = useState(false);
  const [compareLatency, setCompareLatency] = useState("0s");

  // RAGAS Animated metrics
  const [ragasMetrics, setRagasMetrics] = useState({ faithfulness: 0, relevance: 0, precision: 0, recall: 0 });
  const [compareRagasMetrics, setCompareRagasMetrics] = useState({ faithfulness: 0, relevance: 0, precision: 0, recall: 0 });

  // Custom Toast Notification System
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Hydrate registry list and history on mount
  useEffect(() => {
    fetchFromAPI("/api/v1/prompts")
      .then(data => {
        setPrompts(data.prompts);
        
        // Deep-link check
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const promptId = params.get("prompt");
          const found = promptId ? data.prompts.find((p: PromptTemplate) => p.id === promptId) : null;
          const activePrompt = found || data.prompts[0];
          
          if (activePrompt) {
            setSelectedPrompt(activePrompt);
            setSelectedVersion(activePrompt.version);
            
            const vars = extractVariablesFromYAML(activePrompt.yamlContent);
            const defaults: Record<string, string> = {};
            vars.forEach((v: { name: string; required: boolean; type: string }) => {
              defaults[v.name] = v.name === "domain" ? "rankvantage.com" : v.name === "target_audience" ? "B2B enterprise SaaS decision makers" : "";
            });
            setVariables(defaults);
          }
        }
      })
      .catch(err => showToast(`Failed to fetch prompts: ${err.message}`, "error"));

    // Fetch Playground Executions
    fetchFromAPI("/api/v1/history")
      .then(data => setHistory(data.history))
      .catch(err => console.error("History fetch error:", err));
  }, []);

  const handleSelectPrompt = (p: PromptTemplate) => {
    setSelectedPrompt(p);
    setSelectedVersion(p.version);
    const vars = extractVariablesFromYAML(p.yamlContent);
    const defaults: Record<string, string> = {};
    vars.forEach(v => {
      if (v.name.includes("domain")) defaults[v.name] = "rankvantage.com";
      else if (v.name.includes("audience")) defaults[v.name] = "B2B enterprise SaaS decision makers";
      else if (v.name.includes("period")) defaults[v.name] = "Q3 2026";
      else if (v.name.includes("text") || v.name.includes("raw")) defaults[v.name] = "RankVantage is an enterprise SEO attribution platform with 120,000 monthly organic visitors.";
      else defaults[v.name] = "Sample " + v.name;
    });
    setVariables(defaults);
    setValidationErrors({});
    setShowResults(false);
    setStreamedResponse("");
  };

  // Extract variables dynamically from YAML string
  const parsedVariables = useMemo(() => {
    if (!selectedPrompt) return [];
    return extractVariablesFromYAML(selectedPrompt.yamlContent);
  }, [selectedPrompt]);

  // Filter prompts by search query
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prompts, searchQuery]);

  // Handle variable change
  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
    if (value.trim()) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  // Toggle favorite state
  const handleToggleFavorite = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    const isFav = !!prompt.isFavorite;

    try {
      await fetchFromAPI("/api/v1/favorites", {
        method: "POST",
        body: JSON.stringify({ prompt_id: promptId, favorite: !isFav })
      });
      setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, isFavorite: !isFav } : p));
      if (selectedPrompt && selectedPrompt.id === promptId) {
        setSelectedPrompt(prev => prev ? { ...prev, isFavorite: !isFav } : null);
      }
      showToast(isFav ? "Removed from favorites" : "Added to favorites", "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to update favorite: ${errMsg}`, "error");
    }
  };

  // Copy template output
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied prompt template to clipboard!");
  };

  // Clear playground form
  const handleResetForm = () => {
    if (!selectedPrompt) return;
    const emptyVars: Record<string, string> = {};
    parsedVariables.forEach(v => {
      emptyVars[v.name] = "";
    });
    setVariables(emptyVars);
    setValidationErrors({});
    setShowResults(false);
    setStreamedResponse("");
    showToast("Form variables reset", "info");
  };

  // Download Output report file
  const handleDownloadOutput = () => {
    const element = document.createElement("a");
    const file = new Blob([streamedResponse], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedPrompt?.id.toLowerCase()}_playground_output.md`;
    document.body.appendChild(element);
    element.click();
    showToast("Markdown download triggered.");
  };

  // Execute Playground Prompt Template
  const handleExecute = async () => {
    if (!selectedPrompt || isExecuting) return;
    
    // Validate inputs
    const errors: Record<string, boolean> = {};
    parsedVariables.forEach(v => {
      if (v.required && !variables[v.name]?.trim()) {
        errors[v.name] = true;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast("Please enter all required parameters.", "error");
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(10);
    setExecutionStep("PII Filtering...");
    setStreamedResponse("");
    setCompareStreamedResponse("");
    setCompareShowResults(false);
    setShowResults(false);
    
    // Simulate steps progress
    const progressInterval = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev < 90) return prev + 15;
        return prev;
      });
    }, 200);

    try {
      const data = await fetchFromAPI("/api/v1/playground/run", {
        method: "POST",
        body: JSON.stringify({
          prompt_id: selectedPrompt.id,
          version: selectedVersion,
          variables: variables
        })
      });

      clearInterval(progressInterval);
      setExecutionProgress(100);
      setExecutionStep("Completed");
      setLatency(data.latency);
      setTokenStats({
        input: data.tokens.input,
        output: data.tokens.output,
        total: data.tokens.total,
        cost: data.cost
      });
      setShowResults(true);

      const finalScores = {
        faithfulness: data.scores.faithfulness,
        relevance: data.scores.answer_relevancy,
        precision: data.scores.context_recall,
        recall: data.scores.context_recall
      };

      // Real Typewriter text stream effect
      let index = 0;
      const textToStream = data.response;
      const streamInterval = setInterval(() => {
        if (index < textToStream.length) {
          setStreamedResponse(prev => prev + textToStream.charAt(index));
          index += 3; // Stream quickly
        } else {
          clearInterval(streamInterval);
          setIsExecuting(false);
          setRagasMetrics(finalScores);
          showToast("Generation and RAGAS scoring completed successfully!");
          
          // Refresh History list
          fetchFromAPI("/api/v1/history")
            .then(h => setHistory(h.history))
            .catch(() => {});
        }
      }, 8);

    } catch (err) {
      clearInterval(progressInterval);
      setIsExecuting(false);
      setExecutionStep("Failed");
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Playground run failed: ${errMsg}`, "error");
    }

    // Stream comparison if active
    if (isComparisonMode && comparePrompt) {
      setCompareShowResults(true);
      setCompareLatency(calculateRandomLatency(0.9, 0.7));
      
      const compareMockOutputText = `### Comparison generation on ${comparePrompt.id}\nTargeting alternate model parameters. Cosine quality SLA score compiled.`;
      
      let compIndex = 0;
      const compInterval = setInterval(() => {
        if (compIndex < compareMockOutputText.length) {
          setCompareStreamedResponse(prev => prev + compareMockOutputText.charAt(compIndex));
          compIndex += 2;
        } else {
          clearInterval(compInterval);
          animateCompareMetrics();
        }
      }, 10);
    }
  };

  const animateCompareMetrics = () => {
    const targets = { faithfulness: 0.88, relevance: 0.91, precision: 0.79, recall: 0.90 };
    const current = { faithfulness: 0, relevance: 0, precision: 0, recall: 0 };
    const interval = setInterval(() => {
      let done = true;
      (Object.keys(targets) as Array<keyof typeof targets>).forEach(key => {
        if (current[key] < targets[key]) {
          current[key] = parseFloat((current[key] + 0.05).toFixed(2));
          if (current[key] > targets[key]) current[key] = targets[key];
          done = false;
        }
      });
      setCompareRagasMetrics({ ...current });
      if (done) clearInterval(interval);
    }, 50);
  };

  // Restore state from a history item
  const handleSelectHistory = (item: PlaygroundHistoryItem) => {
    const prompt = prompts.find(p => p.id === item.promptId);
    if (prompt) {
      setSelectedPrompt(prompt);
      setSelectedVersion(prompt.version);
      setVariables({ ...item.variables });
      setStreamedResponse(item.response);
      setShowResults(true);
      setLatency(item.metrics.latency);
      setTokenStats({
        input: Math.floor(item.metrics.tokens * 0.3),
        output: Math.floor(item.metrics.tokens * 0.7),
        total: item.metrics.tokens,
        cost: parseFloat((item.metrics.tokens * 0.00002).toFixed(5))
      });
      setRagasMetrics({
        faithfulness: item.metrics.faithfulness,
        relevance: item.metrics.relevance,
        precision: item.metrics.precision,
        recall: item.metrics.recall
      });
      setActiveLeftTab("variables");
      showToast("Restored configuration from database history", "info");
    }
  };

  // Clean history item from database
  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchFromAPI(`/api/v1/history/${id}`, { method: "DELETE" });
      setHistory(prev => prev.filter(h => h.id !== id));
      showToast("Cleared history item from database", "info");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to delete record: ${errMsg}`, "error");
    }
  };

  // Wait until prompts and active prompt are fetched
  if (!selectedPrompt) {
    return (
      <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col items-center justify-center bg-[#070A11]">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
          />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
            Connecting to Prompt Registry...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-1.5rem)]">
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
              {t.type === "error" && <AlertCircle className="h-3.5 w-3.5" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PageHeader
        title="Prompt Playground"
        description="Build, test, and score prompt templates in an interactive environment."
      >
        <div className="flex items-center gap-2">
          {/* Toggle comparison button */}
          <Button 
            variant={isComparisonMode ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              setIsComparisonMode(!isComparisonMode);
              if (!isComparisonMode && prompts[1]) {
                setComparePrompt(prompts[1]);
              }
              showToast(isComparisonMode ? "Comparison deactivated" : "Comparison mode activated", "info");
            }}
            className="gap-1.5 h-9 text-xs"
          >
            <GitCompare className="h-4 w-4" />
            Compare Mode
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => setIsFullscreenEditor(!isFullscreenEditor)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 grid lg:grid-cols-3 gap-5 mt-4 overflow-hidden">
        {/* Left Side: Variables and Configurations Form */}
        <div className={cn(
          "flex flex-col rounded-xl border border-border bg-card overflow-hidden",
          isFullscreenEditor && "hidden"
        )}>
          {/* Tab Headers */}
          <div className="flex border-b border-border/50 bg-muted/20">
            <button
              onClick={() => setActiveLeftTab("variables")}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2",
                activeLeftTab === "variables" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Braces className="h-3.5 w-3.5" /> Variables
            </button>
            <button
              onClick={() => setActiveLeftTab("yaml")}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2",
                activeLeftTab === "yaml" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Terminal className="h-3.5 w-3.5" /> YAML Registry
            </button>
            <button
              onClick={() => setActiveLeftTab("history")}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2",
                activeLeftTab === "history" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="h-3.5 w-3.5" /> Database runs
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 p-5 overflow-hidden flex flex-col justify-between">
            {/* TAB: Variables Form */}
            {activeLeftTab === "variables" && (
              <ScrollArea className="flex-1 pr-1">
                <div className="space-y-5 pb-4">
                  {/* Selected Prompt Dropdown Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Active Template
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" className="w-full justify-between font-mono text-left text-xs bg-muted/30">
                          <div className="flex items-center gap-2 truncate">
                            <Badge variant="secondary" className="text-[10px] font-semibold">{selectedPrompt.id}</Badge>
                            <span className="truncate">{selectedPrompt.name}</span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        </Button>
                      } />
                      <DropdownMenuContent className="w-[368px]" align="start">
                        <DropdownMenuLabel className="flex items-center gap-2 p-2">
                          <Search className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 text-xs font-sans"
                          />
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea className="h-[200px]">
                          {filteredPrompts.map(p => (
                            <DropdownMenuItem 
                              key={p.id} 
                              onClick={() => handleSelectPrompt(p)} 
                              className="flex items-center justify-between p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate max-w-[280px]">
                                <span className={cn(
                                  "h-1.5 w-1.5 rounded-full shrink-0",
                                  p.status === "active" ? "bg-success" : p.status === "review" ? "bg-warning" : "bg-muted-foreground"
                                )} />
                                <span className="font-medium text-foreground truncate">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono shrink-0">({p.id})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => handleToggleFavorite(p.id, e)}
                                  className="text-muted-foreground hover:text-warning text-sm shrink-0"
                                >
                                  <Star className={cn("h-3.5 w-3.5", p.isFavorite && "fill-warning text-warning")} />
                                </button>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Version tag select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Registry Version
                    </label>
                    <Badge variant="outline" className="font-mono text-xs py-1 px-3 bg-muted/10 w-full justify-between">
                      <span>v{selectedVersion}</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold font-sans">Committed SLA</span>
                    </Badge>
                  </div>

                  {/* Render dynamic variables input fields */}
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Template Variables
                    </span>
                    
                    {parsedVariables.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/10 rounded-lg">
                        No variables detected in this prompt template
                      </p>
                    ) : (
                      parsedVariables.map(variable => (
                        <div key={variable.name} className="space-y-1.5">
                          <div className="flex justify-between items-baseline">
                            <label className="text-xs font-semibold text-zinc-300 font-mono">
                              {variable.name}
                              {variable.required && <span className="text-destructive ml-1">*</span>}
                            </label>
                            <span className="text-[9px] text-muted-foreground uppercase">{variable.type}</span>
                          </div>
                          <Input
                            placeholder={`Enter ${variable.name}...`}
                            value={variables[variable.name] || ""}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            className={cn(
                              "bg-zinc-950/60 border-border/80 text-xs font-mono placeholder:font-sans",
                              validationErrors[variable.name] && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* TAB: YAML Viewer */}
            {activeLeftTab === "yaml" && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3 pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    YAML Source (Local Registry)
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyToClipboard(selectedPrompt.yamlContent)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 rounded-lg border border-border/40 bg-zinc-950 p-4 font-mono text-[10px] leading-relaxed overflow-hidden">
                  <ScrollArea className="h-full">
                    <pre className="text-zinc-300 select-text">
                      <code>{selectedPrompt.yamlContent}</code>
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* TAB: History */}
            {activeLeftTab === "history" && (
              <ScrollArea className="flex-1 pr-1">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No execution history found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleSelectHistory(item)}
                        className="p-3 rounded-lg border border-border/80 bg-background/40 hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.timestamp}</span>
                            <h4 className="text-xs font-bold text-foreground truncate max-w-[200px] mt-0.5">{item.promptName}</h4>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteHistory(item.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(item.variables).map(([k, v]) => (
                            <Badge key={k} variant="outline" className="text-[9px] font-mono max-w-[150px] truncate bg-muted/40">
                              {k}: {v}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 italic font-serif">
                          &quot;{item.response}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}

            {/* Bottom Actions Form buttons */}
            {activeLeftTab === "variables" && (
              <div className="flex gap-2 pt-4 border-t border-border/40 bg-card">
                <Button 
                  variant="outline" 
                  onClick={handleResetForm}
                  className="flex-1 h-9 text-xs font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
                 <LiquidButton 
                   label={isExecuting ? "Executing..." : "Run Prompt"}
                   options={{
                     glassThickness: 80,
                     bezelWidth: 8,
                     refractiveIndex: 1.4,
                     profile: "convexSquircle",
                   }}
                   onClick={handleExecute}
                   events={{ click: handleExecute }}
                   disabled={isExecuting}
                   className={cn(
                     "flex-1 h-9 text-xs font-bold text-white shadow rounded-lg cursor-pointer",
                     isExecuting ? "opacity-60 cursor-not-allowed" : ""
                   )}
                 />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Execution Console & Comparison View */}
        <div className={cn(
          "flex flex-col gap-4 overflow-hidden border-l border-border pl-5",
          isFullscreenEditor && "lg:col-span-3 border-l-0 pl-0"
        )}>
          {/* Main output console wrapper */}
          <div className="flex-1 flex flex-col rounded-xl border border-border bg-[#070A11] overflow-hidden min-h-[300px]">
            {/* Header console controls */}
            <div className="flex items-center px-4 py-3 border-b border-border/50 bg-background/40 justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                Playground Output Console
              </div>
              
              <div className="flex gap-2">
                {showResults && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleDownloadOutput}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Split layout comparator container */}
            <div className="flex-1 grid md:grid-cols-2 divide-x divide-border/40 overflow-hidden">
              {/* Primary Panel */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-2 border-b border-border/30 bg-muted/10 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                  <span>Target: {selectedPrompt.id}</span>
                  {latency !== "0s" && <span>Latency: {latency}</span>}
                </div>
                
                <ScrollArea className="flex-1 p-6 font-mono text-xs leading-relaxed select-text">
                  {isExecuting && streamedResponse === "" ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
                      <motion.div 
                        className="w-12 bg-muted h-1 rounded-full overflow-hidden"
                      >
                        <motion.div 
                          className="h-full bg-primary"
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        />
                      </motion.div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest animate-pulse">
                        {executionStep} ({executionProgress}%)
                      </span>
                    </div>
                  ) : streamedResponse ? (
                    <div className="prose prose-zinc dark:prose-invert max-w-none whitespace-pre-wrap select-text text-zinc-300">
                      {streamedResponse}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
                      <AlertCircle className="h-7 w-7 opacity-20 mb-2" />
                      <p className="text-xs">No output compiled yet.</p>
                      <p className="text-[10px] opacity-70">Enter variables and click Run Prompt.</p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Comparison Panel */}
              {isComparisonMode && (
                <div className="flex flex-col h-full overflow-hidden bg-[#0A0D18]/40">
                  <div className="px-4 py-2 border-b border-border/30 bg-muted/10 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                    <span>Compare: {comparePrompt?.id || "None"}</span>
                    {compareLatency !== "0s" && <span>Latency: {compareLatency}</span>}
                  </div>
                  
                  <ScrollArea className="flex-1 p-6 font-mono text-xs leading-relaxed select-text">
                    {isExecuting && compareStreamedResponse === "" ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest animate-pulse">
                          compiling comparison...
                        </span>
                      </div>
                    ) : compareStreamedResponse ? (
                      <div className="prose prose-zinc dark:prose-invert max-w-none whitespace-pre-wrap select-text text-zinc-300">
                        {compareStreamedResponse}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
                        <GitCompare className="h-7 w-7 opacity-20 mb-2" />
                        <p className="text-xs">Select comparison and run.</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          {/* RAGAS Quality Scorecard Footer Panel */}
          {showResults && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-4 border border-border p-4 bg-[#080B13] rounded-xl"
            >
              {/* Primary Metrics column */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" /> Primary SLA Quality scorecards
                  </span>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Tokens: <span className="font-bold text-foreground">{tokenStats.total}</span> · Cost: <span className="font-bold text-success">${tokenStats.cost.toFixed(5)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <QualityMetricMeter name="Faithfulness" value={ragasMetrics.faithfulness} isPass={ragasMetrics.faithfulness >= 0.85} />
                  <QualityMetricMeter name="Relevance" value={ragasMetrics.relevance} isPass={ragasMetrics.relevance >= 0.80} />
                  <QualityMetricMeter name="Precision" value={ragasMetrics.precision} isPass={ragasMetrics.precision >= 0.85} />
                  <QualityMetricMeter name="Recall" value={ragasMetrics.recall} isPass={ragasMetrics.recall >= 0.75} />
                </div>
              </div>

              {/* Comparison Metrics column */}
              {isComparisonMode && compareShowResults && (
                <div className="space-y-3 border-l border-border/30 pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <GitCompare className="h-3.5 w-3.5 text-primary" /> Comparison SLA scores
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <QualityMetricMeter name="Faithfulness" value={compareRagasMetrics.faithfulness} isPass={compareRagasMetrics.faithfulness >= 0.85} />
                    <QualityMetricMeter name="Relevance" value={compareRagasMetrics.relevance} isPass={compareRagasMetrics.relevance >= 0.80} />
                    <QualityMetricMeter name="Precision" value={compareRagasMetrics.precision} isPass={compareRagasMetrics.precision >= 0.85} />
                    <QualityMetricMeter name="Recall" value={compareRagasMetrics.recall} isPass={compareRagasMetrics.recall >= 0.75} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  function QualityMetricMeter({ name, value, isPass }: { name: string, value: number, isPass: boolean }) {
    const isWarning = !isPass && value >= 0.70;
    
    return (
      <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-background/30">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
          {name}
        </span>
        <div className="flex items-baseline gap-2">
          {value > 0 ? (
            <span className={cn(
              "text-xl font-extrabold font-mono",
              isPass ? "text-success" : isWarning ? "text-warning" : "text-destructive"
            )}>
              {value.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
          
          {/* Badge */}
          {value > 0 && (
            <Badge variant="outline" className={cn(
              "text-[8px] px-1 py-0 uppercase shrink-0 font-bold tracking-wider",
              isPass && "bg-success/10 text-success border-success/20",
              isWarning && "bg-warning/10 text-warning border-warning/20",
              (!isPass && !isWarning) && "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              {isPass ? "Pass" : isWarning ? "Warn" : "Fail"}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {value > 0 && (
          <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isPass ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive"
              )} 
              style={{ width: `${value * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  }
}
