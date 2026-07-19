"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navigation } from "@/lib/navigation";
import { useEffect } from "react";
import { mockPrompts } from "@/lib/mock-data";
import { FileCode, FileText } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockReports = [
  { id: "REP-001", title: "SEO Strategy Evaluation Report" },
  { id: "REP-002", title: "Competitor Feature Matrix Drift Analysis" },
  { id: "REP-053", title: "PII Leakage Audit" }
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search prompts, reports, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {navigation.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleSelect(item.href)}
              className="gap-3"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Prompt Templates">
          {mockPrompts.map((p) => (
            <CommandItem
              key={p.id}
              onSelect={() => handleSelect(`/playground?prompt=${p.id}`)}
              className="gap-3"
            >
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Reports">
          {mockReports.map((r) => (
            <CommandItem
              key={r.id}
              onSelect={() => handleSelect("/reports")}
              className="gap-3"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.id}</p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => handleSelect("/automation")}
            className="gap-3"
          >
            <span className="text-sm font-semibold">Trigger CIMS Pipeline</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
