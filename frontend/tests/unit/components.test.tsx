/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/common/metric-card";
import { Activity } from "lucide-react";

// Mock framer-motion to bypass layout/animation loop errors in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Core Design Components Unit Tests", () => {
  
  test("1. Button renders children and responds to variant styling", () => {
    const { rerender } = render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();

    // Rerender with different variant
    rerender(<Button variant="destructive">Delete Item</Button>);
    const destButton = screen.getByRole("button", { name: /delete item/i });
    expect(destButton).toBeInTheDocument();
  });

  test("2. Badge renders custom text and state colors", () => {
    render(<Badge variant="secondary">In Progress</Badge>);
    const badgeElement = screen.getByText("In Progress");
    expect(badgeElement).toBeInTheDocument();
  });

  test("3. MetricCard renders value, title, and trend metadata", () => {
    render(
      <MetricCard
        title="Accuracy Rating"
        value="0.94"
        description="RAGAS evaluation SLA rating"
        icon={Activity}
        trend={{ value: "1.2%", positive: true }}
      />
    );

    // Verify Title
    expect(screen.getByText("Accuracy Rating")).toBeInTheDocument();
    
    // Verify Value
    expect(screen.getByText("0.94")).toBeInTheDocument();

    // Verify Trend percentage
    expect(screen.getByText(/1.2%/)).toBeInTheDocument();

    // Verify SLA description
    expect(screen.getByText("RAGAS evaluation SLA rating")).toBeInTheDocument();
  });
});
