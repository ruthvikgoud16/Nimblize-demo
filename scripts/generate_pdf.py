import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String as DString, Line, Polygon

# ─────────────────────────────────────────────────────────────────────────────
# Dynamic Page Numbering Canvas
# ─────────────────────────────────────────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        if self._pageNumber == 1:
            # Draw decorative cover background
            self.setFillColor(colors.HexColor("#0f172a")) # Slate 900
            self.rect(0, 0, 612, 792, fill=True, stroke=False)
            self.setFillColor(colors.HexColor("#3b82f6")) # Blue 500
            self.rect(0, 770, 612, 22, fill=True, stroke=False)
            self.restoreState()
            return

        # Running Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b")) # Slate 500
        self.drawString(54, 750, "NIMBLIZE — PHASE 4 PRODUCTION ARCHITECTURE")
        self.setStrokeColor(colors.HexColor("#e2e8f0")) # Slate 200
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)

        # Running Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 9)
        self.drawRightString(558, 40, page_text)
        self.drawString(54, 40, "CONFIDENTIAL — INTERNAL USE ONLY")
        self.line(54, 52, 558, 52)
        self.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
# Diagram Generators (ReportLab Drawing Objects)
# ─────────────────────────────────────────────────────────────────────────────
def create_system_architecture_diagram():
    # Width=504 (letter margin: 54 to 558), Height=180
    d = Drawing(504, 180)
    
    # Background
    d.add(Rect(0, 0, 504, 180, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    # Helper to draw node
    def draw_node(x, y, w, h, text, bg="#1e293b", text_color="#ffffff"):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), strokeWidth=1, rx=4, ry=4))
        # Center text
        d.add(DString(x + w/2, y + h/2 - 3, text, textAnchor="middle", fontSize=9, fontName="Helvetica-Bold", fillColor=colors.HexColor(text_color)))

    # Draw Nodes
    draw_node(20, 130, 80, 30, "User / Client", bg="#3b82f6")
    draw_node(130, 130, 100, 30, "FastAPI Gateway", bg="#1e293b")
    draw_node(260, 130, 110, 30, "Redis Cache / Rate", bg="#dc2626")
    draw_node(400, 130, 80, 30, "OTel / Prometheus", bg="#4f46e5")
    
    draw_node(130, 70, 100, 30, "LangGraph Engine", bg="#0f766e")
    draw_node(260, 70, 110, 30, "Agent 1 (Extract)", bg="#d97706")
    draw_node(260, 15, 110, 30, "Agent 2 (Strategy)", bg="#854d0e")
    
    draw_node(20, 70, 80, 30, "PostgreSQL", bg="#0369a1")
    draw_node(20, 15, 80, 30, "pgvector (HNSW)", bg="#0284c7")

    # Connectors (Lines & Arrows)
    def draw_arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.5))
        # Simple line-end arrowheads
        if x1 == x2: # Vertical down
            d.add(Polygon([x2-3, y2+4, x2+3, y2+4, x2, y2], fillColor=colors.HexColor("#475569"), strokeColor=colors.HexColor("#475569")))
        elif y1 == y2: # Horizontal right
            d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569"), strokeColor=colors.HexColor("#475569")))

    # Client -> Gateway
    draw_arrow(100, 145, 130, 145)
    # Gateway <-> Redis
    draw_arrow(230, 145, 260, 145)
    # Gateway -> OTel
    draw_arrow(370, 145, 400, 145)
    # Gateway -> LangGraph
    draw_arrow(180, 130, 180, 100)
    # LangGraph <-> Agent 1
    draw_arrow(230, 85, 260, 85)
    # LangGraph <-> Agent 2
    draw_arrow(230, 70, 260, 30)
    # LangGraph -> PG/pgvector
    draw_arrow(130, 85, 100, 85)
    # PG -> pgvector relation
    draw_arrow(60, 70, 60, 45)

    return d

