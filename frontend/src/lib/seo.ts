export const SEO_API_URL = process.env.NEXT_PUBLIC_SEO_API_URL || "http://localhost:8000";

export type Opportunity = {
  id: string;
  keyword_id: string;
  keyword: string;
  page_id: string;
  url: string;
  position: number;
  impressions: number;
  ctr: number;
  probability: number;
  model_free_score: number;
  opportunity_score: number;
  confidence: number;
  priority: string;
  bottleneck: string;
  action: string;
  effort: number;
  status: string;
};

export type Audit = Opportunity & {
  evidence: {
    search_console: Array<{ date: string; position: number; clicks: number; impressions: number; ctr: number }>;
    technical: {
      status: number;
      indexable: boolean;
      canonical: string;
      robots: string;
      title: string;
      h1: string;
      jsonld_count: number;
      lcp_ms: number;
      inp_ms: number;
      cls: number;
    };
    semantic: {
      title_relevance: number;
      heading_relevance: number;
      semantic_similarity: number;
      topic_coverage: number;
      missing_topics: string[];
    };
    competitor: { url: string; position: number; ref_domains: number; authority_gap: number };
    internal_links: { inbound: number; suggestions: Array<{ from: string; reason: string }> };
    authority: { referring_domains: number };
    model: {
      probability: number;
      model_free_score: number;
      reasons: Array<{ feature: string; contribution: number }>;
    };
    rules: Array<{ priority: string; bottleneck: string; action: string; effort: number }>;
  };
};

export type Experiment = {
  id: string;
  keyword: string;
  url: string;
  change_date: string;
  change_type: string;
  old_version: string;
  new_version: string;
  reason: string;
  owner: string;
  expected_outcome: string;
  position_before: number;
  position_after: number;
  clicks_before: number;
  clicks_after: number;
  result_kind: string;
};

export async function seoGet<T>(path: string): Promise<T> {
  const token = process.env.NEXT_PUBLIC_SEO_API_TOKEN;
  const response = await fetch(`${SEO_API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${path}`);
  }
  return response.json();
}
