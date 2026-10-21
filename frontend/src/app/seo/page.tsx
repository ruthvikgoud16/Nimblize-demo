"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { seoGet, type Opportunity } from "@/lib/seo";

export default function OpportunityQueuePage() {
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    seoGet<{ opportunities: Opportunity[] }>("/api/seo/keywords/opportunities")
      .then((payload) => setRows(payload.opportunities))
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Opportunity queue</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Select a keyword and page. Priority P0 is a technical blocker. The score is the guide formula. The action comes from the rule engine, not from the probability alone.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">API unavailable: {error}. Start `python3 -m uvicorn seo.api.app:app --port 8000`.</p>}
      {!rows && !error && <p className="text-sm text-muted-foreground">Loading the latest run…</p>}
      {rows && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Priority", "Keyword", "Page", "Pos", "Impr.", "CTR", "P(top 10)", "Score", "Conf.", "Bottleneck", "Action"].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-3 font-medium">{row.priority}</td>
                  <td className="px-3 py-3">{row.keyword}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/seo/pages/${row.page_id}?keyword=${row.keyword_id}`}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {row.url.replace("https://www.nimblize.ai", "")}
                    </Link>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{row.position.toFixed(1)}</td>
                  <td className="px-3 py-3 tabular-nums">{Math.round(row.impressions)}</td>
                  <td className="px-3 py-3 tabular-nums">{(row.ctr * 100).toFixed(1)}%</td>
                  <td className="px-3 py-3 tabular-nums">{row.probability.toFixed(2)}</td>
                  <td className="px-3 py-3 tabular-nums">{row.opportunity_score.toFixed(2)}</td>
                  <td className="px-3 py-3 tabular-nums">{row.confidence.toFixed(2)}</td>
                  <td className="px-3 py-3">{row.bottleneck}</td>
                  <td className="px-3 py-3 text-muted-foreground">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
