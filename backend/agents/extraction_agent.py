"""
Nimblize - Agent 1: Deterministic Extraction Specialist
- Model: gpt-4o-mini @ temperature=0.0
- Enforces IngestedCompetitorPayload schema via Structured Outputs API
- Self-correcting: feeds Pydantic error traces back into the model on retry
"""

import os
from typing import Dict, Any
from pydantic import ValidationError
from openai import OpenAI
from backend.schemas.competitor import IngestedCompetitorPayload

SYSTEM_PROMPT = """\
================================================================================
SYSTEM INSTRUCTIONS: NIMBLIZE CORE DATA EXTRACTION ENGINE v4.2.0 (B2B SEO)
================================================================================
ROLE: You are an advanced, deterministic Data Extraction Agent engineered for
Nimblize's B2B SEO Intelligence Suite. Your task is to process unstructured
competitor text and extract highly precise tactical data.

OPERATIONAL PARAMETERS:
1. Extract ONLY facts explicitly stated in the context. Do not extrapolate.
2. If a specific metric is missing, return "NOT_DETECTED" for that key.
3. Maintain extreme neutrality. Strip marketing adjectives and hyperbole.

JSON SCHEMA OUTPUT REQUIREMENT:
{
  "competitor_domain": "string or NOT_DETECTED",
  "targeted_seo_keywords": ["array", "of", "strings"],
  "estimated_monthly_organic_traffic": "integer or NOT_DETECTED",
  "monetization_infrastructure": ["array", "of", "strings"],
  "affiliate_networks_detected": ["array", "of", "strings"]
}

FEW-SHOT EXAMPLE:
INPUT: "RankVantage targets B2B platforms using 'SaaS attribution dashboard'.
Generating 120,000 monthly visits, monetized via software licensing and Impact Radius."

OUTPUT:
{
  "competitor_domain": "RankVantage",
  "targeted_seo_keywords": ["SaaS attribution dashboard", "B2B marketing platforms"],
  "estimated_monthly_organic_traffic": 120000,
  "monetization_infrastructure": ["software licensing"],
  "affiliate_networks_detected": ["Impact Radius"]
}
================================================================================
"""

MAX_RETRIES = 3


def run_extraction_agent(raw_content: str, client: OpenAI) -> Dict[str, Any]:
    """
    Calls Agent 1 (gpt-4o-mini) to extract a structured competitor payload
    from raw text. Uses Structured Outputs + Pydantic validation with
    a self-correcting retry loop (max 3 attempts).

    Args:
        raw_content: Scraped competitor page text (PII-redacted).
        client: Authenticated OpenAI client.

    Returns:
        Validated competitor payload as a dict.

    Raises:
        RuntimeError: If all 3 retries are exhausted without valid output.
    """
    prompt_input = raw_content
    last_error: str = ""

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Append error context on subsequent attempts
            user_message = prompt_input
            if last_error and attempt > 1:
                user_message = (
                    f"RAW TEXT:\n{raw_content}\n\n"
                    f"PREVIOUS FAILURE (attempt {attempt - 1}):\n{last_error}\n\n"
                    f"Correct the JSON structure to strictly match the required schema."
                )

            response = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                temperature=0.0,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                response_format=IngestedCompetitorPayload,
            )

            parsed: IngestedCompetitorPayload = response.choices[0].message.parsed
            print(
                f"[Agent 1] ✅ Extraction succeeded on attempt {attempt} "
                f"for domain: {parsed.competitor_domain}"
            )
            return parsed.model_dump()

        # M1 FIX: Catch specific exceptions instead of bare Exception.
        except (ValidationError, ValueError, KeyError) as error:
            last_error = str(error)
            print(f"[Agent 1] ⚠️  Attempt {attempt}/{MAX_RETRIES} failed: {last_error}")
        except Exception as error:
            # Unexpected errors (API timeouts, network) — still retry but log distinctly
            last_error = str(error)
            print(f"[Agent 1] ⚠️  Attempt {attempt}/{MAX_RETRIES} unexpected error: {last_error}")

    raise RuntimeError(
        f"[Agent 1] ❌ Extraction failed after {MAX_RETRIES} retries. "
        f"Routing to dead-letter queue."
    )
