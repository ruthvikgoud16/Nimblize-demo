import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Environment variables, API provider configuration, and application preferences."
      />
      <EmptyState
        title="Coming in Loop 5"
        description="The settings panel with environment config, API key management, and provider settings will be built in a later loop."
        icon={<Settings className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