def create_langgraph_flow_diagram():
    d = Drawing(504, 180)
    d.add(Rect(0, 0, 504, 180, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))

    def draw_node(x, y, w, h, text, bg="#1e293b", text_color="#ffffff"):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), strokeWidth=1, rx=4, ry=4))
        d.add(DString(x + w/2, y + h/2 - 3, text, textAnchor="middle", fontSize=9, fontName="Helvetica-Bold", fillColor=colors.HexColor(text_color)))

    # Flow Nodes
    draw_node(10, 80, 50, 30, "START", bg="#10b981")
    draw_node(75, 80, 65, 30, "PII Filter", bg="#475569")
    draw_node(155, 80, 70, 30, "Extraction", bg="#d97706")
    draw_node(240, 80, 70, 30, "Evaluate", bg="#854d0e")
    draw_node(325, 80, 75, 30, "Confidence Gate", bg="#3b82f6")
    
    draw_node(415, 115, 75, 30, "Approved", bg="#059669")
    draw_node(415, 45, 75, 30, "HITL Queue", bg="#b91c1c")
    draw_node(155, 10, 70, 30, "Dead Letter", bg="#7f1d1d")

    def draw_arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.5))
        if x1 == x2: # Down
            d.add(Polygon([x2-3, y2+4, x2+3, y2+4, x2, y2], fillColor=colors.HexColor("#475569"), strokeColor=colors.HexColor("#475569")))
        elif y1 == y2: # Right
            d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569"), strokeColor=colors.HexColor("#475569")))

    # Connections
    draw_arrow(60, 95, 75, 95)
    draw_arrow(140, 95, 155, 95)
    draw_arrow(225, 95, 240, 95)
    draw_arrow(310, 95, 325, 95)
    
    # Branches from Confidence Gate
    draw_arrow(400, 95, 415, 130) # To Approved
    draw_arrow(400, 95, 415, 60) # To HITL Queue
    
    # Retry Loop (Self-loop for Extraction validation)
    d.add(Line(190, 80, 190, 60, strokeColor=colors.HexColor("#d97706"), strokeWidth=1.2))
    d.add(Line(190, 60, 210, 60, strokeColor=colors.HexColor("#d97706"), strokeWidth=1.2))
    d.add(Line(210, 60, 210, 75, strokeColor=colors.HexColor("#d97706"), strokeWidth=1.2))
    d.add(Polygon([207, 75, 213, 75, 210, 80], fillColor=colors.HexColor("#d97706"), strokeColor=colors.HexColor("#d97706")))
    d.add(DString(200, 50, "Retry (max 3)", textAnchor="middle", fontSize=7, fontName="Helvetica", fillColor=colors.HexColor("#d97706")))

    # Extraction to Dead Letter
    draw_arrow(190, 80, 190, 40)

    return d


