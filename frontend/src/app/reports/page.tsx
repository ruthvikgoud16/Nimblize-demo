"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Search, 
  Download, 
  Calendar, 
  Filter,
  Pin,
  FileText,
  Tag,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  summary: string;
  category: string;
  created_at: string;
  author: string;
  status: "success" | "warning" | "error";
  score: number;
  content: string;
  tags: string[];
  pinned: boolean;
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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"markdown" | "pdf">("markdown");

  // Toasts state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Fetch reports on mount
  useEffect(() => {
    fetchFromAPI("/api/v1/reports")
      .then(data => setReports(data.reports))
      .catch(err => showToast(`Failed to load reports: ${err.message}`, "error"));
  }, []);

  // Toggle report pinned state
  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const data = await fetchFromAPI(`/api/v1/reports/${id}/pin`, {
        method: "POST"
      });
      setReports(prev => prev.map(r => r.id === id ? { ...r, pinned: data.pinned } : r));
      showToast(data.pinned ? `Pinned report to top` : `Unpinned report`, "info");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to toggle pin: ${errMsg}`, "error");
    }
  };

  // Download report
  const handleDownload = (report: Report, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const element = document.createElement("a");
    const file = new Blob([report.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${report.id.toLowerCase()}_${report.title.toLowerCase().replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    showToast(`Downloaded ${report.id} successfully!`);
  };

  // Extract all categories & tags dynamically
  const categories = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.category)));
  }, [reports]);

  const tags = useMemo(() => {
    const allTags = reports.flatMap(r => r.tags);
    return Array.from(new Set(allTags));
  }, [reports]);

  // Filtering Logic
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || r.category === selectedCategory;
      const matchesTag = !selectedTag || r.tags.includes(selectedTag);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [reports, searchQuery, selectedCategory, selectedTag]);

  // Split into pinned and unpinned
  const pinnedReports = useMemo(() => filteredReports.filter(r => r.pinned), [filteredReports]);
  const otherReports = useMemo(() => filteredReports.filter(r => !r.pinned), [filteredReports]);

  const handleOpenDrawer = (report: Report) => {
    setSelectedReport(report);
    setActiveTab("markdown");
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Container */}
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
        title="Reports Center"
        description="View, export, and manage generated execution and audit reports."
      >
        <Button variant="outline" className="gap-2" onClick={() => showToast("Bulk export queued for all strategy reports.", "info")}>
          <Download className="h-4 w-4" />
          Export All Reports
        </Button>
      </PageHeader>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 border-b border-border/40 pb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search reports by title, ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card text-xs h-9"
          />
        </div>

        {/* Category filters list */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          
          <Button 
            variant={selectedCategory === null ? "default" : "outline"} 
            size="sm" 
            onClick={() => setSelectedCategory(null)}
            className="text-[10px] h-7 px-2.5"
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-[10px] h-7 px-2.5"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Tag Filters dropdown */}
        <div className="flex items-center gap-2 md:ml-auto">
          <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <select
            value={selectedTag || ""}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="bg-card border border-border text-xs rounded-lg px-2.5 py-1.5 h-9 focus:ring-primary focus:border-primary text-muted-foreground font-medium"
          >
            <option value="">All Tags</option>
            {tags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-xl bg-card">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <h3 className="text-sm font-bold text-foreground">No reports generated yet</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Run a pipeline execution in the Automation Studio to compile strategy audits.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedReports.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-primary rotate-45" /> Pinned Reports
              </span>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedReports.map(report => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    onPin={(e) => handleTogglePin(report.id, e)}
                    onDownload={(e) => handleDownload(report, e)}
                    onClick={() => handleOpenDrawer(report)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Other Reports */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> All Audit Reports
            </span>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherReports.map(report => (
                <ReportCard 
                  key={report.id} 
                  report={report} 
                  onPin={(e) => handleTogglePin(report.id, e)}
                  onDownload={(e) => handleDownload(report, e)}
                  onClick={() => handleOpenDrawer(report)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drawer content inspector */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-2xl bg-[#080B11] border-l border-border/80 text-foreground p-0 flex flex-col h-full select-none">
          {selectedReport && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Drawer Header */}
              <SheetHeader className="p-6 border-b border-border/40 bg-card">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">{selectedReport.id}</Badge>
                      <Badge className={cn(
                        "text-[9px] uppercase tracking-wider font-bold",
                        selectedReport.status === "success" && "bg-success/15 text-success hover:bg-success/20",
                        selectedReport.status === "warning" && "bg-warning/15 text-warning hover:bg-warning/20",
                        selectedReport.status === "error" && "bg-destructive/15 text-destructive hover:bg-destructive/20"
                      )}>{selectedReport.status}</Badge>
                    </div>
                    <SheetTitle className="text-base font-extrabold tracking-tight text-foreground">{selectedReport.title}</SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">{selectedReport.summary}</SheetDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => handleDownload(selectedReport, e)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* Document tabs */}
              <div className="flex border-b border-border/30 bg-muted/20">
                <button 
                  onClick={() => setActiveTab("markdown")}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                    activeTab === "markdown" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Raw Markdown
                </button>
                <button 
                  onClick={() => setActiveTab("pdf")}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                    activeTab === "pdf" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  PDF Certificate Preview
                </button>
              </div>

              {/* Document Viewer Body */}
              <ScrollArea className="flex-1 p-6 bg-zinc-950/40">
                {activeTab === "markdown" ? (
                  <div className="prose prose-zinc dark:prose-invert max-w-none font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap select-text p-4 rounded-xl border border-border/40 bg-zinc-950">
                    {selectedReport.content}
                  </div>
                ) : (
                  <div className="bg-white text-zinc-900 p-8 rounded-xl border shadow-lg max-w-[21cm] min-h-[29.7cm] mx-auto font-serif relative overflow-hidden select-text">
                    {/* Watermark logo background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                      <FileText className="h-[300px] w-[300px]" />
                    </div>

                    <div className="space-y-8 relative z-10 text-xs">
                      {/* PDF Header */}
                      <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-5">
                        <div>
                          <h2 className="text-lg font-bold tracking-wider uppercase font-sans">Nimblize AI</h2>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans mt-0.5">SLA Certification Authority</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-zinc-600 font-semibold">{selectedReport.id}</span>
                          <p className="text-zinc-400 mt-1">{selectedReport.created_at}</p>
                        </div>
                      </div>

                      {/* PDF Title */}
                      <div className="space-y-2 py-4">
                        <h1 className="text-2xl font-bold font-sans text-center tracking-tight leading-tight">{selectedReport.title.toUpperCase()}</h1>
                        <p className="text-center italic text-zinc-500 max-w-md mx-auto">This document certifies that the generated competitor intelligence payload cleared the quality SLA benchmarks.</p>
                      </div>

                      {/* PDF Main details */}
                      <div className="space-y-4 font-sans border border-zinc-200 p-5 rounded-lg bg-zinc-50/50">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-600 border-b border-zinc-200 pb-2">Generation audit credentials</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                          <span className="text-zinc-500">Pipeline ID:</span>
                          <span className="font-mono font-bold text-zinc-800 text-right">pipeline-5db9cf28</span>
                          
                          <span className="text-zinc-500">Trigger Mode:</span>
                          <span className="font-bold text-zinc-800 text-right">Automated API Webhook</span>
                          
                          <span className="text-zinc-500">Evaluator Engine:</span>
                          <span className="font-bold text-zinc-800 text-right">RAGAS Quality Gate v0.85</span>
                          
                          <span className="text-zinc-500">RAGAS Quality Score:</span>
                          <span className={cn(
                            "font-bold text-right",
                            selectedReport.score >= 0.85 ? "text-emerald-700" : "text-amber-700"
                          )}>{(selectedReport.score * 100).toFixed(0)}% Pass</span>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-sans border-b border-zinc-200 pb-1">1. Summary findings</h3>
                        <p className="leading-relaxed indent-6 text-zinc-700">{selectedReport.summary}</p>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-sans border-b border-zinc-200 pb-1">2. Strategic recommendations</h3>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-700 font-sans leading-relaxed">
                          <li>Integrate transactional programmatic keywords.</li>
                          <li>Activate affiliate widgets to boost monetization yield.</li>
                          <li>Monitor competitor changes weekly to detect drifts.</li>
                        </ul>
                      </div>

                      {/* PDF Footer Signatures */}
                      <div className="pt-16 grid grid-cols-2 gap-12 font-sans text-center">
                        <div className="space-y-1">
                          <div className="h-[1px] bg-zinc-400 w-full" />
                          <p className="text-[9px] uppercase text-zinc-500 tracking-wider">SARAH JENKINS</p>
                          <p className="text-[8px] text-zinc-400">Head of Competitive Research</p>
                        </div>
                        <div className="space-y-1">
                          <div className="h-[1px] bg-zinc-400 w-full" />
                          <p className="text-[9px] uppercase text-zinc-500 tracking-wider">Aastha Shukla</p>
                          <p className="text-[8px] text-zinc-400">Lead QA Evaluator</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ReportCard({ report, onPin, onDownload, onClick }: { 
  report: Report; 
  onPin: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "bg-card border-border/80 hover:border-zinc-700 transition-all duration-300 cursor-pointer overflow-hidden relative group shadow-sm flex flex-col justify-between h-[188px]",
        report.pinned && "border-primary/50 shadow-md shadow-primary/[0.02]"
      )}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-1.5 truncate">
              <Badge variant="outline" className="font-mono text-[9px] py-0 px-1 bg-muted/20 shrink-0">{report.id}</Badge>
              <span className="text-[10px] text-muted-foreground truncate">{report.category}</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button 
                onClick={onPin}
                className={cn(
                  "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  report.pinned && "text-primary opacity-100"
                )}
              >
                <Pin className={cn("h-3.5 w-3.5", report.pinned && "fill-primary rotate-45")} />
              </button>
              <button 
                onClick={onDownload}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xs font-bold leading-snug group-hover:text-primary transition-colors line-clamp-1 text-foreground">{report.title}</h3>
          
          {/* Summary */}
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{report.summary}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[10px] font-mono text-muted-foreground mt-3">
          <div className="flex items-center gap-1">
            <span className="truncate max-w-[100px]">{report.author}</span>
            <span>·</span>
            <span>{report.created_at}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              report.status === "success" && "bg-success",
              report.status === "warning" && "bg-warning",
              report.status === "error" && "bg-destructive"
            )} />
            <span className="text-foreground">{(report.score * 100).toFixed(0)}% Quality</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
