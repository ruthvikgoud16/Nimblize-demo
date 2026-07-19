"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React rendering boundary error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070A11] px-4 text-center">
          <div className="max-w-md w-full border border-destructive/30 bg-destructive/5 rounded-xl p-8 backdrop-blur-xl flex flex-col items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Application Crash Intercepted</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected runtime error crashed the user interface rendering stack. Our telemetry engine has logged the exception.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full text-left rounded-lg bg-zinc-950/60 border border-border/40 p-4 font-mono text-[10px] text-destructive overflow-auto max-h-[140px]">
                <span className="font-bold">Exception:</span> {this.state.error.message}
                {this.state.error.stack && (
                  <pre className="mt-2 text-muted-foreground whitespace-pre-wrap leading-normal font-mono select-text">
                    {this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                  </pre>
                )}
              </div>
            )}

            <Button 
              onClick={this.handleReset}
              className="w-full h-9 gap-2 text-xs font-bold uppercase tracking-wider bg-destructive hover:bg-destructive/90 text-white shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset & Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
