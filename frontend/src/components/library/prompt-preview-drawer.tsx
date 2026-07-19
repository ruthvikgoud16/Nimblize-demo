"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Terminal, GitMerge, FileCode2, Zap, Play } from "lucide-react";
import type { PromptTemplate } from "@/lib/mock-data";

interface PromptPreviewDrawerProps {
  prompt: PromptTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptPreviewDrawer({ prompt, open, onOpenChange }: PromptPreviewDrawerProps) {
  if (!prompt) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl border-l border-border bg-sidebar p-0 flex flex-col">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
              {prompt.id}
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-background/50">
              {prompt.version}
            </Badge>
          </div>
          
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-xl flex items-center justify-between">
              <span>{prompt.name}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </SheetTitle>
            <SheetDescription className="text-sm">
              {prompt.description}
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 border-t border-border/50">
          <div className="p-6 space-y-6">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Category</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  {prompt.category}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Quality Score</p>
                <p className="text-sm font-mono font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  {(prompt.qualityScore * 100).toFixed(0)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Last Updated</p>
                <p className="text-sm font-medium">{prompt.updatedAt}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <p className="text-sm font-medium capitalize">{prompt.status}</p>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Tags */}
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-muted-foreground" />
                Semantic Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-accent/50 hover:bg-accent font-normal text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* YAML Editor Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  Template Source
                </p>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5">
                  <Play className="h-3 w-3" />
                  Open in Playground
                </Button>
              </div>
              <div className="relative rounded-md overflow-hidden border border-border bg-[#0B0F19]">
                <div className="flex items-center px-4 py-2 border-b border-border/50 bg-background/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
                  </div>
                  <span className="ml-3 text-[10px] font-mono text-muted-foreground">template.yaml</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                    <code>{prompt.yamlContent}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
