import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Library } from "lucide-react";

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Library"
        description="Browse and manage 29 versioned YAML prompt templates across 8 categories."
      />
      <EmptyState
        title="Coming in Loop 2"
        description="The prompt catalog grid with search, filters, and category tabs will be implemented in the next development loop."
        icon={<Library className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
