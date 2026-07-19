import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { UserCheck } from "lucide-react";

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Human-in-the-loop review console for flagged pipeline outputs."
      />
      <EmptyState
        title="Coming in Loop 4"
        description="The HITL dual-panel review workspace with PII diff comparison and approval controls will be built in a later loop."
        icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
