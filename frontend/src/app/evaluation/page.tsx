import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { BarChart3 } from "lucide-react";

export default function EvaluationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluation Center"
        description="RAGAS quality metrics, SLA compliance tracking, and multi-temperature benchmarks."
      />
      <EmptyState
        title="Coming in Loop 4"
        description="The evaluation dashboard with score tables, line charts, and historical SLA compliance will be implemented in a later loop."
        icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
