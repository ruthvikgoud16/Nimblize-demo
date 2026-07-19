import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Workflow } from "lucide-react";

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Studio"
        description="CIMS pipeline orchestration, visual workflow builder, and trigger management."
      />
      <EmptyState
        title="Coming in Loop 3"
        description="The visual pipeline node graph with manual triggers, scheduled crawlers, and webhook configuration will be built in a later loop."
        icon={<Workflow className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
