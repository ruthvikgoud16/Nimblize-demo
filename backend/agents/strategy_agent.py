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

from backend.prompts import load_prompt_template

def _get_strategy_system_prompt() -> str:
    """Load system prompt from SEO-001 YAML file in Prompt Library."""
    try:
        data = load_prompt_template("SEO-001")
        return data.get("prompt_template", "")
    except Exception as e:
        print(f"[Agent 2] Warning: Failed to load SEO-001 prompt from library ({e}). Using fallback.")
        return """ROLE: You are a senior SEO Analyst. Generate a strategy report for the competitor."""



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
                {"role": "system", "content": _get_strategy_system_prompt()},
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
