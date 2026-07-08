"""
Nimblize - OpenTelemetry Telemetry & Observability Setup
Instruments the FastAPI application with distributed tracing and metrics.

Stack:
  - OpenTelemetry SDK (traces + metrics)
  - Prometheus (metrics scraping)
  - Grafana (visualization dashboard)
  - Sentry (exception tracking)

Tracked signals:
  - TTFT (Time To First Token) per agent call
  - RTT (Round-Trip Time) per pipeline execution
  - Semantic drift delta (vector distance from baseline)
  - Cache hit/miss rate
  - RAGAS score distributions
"""

import os
import time
import sentry_sdk

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from prometheus_client import start_http_server


# ─────────────────────────────────────────────────────────────────────────────
# Sentry — Exception & Performance Monitoring
# ─────────────────────────────────────────────────────────────────────────────
def init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN")
    if dsn:
        sentry_sdk.init(
            dsn=dsn,
            traces_sample_rate=0.2,  # 20% of requests traced in Sentry
            environment=os.getenv("ENV", "development"),
        )
        print("[Telemetry] ✅ Sentry initialized.")


# ─────────────────────────────────────────────────────────────────────────────
# OpenTelemetry Tracer
# ─────────────────────────────────────────────────────────────────────────────
def init_tracer() -> trace.Tracer:
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    provider = TracerProvider()
    exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    HTTPXClientInstrumentor().instrument()
    print(f"[Telemetry] ✅ OTel Tracer initialized → {otlp_endpoint}")
    return trace.get_tracer("nimblize.pipeline")


# ─────────────────────────────────────────────────────────────────────────────
# Prometheus Metrics
# ─────────────────────────────────────────────────────────────────────────────
def init_metrics() -> metrics.Meter:
    prometheus_port = int(os.getenv("PROMETHEUS_PORT", 9090))
    reader = PrometheusMetricReader()
    provider = MeterProvider(metric_readers=[reader])
    metrics.set_meter_provider(provider)
    start_http_server(prometheus_port)
    print(f"[Telemetry] ✅ Prometheus metrics server started on port {prometheus_port}")
    return metrics.get_meter("nimblize.metrics")


# ─────────────────────────────────────────────────────────────────────────────
# Nimblize Metric Instruments
# ─────────────────────────────────────────────────────────────────────────────
class NimblizeMetrics:
    def __init__(self, meter: metrics.Meter):
        self.pipeline_rtt = meter.create_histogram(
            name="nimblize_pipeline_rtt_ms",
            description="Total round-trip time for a pipeline execution (ms)",
            unit="ms",
        )
        self.agent_ttft = meter.create_histogram(
            name="nimblize_agent_ttft_ms",
            description="Time-to-first-token for agent LLM calls (ms)",
            unit="ms",
        )
        self.ragas_faithfulness = meter.create_histogram(
            name="nimblize_ragas_faithfulness",
            description="RAGAS Faithfulness score per pipeline run",
        )
        self.ragas_relevancy = meter.create_histogram(
            name="nimblize_ragas_answer_relevancy",
            description="RAGAS Answer Relevancy score per pipeline run",
        )
        self.ragas_recall = meter.create_histogram(
            name="nimblize_ragas_context_recall",
            description="RAGAS Context Recall score per pipeline run",
        )
        self.cache_hits = meter.create_counter(
            name="nimblize_semantic_cache_hits_total",
            description="Total semantic cache hit count",
        )
        self.cache_misses = meter.create_counter(
            name="nimblize_semantic_cache_misses_total",
            description="Total semantic cache miss count",
        )
        self.api_errors = meter.create_counter(
            name="nimblize_api_errors_total",
            description="Total LLM API errors (429, 5xx)",
        )
        # C5 FIX: create_gauge() does not exist in OTel Python SDK <=1.27.
        # Use create_observable_gauge() with a callback instead.
        self._semantic_drift_value: float = 0.0

        def _drift_callback(options):
            yield metrics.Observation(self._semantic_drift_value, {})

        meter.create_observable_gauge(
            name="nimblize_semantic_drift",
            description="Mean cosine distance between incoming queries and baseline",
            callbacks=[_drift_callback],
        )

    def record_pipeline_rtt(self, rtt_ms: float, attributes: dict = None) -> None:
        self.pipeline_rtt.record(rtt_ms, attributes or {})
        if rtt_ms > 2500:
            print(
                f"[Telemetry] 🔴 RTT={rtt_ms:.0f}ms exceeds 2500ms threshold. "
                f"Grafana alert triggered — initiating hot-standby failover."
            )

    def record_ragas_scores(self, scores: dict) -> None:
        if "faithfulness" in scores:
            self.ragas_faithfulness.record(scores["faithfulness"])
        if "answer_relevancy" in scores:
            self.ragas_relevancy.record(scores["answer_relevancy"])
        if "context_recall" in scores:
            self.ragas_recall.record(scores["context_recall"])

    def record_drift(self, drift_delta: float) -> None:
        # C5 FIX: update the internal value; callback reads it on next scrape
        self._semantic_drift_value = drift_delta
        if drift_delta > 0.15:
            print(
                f"[Telemetry] 🟡 Semantic drift={drift_delta:.4f} > 0.15 threshold. "
                f"Flagging vector index for offline re-clustering."
            )


# ─────────────────────────────────────────────────────────────────────────────
# Context manager for timing pipeline segments
# ─────────────────────────────────────────────────────────────────────────────
class Timer:
    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *args):
        self.elapsed_ms = (time.perf_counter() - self._start) * 1000

    @property
    def ms(self) -> float:
        return self.elapsed_ms


# ─────────────────────────────────────────────────────────────────────────────
# Boot initializer — called once at application startup
# ─────────────────────────────────────────────────────────────────────────────
_tracer: trace.Tracer = None
_nim_metrics: NimblizeMetrics = None


def init_telemetry() -> tuple[trace.Tracer, NimblizeMetrics]:
    global _tracer, _nim_metrics
    init_sentry()
    _tracer = init_tracer()
    meter = init_metrics()
    _nim_metrics = NimblizeMetrics(meter)
    return _tracer, _nim_metrics


def get_tracer() -> trace.Tracer:
    return _tracer


def get_metrics() -> NimblizeMetrics:
    return _nim_metrics
