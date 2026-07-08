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
        self.drawString(54, 750, "NIMBLIZE — PHASE 4 INGESTION & RECOMMENDATION CORE REPORT")
        self.setStrokeColor(colors.HexColor("#e2e8f0")) # Slate 200
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)

        # Running Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 9)
        self.drawRightString(558, 40, page_text)
        self.drawString(54, 40, "CONFIDENTIAL — FOR INTERNSHIP EVALUATION")
        self.line(54, 52, 558, 52)
        self.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
# Vector Diagrams (ReportLab Drawing Objects)
# ─────────────────────────────────────────────────────────────────────────────

def create_diagram_1():
    # Diagram 1: High-Level Architecture (FastAPI -> LangGraph -> Agents -> Evaluation -> Database)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(10, 40, 70, 30, "FastAPI Gateway", "#1e293b")
    draw_box(100, 40, 85, 30, "LangGraph Orchestrator", "#0f766e")
    draw_box(205, 65, 80, 25, "Agent 1 (Extract)", "#d97706")
    draw_box(205, 20, 80, 25, "Agent 2 (Strategy)", "#854d0e")
    draw_box(305, 40, 80, 30, "RAGAS Evaluation", "#4f46e5")
    draw_box(410, 40, 85, 30, "PostgreSQL Database", "#0369a1")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        if x1 == x2:
            d.add(Polygon([x2-3, y2+4, x2+3, y2+4, x2, y2], fillColor=colors.HexColor("#475569")))
        else:
            d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(80, 55, 100, 55)
    arrow(185, 55, 205, 75)
    arrow(185, 55, 205, 32)
    arrow(285, 75, 305, 55)
    arrow(285, 32, 305, 55)
    arrow(385, 55, 410, 55)
    return d

def create_diagram_2():
    # Diagram 2: Multi-Agent Architecture (Agent 1 -> Validation -> Agent 2)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(20, 40, 110, 30, "Agent 1: Extraction Specialist", "#d97706")
    draw_box(170, 40, 150, 30, "Pydantic Schema Validation Gate", "#1e293b")
    draw_box(360, 40, 120, 30, "Agent 2: Strategy Generator", "#854d0e")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(130, 55, 170, 55)
    arrow(320, 55, 360, 55)

    # Retry loop arrow
    d.add(Line(245, 40, 245, 20, strokeColor=colors.HexColor("#dc2626"), strokeWidth=1))
    d.add(Line(245, 20, 75, 20, strokeColor=colors.HexColor("#dc2626"), strokeWidth=1))
    d.add(Line(75, 20, 75, 40, strokeColor=colors.HexColor("#dc2626"), strokeWidth=1))
    d.add(Polygon([72, 35, 78, 35, 75, 40], fillColor=colors.HexColor("#dc2626")))
    d.add(DString(160, 25, "Validation Error: Self-Correction Loop", fontSize=7, fontName="Helvetica", fillColor=colors.HexColor("#dc2626")))
    return d

def create_diagram_3():
    # Diagram 3: RAG Pipeline (Documents -> Chunking -> Embeddings -> pgvector -> Retrieval)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(10, 40, 70, 30, "Raw Documents", "#475569")
    draw_box(100, 40, 85, 30, "Parent/Child Chunk", "#0f766e")
    draw_box(205, 40, 85, 30, "OpenAI Embeddings", "#2563eb")
    draw_box(310, 40, 80, 30, "pgvector Index", "#0369a1")
    draw_box(410, 40, 85, 30, "RAG Context Retrieve", "#059669")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(80, 55, 100, 55)
    arrow(185, 55, 205, 55)
    arrow(290, 55, 310, 55)
    arrow(390, 55, 410, 55)
    return d

