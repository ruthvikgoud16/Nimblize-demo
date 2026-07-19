"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, AlertCircle } from "lucide-react";
import type { PromptTemplate } from "@/lib/mock-data";

interface PromptComparisonProps {
  promptA: PromptTemplate | null;
  promptB: PromptTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptComparison({ promptA, promptB, open, onOpenChange }: PromptComparisonProps) {
  if (!promptA || !promptB) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-sidebar border-border">
        <div className="p-6 pb-4 border-b border-border/50 bg-background/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GitCompare className="h-5 w-5 text-primary" />
              Compare Versions
            </DialogTitle>
            <DialogDescription>
              Comparing <span className="font-mono font-medium text-foreground">{promptA.id}</span> ({promptA.version}) against <span className="font-mono font-medium text-foreground">{promptB.id}</span> ({promptB.version}).
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 grid grid-cols-2 divide-x divide-border overflow-hidden">
          {/* Prompt A */}
          <div className="flex flex-col overflow-hidden bg-card/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono">
                  {promptA.version}
                </Badge>
                <span className="text-sm font-medium">{promptA.name}</span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <pre className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                <code>{promptA.yamlContent}</code>
              </pre>
            </ScrollArea>
          </div>

          {/* Prompt B */}
          <div className="flex flex-col overflow-hidden bg-card/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-mono">
                  {promptB.version}
                </Badge>
                <span className="text-sm font-medium">{promptB.name}</span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <pre className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                <code>{promptB.yamlContent}</code>
              </pre>
            </ScrollArea>
          </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Diff highlighting is mocked for demonstration purposes.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
