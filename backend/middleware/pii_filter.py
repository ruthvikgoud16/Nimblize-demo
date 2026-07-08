"""
Nimblize - Microsoft Presidio PII Redaction Middleware
Redacts PII from all text before sending it to external LLM APIs.

Detected & redacted entities:
  PERSON, EMAIL_ADDRESS, PHONE_NUMBER, LOCATION, IP_ADDRESS,
  URL, CREDIT_CARD, CRYPTO, NRP (National Registration), IBAN_CODE

Redaction format: <ENTITY_TYPE> (e.g., <EMAIL_ADDRESS>)
"""

from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig


# Initialize engines once at module load (expensive to re-initialize per request)
_analyzer = AnalyzerEngine()
_anonymizer = AnonymizerEngine()

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

# Replace detected entities with a bracketed placeholder
_operators = {
    entity: OperatorConfig("replace", {"new_value": f"<{entity}>"})
    for entity in DETECTED_ENTITIES
}


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
