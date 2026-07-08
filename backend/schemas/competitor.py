"""
Nimblize - Pydantic Data Contracts
Enforces strict schema validation for all competitor payloads extracted by Agent 1.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Union, Optional, Dict, Any
from enum import Enum
import uuid


class PayloadStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED_PRODUCTION = "VERIFIED_PRODUCTION"
    FLAGGED_FOR_HUMAN_REVIEW = "FLAGGED_FOR_HUMAN_REVIEW"
    DEAD_LETTER = "DEAD_LETTER"


class IngestedCompetitorPayload(BaseModel):
    """
    Agent 1 output schema. Any deviation from this structure triggers
    the LangGraph self-correction loop (max 3 retries before dead-letter routing).
    """
    competitor_domain: str = Field(..., description="Target domain name identified.")
    targeted_seo_keywords: List[str] = Field(
        ..., description="Extracted commercial intent terms."
    )
    estimated_monthly_organic_traffic: Union[int, str] = Field(
        ..., description="Monthly traffic integer or 'NOT_DETECTED'."
    )
    monetization_infrastructure: List[str] = Field(
        ..., description="Revenue engines isolated."
    )
    affiliate_networks_detected: List[str] = Field(
        ..., description="Identified affiliate networks."
    )

    @field_validator("estimated_monthly_organic_traffic")
    @classmethod
    def validate_traffic(cls, v):
        if isinstance(v, str) and v != "NOT_DETECTED":
            raise ValueError("Traffic must be an integer or the literal 'NOT_DETECTED'")
        return v


class StrategyReport(BaseModel):
    """
    Agent 2 output schema for qualitative strategic insights.
    """
    competitor_domain: str
    market_gap_analysis: str = Field(..., description="Identified strategic market gaps.")
    recommended_seo_targets: List[str] = Field(..., description="Prioritized keyword targets.")
    affiliate_opportunity_score: float = Field(..., ge=0.0, le=1.0)
    dashboard_recommendations: List[str] = Field(..., description="Actionable items for dashboard.")
    generated_at: Optional[str] = None


class PipelinePayload(BaseModel):
    """
    Full pipeline state object passed through the LangGraph graph.
    """
    pipeline_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    raw_text: str
    cleaned_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    strategy_report: Optional[Dict[str, Any]] = None
    validation_errors: List[str] = Field(default_factory=list)
    extraction_attempts: int = 0
    ragas_scores: Dict[str, float] = Field(default_factory=dict)
    status: PayloadStatus = PayloadStatus.PENDING
    assigned_evaluator: Optional[str] = None


class RateLimitConfig(BaseModel):
    """Token bucket configuration per user tier."""
    tier: str
    capacity: int
    refill_rate_per_minute: int


class NotificationJob(BaseModel):
    """Job payload pushed to Redis notification queue."""
    event_type: str = "PIPELINE_VALIDATION_FAILURE"
    pipeline_id: str
    score: float
    payload: Dict[str, Any]
    channels: List[str] = Field(
        default_factory=lambda: ["slack", "email", "pagerduty", "dashboard"]
    )
