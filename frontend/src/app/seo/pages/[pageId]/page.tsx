"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { seoGet, type Audit } from "@/lib/seo";

function Evidence() {
  const params = useParams<{ pageId: string }>();
  const search = useSearchParams();
  const keywordId = search.get("keyword") || "";
  const [audit, setAudit] = useState<Audit | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!keywordId) {
      setError("Missing keyword id.");
      return;
    }
    seoGet<Audit>(`/api/seo/pages/${params.pageId}/audit?keyword_id=${keywordId}`)
      .then(setAudit)
      .catch((reason: Error) => setError(reason.message));
  }, [keywordId, params.pageId]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!audit) return <p className="text-sm text-muted-foreground">Loading evidence…</p>;

  const technical = audit.evidence.technical;
  const semantic = audit.evidence.semantic;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/seo" className="text-xs text-muted-foreground hover:text-foreground">Back to queue</Link>
        <h2 className="mt-2 text-lg font-semibold">{audit.keyword}</h2>
        <p className="text-sm text-muted-foreground">{audit.url}</p>
        <p className="mt-3 max-w-3xl text-sm">{audit.action}</p>
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Priority", audit.priority],
          ["Top-10 probability", audit.probability.toFixed(2)],
          ["Opportunity", audit.opportunity_score.toFixed(2)],
          ["Confidence", audit.confidence.toFixed(2)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border px-3 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Search Console</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>{["Date", "Position", "Clicks", "Impressions", "CTR"].map((heading) => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {audit.evidence.search_console.map((point) => (
                <tr key={point.date} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{point.date}</td>
                  <td className="px-3 py-2 tabular-nums">{point.position.toFixed(1)}</td>
                  <td className="px-3 py-2 tabular-nums">{point.clicks}</td>
                  <td className="px-3 py-2 tabular-nums">{point.impressions}</td>
                  <td className="px-3 py-2 tabular-nums">{(point.ctr * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">Technical health</h3>
          <p className="mt-2 text-muted-foreground">Status {technical.status}. {technical.indexable ? "Indexable." : "Not indexable."} Canonical {technical.canonical}.</p>
          <p className="mt-1 text-muted-foreground">Robots: {technical.robots || "none"}. JSON-LD blocks: {technical.jsonld_count}.</p>
          <p className="mt-1 text-muted-foreground">Title: {technical.title}. H1: {technical.h1}.</p>
          <p className="mt-1 text-muted-foreground">Field LCP {technical.lcp_ms} ms, INP {technical.inp_ms} ms, CLS {technical.cls}.</p>
        </div>
        <div className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">Semantic relevance</h3>
          <p className="mt-2 text-muted-foreground">Title {semantic.title_relevance.toFixed(2)}, heading {semantic.heading_relevance.toFixed(2)}, LSA {semantic.semantic_similarity.toFixed(2)}, topic coverage {semantic.topic_coverage.toFixed(2)}.</p>
          <p className="mt-2 text-muted-foreground">Missing topics: {semantic.missing_topics.join(", ") || "none"}.</p>
        </div>
        <div className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">Competitor and authority</h3>
          <p className="mt-2 text-muted-foreground">{audit.evidence.competitor.url} at position {audit.evidence.competitor.position}. Referring domains {audit.evidence.competitor.ref_domains} versus our {audit.evidence.authority.referring_domains}. Gap {audit.evidence.competitor.authority_gap}.</p>
        </div>
        <div className="rounded-lg border border-border p-4 text-sm">
          <h3 className="font-semibold">Internal links</h3>
          <p className="mt-2 text-muted-foreground">Inbound links: {audit.evidence.internal_links.inbound}.</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {audit.evidence.internal_links.suggestions.map((item) => (
              <li key={item.from}>{item.from}. {item.reason}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="rounded-lg border border-border p-4 text-sm">
        <h3 className="font-semibold">Why the model scored this row</h3>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {audit.evidence.model.reasons.map((reason) => (
            <li key={reason.feature}>{reason.feature}: {reason.contribution > 0 ? "+" : ""}{reason.contribution.toFixed(3)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function PageAudit() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading evidence…</p>}>
      <Evidence />
    </Suspense>
  );
}
