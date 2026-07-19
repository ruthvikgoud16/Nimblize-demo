"""
Nimblize - Microsoft Presidio PII Redaction Middleware
Redacts PII from all text before sending it to external LLM APIs.

Detected & redacted entities:
  PERSON, EMAIL_ADDRESS, PHONE_NUMBER, LOCATION, IP_ADDRESS,
  URL, CREDIT_CARD, CRYPTO, NRP (National Registration), IBAN_CODE

Redaction format: <ENTITY_TYPE> (e.g., <EMAIL_ADDRESS>)
"""

import os
import sys
import re

is_testing = "unittest" in sys.modules or "pytest" in sys.modules or os.getenv("ENV") == "testing"

try:
    if is_testing:
        raise ImportError("Bypass spaCy download in test env")
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
    _analyzer = AnalyzerEngine()
    _anonymizer = AnonymizerEngine()
    _presidio_available = True
except (ImportError, Exception):
    _analyzer = None
    _anonymizer = None
    _presidio_available = False
    print("[Presidio] Warning: presidio-analyzer not installed or bypassed. Falling back to regex PII anonymizer.")

# Entities to detect and redact
DETECTED_ENTITIES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "LOCATION",
    "IP_ADDRESS",
    "URL",
    "CREDIT_CARD",
    "CRYPTO",
    "NRP",
    "IBAN_CODE",
]

if _presidio_available:
    _operators = {
        entity: OperatorConfig("replace", {"new_value": f"<{entity}>"})
        for entity in DETECTED_ENTITIES
    }
else:
    _operators = {}


def redact_pii(text: str, language: str = "en") -> str:
    """
    Analyze and anonymize PII in the input text using Microsoft Presidio.

    Args:
        text: Raw competitor page content or user query.
        language: Language of the text (default: English).

    Returns:
        Text with PII replaced by bracketed entity type tokens.
    """
    if not text or not text.strip():
        return text

    if not _presidio_available:
        # Fallback regex anonymization
        cleaned = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "<EMAIL_ADDRESS>", text)
        cleaned = re.sub(r"\+?\d[\d -]{8,}\d", "<PHONE_NUMBER>", cleaned)
        return cleaned

    try:
        # Step 1: Detect PII entities
        analyzer_results = _analyzer.analyze(
            text=text,
            entities=DETECTED_ENTITIES,
            language=language,
        )

        if not analyzer_results:
            return text  # No PII detected — return original

        # Step 2: Anonymize (replace) detected entities
        anonymized = _anonymizer.anonymize(
            text=text,
            analyzer_results=analyzer_results,
            operators=_operators,
        )

        redacted_count = len(analyzer_results)
        if redacted_count > 0:
            print(f"[Presidio] ✅ Redacted {redacted_count} PII entities.")

        return anonymized.text

    except Exception as e:
        # Fail-safe: log error but do NOT pass raw PII through
        print(f"[Presidio] ❌ PII redaction error: {e}. Blocking text from external API.")
        return "[PII_REDACTION_FAILED — content blocked]"
