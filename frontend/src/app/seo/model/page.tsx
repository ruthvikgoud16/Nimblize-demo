"use client";

import { useEffect, useState } from "react";
import { seoGet } from "@/lib/seo";

type MetricRow = { precision: number; recall: number; f1: number; pr_auc: number; brier: number; precision_at_k: number };
type SegmentRow = { rows: number; pr_auc: number | null };

type ModelCard = {
  version: string;
  feature_version: string;
  serving_name: string;
  promoted_boosting: number;
  trained_through: string;
  metrics: Record<string, MetricRow | { segments?: never } | Record<string, SegmentRow>>;
  drift: Array<{ feature: string; train_median: number; recent_median: number; relative_change: number; flagged: number }>;
};

export default function ModelPage() {
  const [model, setModel] = useState<ModelCard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    seoGet<ModelCard>("/api/seo/models/current")
      .then(setModel)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const flagged = model?.drift.filter((row) => row.flagged) ?? [];
  const metricRows = Object.entries(model?.metrics ?? {}).filter((entry): entry is [string, MetricRow] => {
    const value = entry[1] as Partial<MetricRow>;
    return typeof value?.pr_auc === "number" && typeof value?.precision === "number";
  });
  const segments = (model?.metrics?.segments ?? null) as Record<string, SegmentRow> | null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Model monitor</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Time-ordered test metrics. The booster is promoted only when PR-AUC gains at least 0.03 and precision at 10 does not fall.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {model && (
        <>
          <p className="text-sm text-muted-foreground">
            Serving {model.serving_name} · {model.version} · features {model.feature_version} · trained through {model.trained_through}. Boosting promoted: {model.promoted_boosting ? "yes" : "no"}.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>{["Model", "Precision", "Recall", "F1", "PR-AUC", "Brier", "P@10"].map((heading) => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {metricRows.map(([name, metrics]) => (
                  <tr key={name} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2 tabular-nums">{metrics.precision.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">{metrics.recall.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">{metrics.f1.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">{metrics.pr_auc.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">{metrics.brier.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">{metrics.precision_at_k.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {segments && Object.keys(segments).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Intent segments</h3>
              <p className="text-sm text-muted-foreground">Test-set PR-AUC from the serving model, split by intent. A segment with too few rows, or with only one class, has no PR-AUC.</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      {["Intent", "Test rows", "PR-AUC"].map((heading) => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(segments).map(([intent, segment]) => (
                      <tr key={intent} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{intent}</td>
                        <td className="px-3 py-2 tabular-nums">{segment?.rows ?? "n/a"}</td>
                        <td className="px-3 py-2 tabular-nums">{typeof segment?.pr_auc === "number" ? segment.pr_auc.toFixed(3) : "n/a"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Drift flags ({flagged.length}): {flagged.map((row) => row.feature).join(", ") || "none"}. A flag is a 50% move in the median versus the training window. It does not retrain by itself.
          </p>
        </>
      )}
    </div>
  );
}
