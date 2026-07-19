import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { FlaskConical } from "lucide-react";

export default function PlaygroundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Playground"
        description="Test and tune prompt parameters with live YAML editing and execution output."
      />
      <EmptyState
        title="Coming in Loop 2"
        description="The split-screen prompt editor with Monaco YAML highlighting and model configuration will be built in the next loop."
        icon={<FlaskConical className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
