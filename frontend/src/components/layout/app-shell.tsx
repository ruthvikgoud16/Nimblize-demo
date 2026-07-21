"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuthProvider } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isLandingPage = pathname === "/landing";

  if (isLandingPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <AuthProvider>
      <div className="flex min-h-screen relative overflow-hidden bg-background">
        {/* Grid and Glow Background Decoration */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 tech-grid-pattern opacity-70"></div>
          <div className="absolute left-[30%] top-1/3 h-[900px] w-[900px] rounded-full tech-glow-blob pointer-events-none blur-[100px] animate-tech-float"></div>
          <div className="absolute right-[15%] bottom-[10%] h-[700px] w-[700px] rounded-full tech-glow-blob pointer-events-none blur-[120px] opacity-80"></div>
        </div>

        {/* Desktop sidebar */}
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Mobile nav */}
        <MobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        {/* Main content area */}
        <div
          className={cn(
            "flex flex-1 flex-col transition-[margin-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10",
            "md:ml-60"
          )}
          style={mounted ? { marginLeft: `${sidebarWidth}px` } : undefined}
        >
          <TopNavbar onMobileMenuToggle={() => setMobileNavOpen(true)} />

          <main className="flex-1 p-4 md:p-6 relative z-10">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border px-4 py-3 md:px-6 relative z-10 bg-background/50 backdrop-blur-md">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Nimblize Studio v1.0.0 · Built with precision
              </p>
              <p className="text-xs text-muted-foreground">
                29 Prompts · 8 Categories · RAGAS SLA Active
              </p>
            </div>
          </footer>
        </div>
      </div>
    </AuthProvider>
  );
}
