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

from backend.prompts import load_prompt_template

def _get_extraction_system_prompt() -> str:
    """
    Loads system prompt dynamically from CA-001 YAML file in Prompt Library via PromptRegistry.
    If the YAML file is unreadable/missing, returns an intentional offline fallback prompt string.
    """
    try:
        data = load_prompt_template("CA-001")
        return data.get("prompt_template", "")
    except Exception as e:
        print(f"[Agent 1] Warning: Failed to load CA-001 prompt from library ({e}). Using offline fallback prompt.")
        # INTENTIONAL OFFLINE FALLBACK PROMPT (Used only if YAML loading fails)
        return """ROLE: You are an advanced Data Extraction Agent. Extract competitor domain, SEO keywords, traffic, monetization, and affiliate networks as JSON."""


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
                    {"role": "system", "content": _get_extraction_system_prompt()},
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
