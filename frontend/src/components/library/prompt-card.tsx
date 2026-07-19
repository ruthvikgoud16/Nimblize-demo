"use client";

import { motion } from "framer-motion";
import { Star, MoreVertical, Copy, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PromptTemplate } from "@/lib/mock-data";

interface PromptCardProps {
  prompt: PromptTemplate;
  onClick: () => void;
}

const statusColors = {
  active: "bg-success/15 text-success border-success/30",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-destructive/15 text-destructive border-destructive/30",
  review: "bg-warning/15 text-warning border-warning/30",
};

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group h-full"
    >
      <Card 
        className="relative h-full cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 bg-card"
        onClick={onClick}
      >
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {prompt.id}
                </span>
                <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5 shrink-0">
                  {prompt.category}
                </Badge>
              </div>
              <h3 className="font-semibold tracking-tight text-base truncate group-hover:text-primary transition-colors">
                {prompt.name}
              </h3>
            </div>
            
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); }}>
                <Star className={cn("h-4 w-4", prompt.isFavorite && "fill-yellow-400 text-yellow-400")} />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {prompt.description}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-auto">
            {prompt.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-normal bg-background/50">
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground ml-1">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border", statusColors[prompt.status])}>
                  {prompt.status === 'active' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {prompt.status === 'review' && <Clock className="mr-1 h-3 w-3" />}
                  {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{prompt.version}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className={cn(
                "flex items-center gap-1",
                prompt.qualityScore >= 0.9 ? "text-success" : 
                prompt.qualityScore >= 0.8 ? "text-warning" : "text-destructive"
              )}>
                <span className="font-mono">
                  {(prompt.qualityScore * 100).toFixed(0)}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">QS</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