# ─────────────────────────────────────────────────────────────────────────────
# PDF Builder Script
# ─────────────────────────────────────────────────────────────────────────────
def build_pdf(filename="nimblize_phase4_architecture.pdf"):
    # Set up margins
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54, rightMargin=54,
        topMargin=72, bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Define custom clean styling
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#ffffff"),
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#94a3b8"),
        spaceAfter=50
    )

    h1_style = ParagraphStyle(
        "Header1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "Header2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "BodyClean",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        "BulletClean",
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#cbd5e1"),
        spaceAfter=6
    )

    story = []

    # ─────────────────────────────────────────────────────────────────────────
    # Page 1: Elegant Cover
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 150))
    story.append(Paragraph("NIMBLIZE", title_style))
    story.append(Paragraph("Phase 4 Production Implementation Architecture Blueprint", subtitle_style))
    story.append(Spacer(1, 120))
    
    meta_table = Table([
        [Paragraph("<b>Domain Leader:</b>", meta_style), Paragraph("Aastha Shukla", meta_style)],
        [Paragraph("<b>CTO & Co-Founder:</b>", meta_style), Paragraph("Anshul Sinha", meta_style)],
        [Paragraph("<b>Classification:</b>", meta_style), Paragraph("CONFIDENTIAL — PRODUCTION READY ENGINE", meta_style)],
        [Paragraph("<b>Date:</b>", meta_style), Paragraph("July 8, 2026", meta_style)],
        [Paragraph("<b>Version:</b>", meta_style), Paragraph("4.2.0 (Production Release)", meta_style)],
    ], colWidths=[150, 300])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 2: Executive Summary & Architecture Overview
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "Nimblize operates a state-of-the-art dual-purpose analytics engine to serve both B2B SEO intelligence and B2C product recommendation streams. This document defines the Phase 4 production-grade architecture deployed to guarantee sub-15ms semantic recommendation speeds, deterministic extraction pipelines, resilient asynchronous notifications, and multi-layered observability.",
        body_style
    ))
    story.append(Paragraph(
        "Through strict LLM-as-a-judge (RAGAS) evaluation gates and multi-channel alerting loops, the engine achieves absolute data consistency and system durability, preventing downstream data pollution and ensuring human-in-the-loop (HITL) protection for low-confidence events.",
        body_style
    ))

    story.append(Paragraph("2. System Architecture", h1_style))
    story.append(Paragraph(
        "The system employs a FastAPI gateway coordinating security, JWT auth, and token-bucket rate limiting via Redis. Successfully audited pipelines transition raw input into a structured payload using LangGraph orchestrators, persisting outputs to PostgreSQL (with pgvector HNSW indexing) or routing them to Redis queues for human review.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(create_system_architecture_diagram())
    story.append(Spacer(1, 10))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 3: Agent workflow & RAG
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("3. Multi-Agent Workflow", h1_style))
    story.append(Paragraph(
        "Nimblize coordinates specialized agents executing target logic within structured output scopes:",
        body_style
    ))
    story.append(Paragraph("• <b>Agent 1 (Extraction Specialist):</b> Operating on <i>gpt-4o-mini</i> at temperature 0.0. Utilizes the Structured Outputs API to enforce a strict Pydantic model (`IngestedCompetitorPayload`). Self-corrects schema violations dynamically by feeding validation tracebacks back to the prompt in a 3-attempt retry loop.", bullet_style))
    story.append(Paragraph("• <b>Agent 2 (Strategy Generator):</b> Operating on <i>gpt-4o</i> at temperature 0.4. Accepts the output from Agent 1 to perform B2B market gap analysis, prioritizing keyword targets and recommending dashboard structures.", bullet_style))

    story.append(Paragraph("4. RAG Pipeline & Vector DB Layer", h1_style))
    story.append(Paragraph(
        "The RAG (Retrieval-Augmented Generation) layer processes documents via parent-child chunking. Parent chunks represent broad context (1024 tokens), while child chunks are granular slices (256 tokens) embedded using <i>text-embedding-3-small</i>.",
        body_style
    ))
    story.append(Paragraph(
        "High-performance cosine similarity searches are executed in PostgreSQL using a pgvector HNSW index configured with parameters (m=16, ef_construction=64) to meet sub-15ms service-level objectives (SLOs) under concurrent load. Stale vectors are purged/rotated via nightly cron jobs.",
        body_style
    ))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 4: LangGraph & RAGAS
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("5. LangGraph State Machine", h1_style))
    story.append(Paragraph(
        "The orchestration core is defined by a LangGraph StateGraph utilizing a TypedDict state (`PipelineState`). The graph structures 7 distinct nodes and conditional routers to coordinate self-correction and dead-letter paths.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(create_langgraph_flow_diagram())
    story.append(Spacer(1, 15))

    story.append(Paragraph("6. Evaluation Layer (RAGAS)", h1_style))
    story.append(Paragraph(
        "The pipeline contains an LLM-as-a-judge RAGAS evaluator executing directly before storage:",
        body_style
    ))
    story.append(Paragraph("• <b>Faithfulness:</b> Gauges grounding of the strategy report in raw scraped text.", bullet_style))
    story.append(Paragraph("• <b>Answer Relevance:</b> Measures how well generated targets resolve the source queries.", bullet_style))
    story.append(Paragraph("• <b>Context Recall:</b> Measures completeness of extracted facts relative to source context.", bullet_style))
    story.append(Paragraph(
        "A composite score threshold of 0.85 regulates persistence. Runs scoring below 0.85 fail the confidence gate and trigger a human-in-the-loop (HITL) review queue.",
        body_style
    ))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 5: Security, Telemetry, Deployment & Future
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("7. Security Layer", h1_style))
    story.append(Paragraph(
        "Production security is implemented across three coordinates:",
        body_style
    ))
    story.append(Paragraph("• <b>PII Redaction:</b> Microsoft Presidio middleware anonymizes 10 PII entity types (emails, names, credit cards, phones, etc.) at startup/lifespan load before API dispatch.", bullet_style))
    story.append(Paragraph("• <b>Rate Limiting:</b> Redis Token Bucket rate limiter utilizing atomic Lua scripts limits users (30 req/min for Free; 300 req/min for Premium).", bullet_style))
    story.append(Paragraph("• <b>Authentication:</b> Cryptographically secure JWT tokens utilizing HS256 verify identity.", bullet_style))

    story.append(Paragraph("8. Monitoring & Telemetry", h1_style))
    story.append(Paragraph(
        "OTel tracer collects traces, and a Prometheus metrics exporter starts on port 9090. Key metrics include Time-To-First-Token (TTFT), pipeline round-trip time (RTT), cache hit/miss rates, and semantic drift. Custom Grafana dashboard panels alert operators if latency exceeds 2500ms.",
        body_style
    ))

    story.append(Paragraph("9. Cost Optimization", h1_style))
    story.append(Paragraph(
        "A semantic cache is integrated into Redis using OpenAI embeddings. If an incoming query is within a cosine distance of 0.15 relative to a cached query, the response is served instantly from Redis cache, reducing external model API costs by up to 60%.",
        body_style
    ))

    story.append(Paragraph("10. Deployment Architecture", h1_style))
    story.append(Paragraph(
        "Services run in containerized isolation via Docker Compose, backed by standard health checks and clean startup sequences to ensure database migrations and schema creations execute cleanly.",
        body_style
    ))

    story.append(Paragraph("11. Demo Flow", h1_style))
    story.append(Paragraph(
        "1. Scraped URL Ingestion → 2. Presidio PII Redaction → 3. Agent 1 Extraction (Self-Correction Retry) → 4. Agent 2 Strategy Generation → 5. RAGAS Quality Scoring → 6. Confidence Gate (Persist to PostgreSQL or flag to Redis HITL Queue).",
        body_style
    ))

    story.append(Paragraph("12. Future Roadmap", h1_style))
    story.append(Paragraph(
        "• Swapping Redis keyspace scanning with Redis Search vectors for O(1) semantic lookups at scale.<br/>• Automating index re-clustering on semantic drift metric threshold breaches.",
        body_style
    ))

    # Compile PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Created architecture PDF: {filename}")

if __name__ == "__main__":
    build_pdf()
