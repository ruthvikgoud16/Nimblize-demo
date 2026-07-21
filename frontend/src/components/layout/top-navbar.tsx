"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Monitor,
  Menu,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useState, useEffect } from "react";
import { type SystemNotification } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchFromAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

interface TopNavbarProps {
  onMobileMenuToggle: () => void;
}

export function TopNavbar({ onMobileMenuToggle }: TopNavbarProps) {
  const { setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Load notifications from production DB on mount
  useEffect(() => {
    fetchFromAPI("/api/v1/notifications")
      .then(data => setNotifications(data.notifications))
      .catch(err => console.error("Notifications fetch error:", err));
  }, []);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchFromAPI("/api/v1/notifications/read", {
        method: "POST",
        body: JSON.stringify({ all: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const handleReadNotif = async (id: string) => {
    try {
      await fetchFromAPI("/api/v1/notifications/read", {
        method: "POST",
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Read notification failed:", err);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-dashed border-neutral-300 dark:border-neutral-700 bg-background/80 px-4 backdrop-blur-md md:px-6"
      >
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden select-none">
          <span className="text-lg font-bold text-neutral-900 dark:text-white">✦</span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">Nimblize</span>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden md:flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search prompts, actions...</span>
          <kbd className="pointer-events-none ml-4 hidden select-none rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Environment badge */}
          <Badge
            variant="outline"
            className="hidden border-success/30 text-success sm:inline-flex"
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
            Production
          </Badge>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Bell className="h-4 w-4" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-[320px] p-0 bg-card border">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-2 bg-muted/20">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  Mark all as read
                </button>
              </div>
              <ScrollArea className="h-[280px]">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">No notifications</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((n) => (
                      <DropdownMenuItem 
                        key={n.id} 
                        onClick={() => handleReadNotif(n.id)}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer text-xs transition-colors hover:bg-muted/40"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              !n.read ? "bg-primary animate-pulse" : "bg-transparent"
                            )} />
                            {n.title}
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">{n.message}</p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : "AD"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 p-1">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground leading-none">{user?.name || "Admin Developer"}</span>
                  <span className="text-[10px] text-muted-foreground font-mono leading-none pt-0.5">{user?.email || "admin@nimblize.ai"}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs font-medium cursor-pointer">Profile Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-medium cursor-pointer">API Credentials</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="text-xs font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