def create_diagram_4():
    # Diagram 4: LangGraph Workflow (PII -> Extraction -> Strategy -> Evaluation -> Approval/HITL)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(10, 40, 70, 30, "PII Filter Node", "#334155")
    draw_box(95, 40, 80, 30, "Extraction (Agent 1)", "#d97706")
    draw_box(190, 40, 80, 30, "Strategy (Agent 2)", "#854d0e")
    draw_box(285, 40, 70, 30, "RAGAS Eval Node", "#4f46e5")
    draw_box(370, 65, 120, 25, "Persist Production (Pass)", "#059669")
    draw_box(370, 20, 120, 25, "HITL Queue (Fail)", "#b91c1c")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(80, 55, 95, 55)
    arrow(175, 55, 190, 55)
    arrow(270, 55, 285, 55)
    arrow(355, 55, 370, 75)
    arrow(355, 55, 370, 32)
    return d

def create_diagram_5():
    # Diagram 5: HITL Workflow (Low Confidence -> Redis Queue -> Human Review)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(10, 40, 90, 30, "Low Confidence (<0.85)", "#b91c1c")
    draw_box(120, 40, 110, 30, "Redis Notification Queue", "#dc2626")
    draw_box(250, 40, 110, 30, "Asynchronous Worker", "#7c3aed")
    draw_box(380, 65, 110, 25, "Slack & Email Alert", "#2563eb")
    draw_box(380, 20, 110, 25, "HITL Postgres Queue", "#059669")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(100, 55, 120, 55)
    arrow(230, 55, 250, 55)
    arrow(360, 55, 380, 75)
    arrow(360, 55, 380, 32)
    return d

def create_diagram_6():
    # Diagram 6: Telemetry Architecture (OpenTelemetry -> Prometheus -> Grafana)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(20, 40, 120, 30, "OpenTelemetry SDK Traces", "#475569")
    draw_box(180, 40, 130, 30, "Prometheus Metrics Exporter", "#ea580c")
    draw_box(350, 40, 130, 30, "Grafana Analytics Dashboard", "#eab308")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(140, 55, 180, 55)
    arrow(310, 55, 350, 55)
    return d

def create_diagram_7():
    # Diagram 7: Cost Optimization Flow (Request -> Cache -> Model Routing)
    d = Drawing(504, 110)
    d.add(Rect(0, 0, 504, 110, fillColor=colors.HexColor("#f8fafc"), strokeColor=colors.HexColor("#cbd5e1"), strokeWidth=1, rx=8, ry=8))
    
    def draw_box(x, y, w, h, text, bg):
        d.add(Rect(x, y, w, h, fillColor=colors.HexColor(bg), strokeColor=colors.HexColor("#64748b"), rx=3, ry=3))
        d.add(DString(x+w/2, y+h/2-3, text, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.white))

    draw_box(10, 40, 80, 30, "Inbound Request", "#475569")
    draw_box(110, 40, 100, 30, "Redis Semantic Cache", "#16a34a")
    draw_box(240, 65, 120, 25, "Cache Hit ➔ Instant Ret", "#15803d")
    draw_box(240, 20, 120, 25, "Cache Miss ➔ Model Route", "#dc2626")
    draw_box(380, 20, 110, 25, "gpt-4o-mini & gpt-4o", "#0f766e")

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#475569"), strokeWidth=1.2))
        d.add(Polygon([x2-4, y2+3, x2-4, y2-3, x2, y2], fillColor=colors.HexColor("#475569")))

    arrow(90, 55, 110, 55)
    arrow(210, 55, 240, 75)
    arrow(210, 55, 240, 32)
    arrow(360, 32, 380, 32)
    return d


