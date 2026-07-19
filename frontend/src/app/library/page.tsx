"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { CategoryOverview } from "@/components/library/category-overview";
import { PromptToolbar } from "@/components/library/prompt-toolbar";
import { PromptCard } from "@/components/library/prompt-card";
import { PromptPreviewDrawer } from "@/components/library/prompt-preview-drawer";
import { PromptComparison } from "@/components/library/prompt-comparison";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, SearchX, GitCompare } from "lucide-react";
import { mockPrompts, type PromptTemplate } from "@/lib/mock-data";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [comparePromptA, setComparePromptA] = useState<PromptTemplate | null>(null);
  const [comparePromptB, setComparePromptB] = useState<PromptTemplate | null>(null);

  // Filtering Logic
  const filteredPrompts = useMemo(() => {
    return mockPrompts.filter((prompt) => {
      const matchesSearch =
        searchQuery === "" ||
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        !categoryFilter || prompt.category === categoryFilter;

      const matchesStatus =
        !statusFilter || prompt.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  const handlePromptClick = (prompt: PromptTemplate) => {
    if (compareMode) {
      if (!comparePromptA) {
        setComparePromptA(prompt);
      } else if (!comparePromptB && prompt.id !== comparePromptA.id) {
        setComparePromptB(prompt);
      }
      return;
    }

    setSelectedPrompt(prompt);
    setDrawerOpen(true);
  };

  const handleOpenComparison = () => {
    setCompareMode(true);
    setComparePromptA(null);
    setComparePromptB(null);
  };

  const handleCancelComparison = () => {
    setCompareMode(false);
    setComparePromptA(null);
    setComparePromptB(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Prompt Library"
        description="Browse, version, and evaluate 29 YAML templates across 8 categories."
      >
        <div className="flex items-center gap-2">
          {!compareMode ? (
            <Button variant="outline" onClick={handleOpenComparison} className="gap-2">
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleCancelComparison}>
              Cancel Comparison
            </Button>
          )}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>
      </PageHeader>

      <CategoryOverview />

      <div className="space-y-4 pt-4 border-t border-border/50">
        <PromptToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {compareMode && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Comparison Mode Active</p>
              <p className="text-xs text-muted-foreground">
                {!comparePromptA
                  ? "Select the first prompt to compare."
                  : !comparePromptB
                  ? `First prompt selected: ${comparePromptA.id}. Select the second prompt.`
                  : "Ready to compare!"}
              </p>
            </div>
            {comparePromptA && comparePromptB && (
              <Button onClick={() => {}} className="gap-2">
                <GitCompare className="h-4 w-4" />
                View Diff
              </Button>
            )}
          </div>
        )}

        {filteredPrompts.length === 0 ? (
          <EmptyState
            title="No prompts found"
            description="Adjust your search filters or try a different query."
            icon={<SearchX className="h-5 w-5 text-muted-foreground" />}
          >
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setCategoryFilter(null);
              setStatusFilter(null);
            }}>
              Clear Filters
            </Button>
          </EmptyState>
        ) : (
          <motion.div
            layout
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            <AnimatePresence mode="popLayout">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onClick={() => handlePromptClick(prompt)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <PromptPreviewDrawer
        prompt={selectedPrompt}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <PromptComparison
        promptA={comparePromptA}
        promptB={comparePromptB}
        open={!!(comparePromptA && comparePromptB && compareMode)}
        onOpenChange={(open) => {
          if (!open) {
            setComparePromptA(null);
            setComparePromptB(null);
          }
        }}
      />
    </div>
  );
}
