"use client";

import { useEffect, useState } from "react";
import { seoGet } from "@/lib/seo";

type Boards = {
  overview: {
    observations: number;
    opportunities: number;
    p0: number;
    serving_name: string | null;
    model_version: string | null;
    trained_through: string | null;
  };
  technical: Array<{
    url: string;
    keyword: string;
    indexable: boolean | null;
    status: number | null;
    lcp_ms: number | null;
    inp_ms: number | null;
    cls: number | null;
    canonical: string | null;
    jsonld_count: number | null;
  }>;
  content: Array<{
    keyword: string;
    url: string;
    topic_coverage: number | null;
    semantic_similarity: number | null;
    missing_topics: string[];
    bottleneck: string;
    action: string;
  }>;
  competitors: Array<{
    keyword: string;
    url: string;
    competitor_url: string | null;
    authority_gap: number | null;
    competitor_position: number | null;
  }>;
  rankings: Array<{
    keyword: string;
    url: string;
    position: number;
    probability: number;
    impressions: number;
    priority: string;
  }>;
  recommendations: Array<{
    keyword: string;
    url: string;
    priority: string;
    bottleneck: string;
    action: string;
    status: string;
    effort: number;
  }>;
};

const copy = {
  overview: {
    title: "Overview",
    lede: "Visibility counts from the latest stored run. The queue is where the next action is chosen.",
  },
  technical: {
    title: "Technical health",
    lede: "Indexing, status, canonical, structured data, and field Core Web Vitals stored with each opportunity.",
  },
  content: {
    title: "Content intelligence",
    lede: "Topic coverage and the terms present on the stronger page. The action is a gap, and the page stays human-written.",
  },
  competitors: {
    title: "Competitor gap",
    lede: "Authority and position differences against the sampled stronger page. The gap is evidence for an original asset.",
  },
  rankings: {
    title: "Ranking monitor",
    lede: "Latest mobile position in the primary country, with the Top-10 probability from the serving model.",
  },
  recommendations: {
    title: "Recommendations",
    lede: "Status and action come from the stored queue. The human owner stays seo-team until you supply a name. Marking a row Implemented records that change.",
  },
} as const;

function num(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return value.toFixed(digits);
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-0 align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BoardScreen({ screen }: { screen: keyof typeof copy }) {
  const [boards, setBoards] = useState<Boards | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    seoGet<Boards>("/api/seo/boards")
      .then(setBoards)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const text = copy[screen];
  let table: { headers: string[]; rows: string[][] } | null = null;
  if (boards && screen === "technical") {
    table = {
      headers: ["Keyword", "URL", "Indexable", "Status", "LCP ms", "INP ms", "CLS", "JSON-LD"],
      rows: boards.technical.map((row) => [
        row.keyword,
        row.url,
        row.indexable == null ? "n/a" : row.indexable ? "yes" : "no",
        row.status == null ? "n/a" : String(row.status),
        num(row.lcp_ms, 0),
        num(row.inp_ms, 0),
        num(row.cls, 2),
        row.jsonld_count == null ? "n/a" : String(row.jsonld_count),
      ]),
    };
  }
  if (boards && screen === "content") {
    table = {
      headers: ["Keyword", "Coverage", "Similarity", "Missing topics", "Action"],
      rows: boards.content.map((row) => [
        row.keyword,
        num(row.topic_coverage),
        num(row.semantic_similarity),
        row.missing_topics.join(", ") || "none",
        row.action,
      ]),
    };
  }
  if (boards && screen === "competitors") {
    table = {
      headers: ["Keyword", "Our URL", "Stronger URL", "Their position", "Authority gap"],
      rows: boards.competitors.map((row) => [
        row.keyword,
        row.url,
        row.competitor_url || "n/a",
        num(row.competitor_position, 1),
        num(row.authority_gap, 0),
      ]),
    };
  }
  if (boards && screen === "rankings") {
    table = {
      headers: ["Priority", "Keyword", "Position", "P(top 10)", "Impressions", "URL"],
      rows: boards.rankings.map((row) => [
        row.priority,
        row.keyword,
        num(row.position, 1),
        num(row.probability),
        num(row.impressions, 0),
        row.url,
      ]),
    };
  }
  if (boards && screen === "recommendations") {
    table = {
      headers: ["Priority", "Keyword", "Bottleneck", "Status", "Effort", "Action"],
      rows: boards.recommendations.map((row) => [
        row.priority,
        row.keyword,
        row.bottleneck,
        row.status,
        String(row.effort),
        row.action,
      ]),
    };
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{text.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{text.lede}</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!boards && !error && <p className="text-sm text-muted-foreground">Loading the latest run…</p>}
      {boards && screen === "overview" && (
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ["Observations", String(boards.overview.observations)],
            ["Opportunities", String(boards.overview.opportunities)],
            ["P0 blockers", String(boards.overview.p0)],
            ["Serving model", boards.overview.serving_name || "n/a"],
            ["Version", boards.overview.model_version || "n/a"],
            ["Trained through", boards.overview.trained_through || "n/a"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {table && <Table headers={table.headers} rows={table.rows} />}
    </div>
  );
}