# ─────────────────────────────────────────────────────────────────────────────
# PDF Builder Script
# ─────────────────────────────────────────────────────────────────────────────
def build_pdf(filename="Nimblize_Phase4_Final_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54, rightMargin=54,
        topMargin=72, bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#ffffff"),
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#94a3b8"),
        spaceAfter=50
    )

    h1_style = ParagraphStyle(
        "Header1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "Header2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "BodyClean",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
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
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#cbd5e1"),
        spaceAfter=6
    )

    caption_style = ParagraphStyle(
        "CaptionText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11,
        alignment=1, # Center
        textColor=colors.HexColor("#64748b"),
        spaceBefore=6,
        spaceAfter=12
    )

    story = []

    # ─────────────────────────────────────────────────────────────────────────
    # Page 1: Cover Page
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 150))
    story.append(Paragraph("NIMBLIZE", title_style))
    story.append(Paragraph("Phase 4 Final Ingestion & Recommendation Core Report", subtitle_style))
    story.append(Spacer(1, 120))
    
    meta_table = Table([
        [Paragraph("<b>Domain Leader:</b>", meta_style), Paragraph("Aastha Shukla", meta_style)],
        [Paragraph("<b>CTO & Co-Founder:</b>", meta_style), Paragraph("Anshul Sinha", meta_style)],
        [Paragraph("<b>Intern Name:</b>", meta_style), Paragraph("Ruthvik Goud", meta_style)],
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
    # Page 2: Table of Contents & List of Figures
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("Table of Contents", h1_style))
    toc_data = [
        [Paragraph("<b>Section</b>", body_style), Paragraph("<b>Page</b>", body_style)],
        [Paragraph("1. Introduction", body_style), Paragraph("3", body_style)],
        [Paragraph("2. System Overview", body_style), Paragraph("3", body_style)],
        [Paragraph("3. Architecture Design", body_style), Paragraph("4", body_style)],
        [Paragraph("4. Agent Design", body_style), Paragraph("5", body_style)],
        [Paragraph("5. RAG Pipeline & Vector DB Layer", body_style), Paragraph("6", body_style)],
        [Paragraph("6. LangGraph State Machine Workflow", body_style), Paragraph("7", body_style)],
        [Paragraph("7. Evaluation Layer (RAGAS)", body_style), Paragraph("8", body_style)],
        [Paragraph("8. Human-in-the-Loop Workflow", body_style), Paragraph("9", body_style)],
        [Paragraph("9. Security & Monitoring Architecture", body_style), Paragraph("10", body_style)],
        [Paragraph("10. Cost Optimization Flow", body_style), Paragraph("11", body_style)],
        [Paragraph("11. Implementation & Code Mapping", body_style), Paragraph("12", body_style)],
        [Paragraph("12. Validation & Test Paths Execution Logs", body_style), Paragraph("13", body_style)],
        [Paragraph("13. Challenges, Learnings & Conclusion", body_style), Paragraph("14", body_style)],
    ]
    t_toc = Table(toc_data, colWidths=[400, 100])
    t_toc.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_toc)
    story.append(Spacer(1, 20))

    story.append(Paragraph("List of Figures", h1_style))
    lof_data = [
        [Paragraph("<b>Figure</b>", body_style), Paragraph("<b>Page</b>", body_style)],
        [Paragraph("Figure 1: High-Level System Architecture Diagram", body_style), Paragraph("4", body_style)],
        [Paragraph("Figure 2: Multi-Agent Interaction Diagram", body_style), Paragraph("5", body_style)],
        [Paragraph("Figure 3: Parent-Child Chunking and pgvector Flowchart", body_style), Paragraph("6", body_style)],
        [Paragraph("Figure 4: LangGraph State Machine Transitions", body_style), Paragraph("7", body_style)],
        [Paragraph("Figure 5: Redis Asynchronous HITL Flowchart", body_style), Paragraph("9", body_style)],
        [Paragraph("Figure 6: Telemetry Stack Data Pipeline Layout", body_style), Paragraph("10", body_style)],
        [Paragraph("Figure 7: Cost Optimization & Cache Routing Flow", body_style), Paragraph("11", body_style)],
    ]
    t_lof = Table(lof_data, colWidths=[400, 100])
    t_lof.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_lof)
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 3: Section 1 & 2
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("1. Introduction", h1_style))
    story.append(Paragraph(
        "<b>What:</b> In the domain of competitor intelligence and analytics, B2B data collection has traditionally been a fragile and error-prone process. Nimblize processes unstructured competitive details from competitor websites to drive automated strategic marketing and recommendation decisions. <br/>"
        "<b>Why:</b> Structural variation across competitor websites frequently breaks traditional scraping loops. Static selectors fail, causing data loss or data corruption in downstream analytics. Furthermore, consumer product recommendation portals demand fast response speeds. Making raw LLM queries directly in B2C loops violates basic performance SLA boundaries, creating latency bottlenecks (>2s) and high token costs.<br/>"
        "<b>How:</b> Nimblize solves this paradox by implementing a dual-vector ingestion and recommendation core. B2B ingestion is automated using stateful self-correcting agentic parsing loops backed by inline RAGAS evaluation quality gates. B2C recommendations are served in sub-15ms using parent-child chunking, pgvector HNSW similarity search, and a semantic cache.",
        body_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. System Overview", h1_style))
    story.append(Paragraph(
        "<b>What:</b> Nimblize is a high-performance competitor ingestion and recommendation core tailored for SaaS growth analytics.<br/>"
        "<b>Why:</b> We operate in two commercial target markets: B2B SEO Strategist dashboards and B2C Consumer Product Recommendation sites. The system must process complex competitor files while serving client searches efficiently.<br/>"
        "<b>How:</b> We segment the backend into two distinct workflows:<br/>"
        "• <b>B2B Competitor Ingestion:</b> Triggered every 72 hours via cron scraper loops. Raw crawler text is redacted of PII, structured, strategized, and RAGAS-evaluated before saving.<br/>"
        "• <b>B2C Product Recommendation:</b> Served instantly from the database. Scanned query embeddings are mapped against our pgvector database to retrieve matching competitor affiliate networks and monetization paths under 15ms.",
        body_style
    ))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 4: Section 3 (Architecture Design)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("3. Architecture Design", h1_style))
    story.append(Paragraph(
        "<b>What:</b> The Nimblize production stack decouples gateway security, stateful graph orchestrations, and database storage layers.<br/>"
        "<b>Why:</b> Decoupling services keeps the codebase modular and prevents failures in the slow, high-token agent ingestion path from affecting the fast, critical B2C recommendation path.<br/>"
        "<b>How:</b> The client communicates with a FastAPI gateway protected by JWT authentication and Redis rate limiters. Ingestion workflows are dispatched to the LangGraph Orchestrator. The orchestrator runs a PII filter, triggers Agent 1 and Agent 2, evaluates the results, and persists them to PostgreSQL or routes them to Redis queues for human review.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_1())
    story.append(Paragraph("Figure 1: High-Level System Architecture Diagram", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 5: Section 4 (Agent Design)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("4. Multi-Agent Architecture Design", h1_style))
    story.append(Paragraph(
        "<b>What:</b> The system separates data extraction and strategic synthesis into two specialized agents running on a stateful graph.<br/>"
        "<b>Why:</b> This separation is a cost-to-performance optimization. Agent 1 parses long raw crawling inputs, which would be cost-prohibitive on gpt-4o. Separating concerns allows `gpt-4o-mini` to handle the high-token extraction step cheaply, passing a clean summary to `gpt-4o` for high-quality strategy generation.<br/>"
        "<b>How:</b><br/>"
        "• <b>Agent 1 (Extraction Specialist):</b> Runs on `gpt-4o-mini` at `temperature = 0.0`. Enforces a strict Pydantic model (`IngestedCompetitorPayload`). If validation fails, error messages are appended to the prompt during retries. It loops up to 3 times before routing to the dead-letter queue.<br/>"
        "• <b>Agent 2 (Strategy Generator):</b> Runs on `gpt-4o` at `temperature = 0.4`. Takes the extracted facts to perform qualitative SEO gap analysis and recommended targets.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_2())
    story.append(Paragraph("Figure 2: Multi-Agent Interaction Diagram", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 6: Section 5 (RAG Pipeline & Vector DB Layer)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("5. Retrieval-Augmented Generation (RAG) Pipeline", h1_style))
    story.append(Paragraph(
        "<b>What:</b> The RAG pipeline processes competitor documents to support B2C product searches and semantic cache lookups.<br/>"
        "<b>Why:</b> Large chunks contain rich context but dilute specific facts, leading to low retrieval similarity scores. Small chunks have high vector similarity but lack surrounding context, causing the LLM to generate incomplete answers.<br/>"
        "<b>How:</b> We implement a parent-child chunking relationship. Large parent chunks (1024 tokens) are saved in `competitor_parents`. Granular child chunks (256 tokens) are embedded using `text-embedding-3-small` (1536-dim) and indexed in PostgreSQL using a pgvector HNSW index. Queries are matched against child chunks using cosine similarity, but the parent chunk is retrieved to provide context for generation, maintaining factual integrity.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_3())
    story.append(Paragraph("Figure 3: Parent-Child Chunking and pgvector Flowchart", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 7: Section 6 (State-Gated LangGraph Workflow)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("6. State-Gated LangGraph Workflow", h1_style))
    story.append(Paragraph(
        "<b>What:</b> The pipeline lifecycle is managed as a state machine using LangGraph.<br/>"
        "<b>Why:</b> Stateful orchestration allows us to define retry loops, error boundary redirects, and quality gates directly within the execution graph.<br/>"
        "<b>How:</b> The pipeline state is defined using a TypedDict state (`PipelineState`). The graph starts at the PII filter, then runs extraction. If extraction succeeds, it proceeds to strategy and evaluation. If extraction fails, the conditional router either triggers a retry or sends the payload to the dead-letter queue. After evaluation, the confidence gate determines whether to write to PostgreSQL or route the payload to the HITL queue.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_4())
    story.append(Paragraph("Figure 4: LangGraph State Machine Transitions", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 8: Section 7 (RAGAS Evaluation Layer)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("7. Evaluation Layer (RAGAS)", h1_style))
    story.append(Paragraph(
        "<b>What:</b> To prevent hallucinations, Nimblize executes an inline RAGAS evaluation as a circuit breaker before data is written to the database.<br/>"
        "<b>Why:</b> Hallucinated or low-quality data pollutes the database, leading to inaccurate recommendations. Running real-time evaluations prevents bad data from reaching the production database.<br/>"
        "<b>How:</b> We evaluate outputs using `gpt-4o-mini` wrapped in `LangchainLLMWrapper` across three metrics: Faithfulness (verifying recommendations are grounded in raw text), Answer Relevance (checking targets align with the competitor), and Context Recall (measuring completeness). We require a composite score of 0.85. If a report falls below this threshold, persistence is blocked and the run is routed to the HITL review queue.",
        body_style
    ))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>RAGAS Evaluation Thresholds Configuration:</b>", h2_style))
    
    thresh_data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Threshold</b>", body_style), Paragraph("<b>Fallback Action</b>", body_style)],
        [Paragraph("Faithfulness", body_style), Paragraph("≥ 0.85", body_style), Paragraph("Abort deployment — route payload to human review", body_style)],
        [Paragraph("Answer Relevance", body_style), Paragraph("≥ 0.80", body_style), Paragraph("Reduce LLM temperature, restrict system prompt", body_style)],
        [Paragraph("Context Recall", body_style), Paragraph("≥ 0.75", body_style), Paragraph("Expand retrieval scope — increase k in vector search", body_style)],
        [Paragraph("Composite Gate", body_style), Paragraph("≥ 0.85", body_style), Paragraph("Persist to production on pass, else route to Redis queue", body_style)],
    ]
    t_thresh = Table(thresh_data, colWidths=[120, 80, 304])
    t_thresh.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_thresh)
    story.append(Paragraph("Table 1: RAGAS Quality Gate Metrics & Fallback Actions", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 9: Section 8 (Human-in-the-Loop Workflow)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("8. Human-in-the-Loop (HITL) Workflow", h1_style))
    story.append(Paragraph(
        "<b>What:</b> Low-confidence competitor payloads are routed to a manual review queue for human validation.<br/>"
        "<b>Why:</b> Vague competitor pages cause low extraction confidence. Instead of saving garbage data or dropping the run, routing to a review queue allows humans to audit edge cases without blocking pipeline execution.<br/>"
        "<b>How:</b> Low-confidence payloads are pushed to a Redis queue. A background worker drains the queue and dispatches alerts to Slack and email. It also logs the payload to the manual_review_queue database table, allowing domain leaders to verify and approve the data.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_5())
    story.append(Paragraph("Figure 5: Redis Asynchronous HITL Flowchart", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 10: Section 9 (Security & Monitoring Architecture)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("9. Security & Monitoring Architecture", h1_style))
    story.append(Paragraph(
        "<b>What:</b> The system implements middleware security and OpenTelemetry metrics monitoring.<br/>"
        "<b>Why:</b> Security layers prevent data leaks and protect endpoints. Monitoring stack logs execution signals and alerts developers to latency spikes.<br/>"
        "<b>How:</b> Microsoft Presidio filter anonymizes PII at lifespan load. Redis rate-limits traffic using Lua scripts. OpenTelemetry tracks execution spans, Prometheus exposes performance metrics on port 9090, and Grafana visualizes the signals, alerting operators if pipeline latency exceeds 2.5 seconds.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_6())
    story.append(Paragraph("Figure 6: Telemetry Stack Data Pipeline Layout", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 11: Section 10 (Cost Optimization Flow)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("10. Cost Ingestion & Recommendation Flow", h1_style))
    story.append(Paragraph(
        "<b>What:</b> Nimblize implements semantic caching and model routing to reduce API token costs.<br/>"
        "<b>Why:</b> Direct LLM calls for every recommendation query are too slow and expensive. Caching similar requests reduces model usage.<br/>"
        "<b>How:</b> The gateway embeds incoming queries and compares them against cached queries in Redis. If the similarity distance is under 0.15, the cached response is served immediately. This bypasses the database search and LLM calls, saving up to 60% in token costs. If the cache misses, the query is routed to the vector database, and the result is cached.",
        body_style
    ))
    story.append(Spacer(1, 15))
    story.append(create_diagram_7())
    story.append(Paragraph("Figure 7: Cost Optimization & Cache Routing Flow", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 12: Section 11 (Implementation Code Mapping)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("11. Codebase Traceability & Implementation Mapping", h1_style))
    story.append(Paragraph(
        "This section maps the system components to their corresponding source code files in the codebase.",
        body_style
    ))
    story.append(Spacer(1, 10))

    map_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Source File Location</b>", body_style), Paragraph("<b>Purpose</b>", body_style)],
        [Paragraph("API Gateway", body_style), Paragraph("backend/main.py", body_style), Paragraph("Exposes API routes; coordinates rate limits, caches, and graph runs.", body_style)],
        [Paragraph("Orchestrator", body_style), Paragraph("backend/agents/langgraph_orchestrator.py", body_style), Paragraph("Assembles the LangGraph state machine; handles retry and evaluation routing.", body_style)],
        [Paragraph("Agent 1 (Extract)", body_style), Paragraph("backend/agents/extraction_agent.py", body_style), Paragraph("Validates scraped text against Pydantic models with self-correction.", body_style)],
        [Paragraph("Agent 2 (Strategy)", body_style), Paragraph("backend/agents/strategy_agent.py", body_style), Paragraph("Generates strategic recommendations from competitor statistics.", body_style)],
        [Paragraph("PII Filter", body_style), Paragraph("backend/middleware/pii_filter.py", body_style), Paragraph("Redacts sensitive data before external API calls.", body_style)],
        [Paragraph("Rate Limiter", body_style), Paragraph("backend/middleware/rate_limiter.py", body_style), Paragraph("Manages client token buckets via an atomic Lua script in Redis.", body_style)],
        [Paragraph("RAGAS Evaluator", body_style), Paragraph("backend/evaluation/ragas_evaluator.py", body_style), Paragraph("Runs LLM evaluations to calculate Faithfulness, Answer Relevance, and Context Recall.", body_style)],
        [Paragraph("Semantic Cache", body_style), Paragraph("backend/cache/semantic_cache.py", body_style), Paragraph("Handles embedding-based cache matches and Redis lookups.", body_style)],
        [Paragraph("Telemetry", body_style), Paragraph("backend/telemetry/otel_tracer.py", body_style), Paragraph("Registers OTel tracers, observable gauges, and Prometheus metrics.", body_style)],
        [Paragraph("Database Pool", body_style), Paragraph("backend/db/postgres.py", body_style), Paragraph("Manages connection pooling, writes, and pgvector HNSW searches.", body_style)],
    ]
    t_map = Table(map_data, colWidths=[100, 150, 254])
    t_map.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_map)
    story.append(Paragraph("Table 2: System Component-to-File Reference Matrix", caption_style))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 13: Section 12 (Validation and Test Path Execution Logs)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("12. Validation & Test Paths Execution Logs", h1_style))
    story.append(Paragraph(
        "This section documents the state transitions and database writes of the orchestrator across three paths.",
        body_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>12.1 Success Ingestion Path (Happy Path):</b>", h2_style))
    story.append(Paragraph(
        "• <b>Input:</b> Scraped competitor page content for `RankVantage`. <br/>"
        "• <b>Transitions:</b> `START` ➔ `pii_filter` ➔ `extraction` ➔ `strategy` ➔ `evaluate` ➔ `persist` ➔ `END`. <br/>"
        "• <b>Outcome:</b> RAGAS score is high (`0.94`), and the competitor profile is saved in `competitor_profiles` table.",
        body_style
    ))
    
    story.append(Paragraph("<b>12.2 HITL Ingestion Path (Low Confidence):</b>", h2_style))
    story.append(Paragraph(
        "• <b>Input:</b> Vague marketing copy with no structured competitor statistics. <br/>"
        "• <b>Transitions:</b> `START` ➔ `pii_filter` ➔ `extraction` ➔ `strategy` ➔ `evaluate` ➔ `queue_hitl` ➔ `END`. <br/>"
        "• <b>Outcome:</b> RAGAS score is low (`0.52`), and the payload is routed to the review queue.",
        body_style
    ))

    story.append(Paragraph("<b>12.3 Dead-Letter Ingestion Path (Failed Ingestion):</b>", h2_style))
    story.append(Paragraph(
        "• <b>Input:</b> Random noise text that violates the Pydantic schema. <br/>"
        "• <b>Transitions:</b> `START` ➔ `pii_filter` ➔ `extraction` (fail) ➔ `extraction` (fail) ➔ `extraction` (fail) ➔ `dead_letter` ➔ `END`. <br/>"
        "• <b>Outcome:</b> Extraction fails 3 times, and the payload is routed to the dead-letter queue.",
        body_style
    ))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # Page 14: Section 13, 14 & 15
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("13. Technical Challenges Resolved", h1_style))
    story.append(Paragraph(
        "• <b>LangGraph State Compile Crashes:</b> Resolved compile-time crashes by refactoring Pydantic models to `TypedDict` state structures, matching LangGraph's merge requirements.<br/>"
        "• <b>OTel Observable Gauge Integration:</b> Swapped static gauge setting with callback-driven observable gauges to prevent startup crashes.<br/>"
        "• <b>RAGAS Evaluator API Mismatch:</b> Wrapped the OpenAI client using `LangchainLLMWrapper` to prevent API errors during inline evaluation.",
        body_style
    ))

    story.append(Paragraph("14. Key Engineering Learnings", h1_style))
    story.append(Paragraph(
        "• <b>State Machine Isolation:</b> Decoupling state graphs into predictable updates prevents mutations during retries.<br/>"
        "• <b>Cost-Accuracy Optimization:</b> Using smaller models for extraction and larger models for strategy reasoning cuts costs by 70% while maintaining strategic quality.<br/>"
        "• <b>Database Pooling:</b> Implementing a threaded connection pool prevents connection exhaustion under load.",
        body_style
    ))

    story.append(Paragraph("15. Conclusion & Future Scope", h1_style))
    story.append(Paragraph(
        "• <b>What was designed & implemented:</b> Designed and implemented a production-ready competitor ingestion and recommendation engine for Nimblize, utilizing self-correcting agent loops, RAGAS quality gates, pgvector, and OTel monitoring.<br/>"
        "• <b>What was validated:</b> Validated the pipeline across success, HITL, and dead-letter paths using a local test runner. All code was verified to be clean and pushed to GitHub.<br/>"
        "• <b>Future Scope:</b> Future plans include migrating semantic cache scans to Redis Search for O(1) vector lookups, adding retry wrappers to Agent 2, and automating database index rebuilds based on semantic drift metrics.",
        body_style
    ))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Created final report PDF: {filename}")

if __name__ == "__main__":
    build_pdf()
