"use client";

import { useEffect, useState } from "react";
import { seoGet, type Experiment } from "@/lib/seo";

export default function ExperimentsPage() {
  const [rows, setRows] = useState<Experiment[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    seoGet<{ experiments: Experiment[] }>("/api/seo/experiments")
      .then((payload) => setRows(payload.experiments))
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Experiment history</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Each change is compared with the Search Console window after it. The result is an association. One before/after pair is not proof of cause.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows?.map((row) => (
        <article key={row.id} className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">{row.keyword}</h3>
          <p className="text-muted-foreground">{row.url} · {row.change_date} · {row.change_type} · {row.owner}</p>
          <p className="mt-3">{row.reason}</p>
          <p className="mt-2 text-muted-foreground">Before: {row.old_version}</p>
          <p className="text-muted-foreground">After: {row.new_version}</p>
          <p className="mt-3">Expected: {row.expected_outcome}</p>
          <p className="mt-2 tabular-nums">
            Position {row.position_before.toFixed(2)} → {row.position_after.toFixed(2)}. Clicks {row.clicks_before} → {row.clicks_after}. Result: {row.result_kind}.
          </p>
        </article>
      ))}
    </div>
  );
}
