"use client";

import { Search, SlidersHorizontal, ArrowUpDown, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface PromptToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
}

export function PromptToolbar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
}: PromptToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search templates, tags, or descriptions..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden select-none rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
          /
        </kbd>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filter
                {(categoryFilter || statusFilter) && (
                  <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {(categoryFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
                  </span>
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter === null}
              onCheckedChange={() => setStatusFilter(null)}
            >
              All Statuses
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === "active"}
              onCheckedChange={() => setStatusFilter("active")}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter === "draft"}
              onCheckedChange={() => setStatusFilter("draft")}
            >
              Draft
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={categoryFilter === null}
              onCheckedChange={() => setCategoryFilter(null)}
            >
              All Categories
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={categoryFilter === "SEO Analysis"}
              onCheckedChange={() => setCategoryFilter("SEO Analysis")}
            >
              SEO Analysis
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={categoryFilter === "Customer Support"}
              onCheckedChange={() => setCategoryFilter("Customer Support")}
            >
              Customer Support
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Newest First</DropdownMenuItem>
            <DropdownMenuItem>Highest Quality Score</DropdownMenuItem>
            <DropdownMenuItem>Alphabetical (A-Z)</DropdownMenuItem>
            <DropdownMenuItem>Recently Updated</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* View Toggle */}
        <div className="flex h-9 items-center rounded-md border border-input bg-background p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "grid" ? "h-7 w-7 bg-accent text-accent-foreground shadow-sm" : "h-7 w-7 text-muted-foreground"}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "list" ? "h-7 w-7 bg-accent text-accent-foreground shadow-sm" : "h-7 w-7 text-muted-foreground"}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
