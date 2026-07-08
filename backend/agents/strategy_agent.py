"""
Nimblize - Agent 2: Qualitative Strategy Analyst
- Model: gpt-4o @ temperature=0.4
- Reads validated IngestedCompetitorPayload from Agent 1
- Produces a StrategyReport with SEO recommendations and market gap analysis
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import ValidationError
from openai import OpenAI
from backend.schemas.competitor import StrategyReport

SYSTEM_PROMPT = """\
================================================================================
SYSTEM INSTRUCTIONS: NIMBLIZE STRATEGY ANALYSIS ENGINE v4.2.0
================================================================================
ROLE: You are a senior SEO & Affiliate Commerce Strategy Analyst for Nimblize.
You receive structured competitor intelligence and produce actionable B2B/B2C
dashboard recommendations.

OPERATIONAL PARAMETERS:
1. Ground every recommendation in the competitor data provided.
2. Identify market gaps — areas the competitor underserves.
3. Rank SEO keyword targets by commercial intent potential.
4. Score affiliate opportunity between 0.0 (low) and 1.0 (high).
5. Return 3-5 concrete, dashboard-ready action items.

OUTPUT FORMAT: Valid JSON matching the StrategyReport schema.
{
  "competitor_domain": "string",
  "market_gap_analysis": "string",
  "recommended_seo_targets": ["array of strings"],
  "affiliate_opportunity_score": 0.0-1.0,
  "dashboard_recommendations": ["array of actionable strings"],
  "generated_at": "ISO 8601 timestamp"
}
================================================================================
"""


def run_strategy_agent(
    competitor_payload: Dict[str, Any], client: OpenAI
) -> Dict[str, Any]:
    """
    Calls Agent 2 (gpt-4o) to produce a StrategyReport from the validated
    competitor payload extracted by Agent 1.

    Args:
        competitor_payload: Validated IngestedCompetitorPayload as dict.
        client: Authenticated OpenAI client.

    Returns:
        StrategyReport as a dict.

    Raises:
        RuntimeError: If strategy generation fails.
    """
    competitor_json = json.dumps(competitor_payload, indent=2)

    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o",
            temperature=0.4,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Generate a strategy report for:\n{competitor_json}",
                },
            ],
            response_format=StrategyReport,
        )

        report: StrategyReport = response.choices[0].message.parsed
        report.generated_at = datetime.now(timezone.utc).isoformat()

        print(
            f"[Agent 2] ✅ Strategy report generated for: {report.competitor_domain} "
            f"| Affiliate Opportunity Score: {report.affiliate_opportunity_score:.2f}"
        )
        return report.model_dump()

    # M2 FIX: Catch specific exceptions instead of bare Exception.
    except (ValidationError, ValueError, KeyError) as error:
        raise RuntimeError(f"[Agent 2] ❌ Strategy validation failed: {str(error)}")
    except Exception as error:
        raise RuntimeError(f"[Agent 2] ❌ Strategy generation failed (API/network): {str(error)}")
