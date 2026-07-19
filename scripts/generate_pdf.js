#!/usr/bin/env node
/**
 * generate_pdf.js
 * Converts Nimblize_Future_Implementation_Roadmap.md into a professional PDF
 * using Puppeteer for rendering and Mermaid CDN for diagrams.
 *
 * Usage: node scripts/generate_pdf.js
 */

const fs = require("fs");
const path = require("path");

const MD_PATH = path.resolve(
  __dirname,
  "../docs/Nimblize_Future_Implementation_Roadmap.md"
);
const PDF_PATH = path.resolve(
  __dirname,
  "../Nimblize_Future_Implementation_Roadmap.pdf"
);

// ── Minimal Markdown→HTML converter (no external libs) ───────────────────────

function mdToHtml(md) {
  let html = "";
  const lines = md.split("\n");
  let i = 0;
  let inTable = false;
  let inList = false;
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeContent = "";
  let inMermaid = false;
  let mermaidContent = "";

  while (i < lines.length) {
    const line = lines[i];

    // --- Fenced code blocks ---
    if (/^```/.test(line)) {
      if (inCodeBlock || inMermaid) {
        if (inMermaid) {
          html += `<div class="mermaid">\n${mermaidContent}\n</div>\n`;
          inMermaid = false;
          mermaidContent = "";
        } else {
          html += `<pre><code class="language-${codeBlockLang}">${escapeHtml(codeContent)}</code></pre>\n`;
          inCodeBlock = false;
          codeContent = "";
        }
        i++;
        continue;
      }
      const langMatch = line.match(/^```(\w*)/);
      const lang = langMatch ? langMatch[1] : "";
      if (lang === "mermaid") {
        inMermaid = true;
        mermaidContent = "";
      } else {
        inCodeBlock = true;
        codeBlockLang = lang || "text";
        codeContent = "";
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      i++;
      continue;
    }
    if (inMermaid) {
      mermaidContent += line + "\n";
      i++;
      continue;
    }

    // --- Horizontal rules ---
    if (/^---\s*$/.test(line)) {
      if (inList) { html += "</ul>\n"; inList = false; }
      if (inTable) { html += "</tbody></table>\n"; inTable = false; }
      i++;
      continue;
    }

    // --- Tables ---
    if (/^\|(.+)\|$/.test(line)) {
      const cells = line.split("|").filter((c) => c.trim() !== "");
      // Check if next line is separator
      if (
        i + 1 < lines.length &&
        /^\|[\s:|-]+\|$/.test(lines[i + 1])
      ) {
        // Table header
        if (inList) { html += "</ul>\n"; inList = false; }
        html += '<table>\n<thead><tr>';
        cells.forEach((c) => (html += `<th>${inlineFormat(c.trim())}</th>`));
        html += "</tr></thead>\n<tbody>\n";
        inTable = true;
        i += 2; // skip separator
        continue;
      }
      if (inTable) {
        html += "<tr>";
        cells.forEach((c) => (html += `<td>${inlineFormat(c.trim())}</td>`));
        html += "</tr>\n";
        i++;
        continue;
      }
    }
    if (inTable && !/^\|/.test(line)) {
      html += "</tbody></table>\n";
      inTable = false;
    }

    // --- Headings ---
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      if (inList) { html += "</ul>\n"; inList = false; }
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      html += `<h${level} id="${id}">${inlineFormat(text)}</h${level}>\n`;
      i++;
      continue;
    }

    // --- Ordered list ---
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inList) {
        html += "<ol>\n";
        inList = "ol";
      }
      html += `<li>${inlineFormat(olMatch[2])}</li>\n`;
      i++;
      continue;
    }
    if (inList === "ol" && !olMatch) {
      html += "</ol>\n";
      inList = false;
    }

    // --- Unordered list ---
    const ulMatch = line.match(/^\*\s+(.*)/);
    if (ulMatch) {
      if (inList !== "ul") {
        if (inList) html += inList === "ol" ? "</ol>\n" : "</ul>\n";
        html += "<ul>\n";
        inList = "ul";
      }
      html += `<li>${inlineFormat(ulMatch[1])}</li>\n`;
      i++;
      continue;
    }
    if (inList === "ul" && !ulMatch && line.trim() !== "") {
      html += "</ul>\n";
      inList = false;
    }

    // --- Blank line ---
    if (line.trim() === "") {
      if (inList) {
        // keep list open through single blank lines if next line continues
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (
            (inList === "ul" && /^\*\s+/.test(nextLine)) ||
            (inList === "ol" && /^\d+\.\s+/.test(nextLine))
          ) {
            i++;
            continue;
          }
        }
        html += inList === "ol" ? "</ol>\n" : "</ul>\n";
        inList = false;
      }
      i++;
      continue;
    }

    // --- Paragraph ---
    if (inList) {
      html += inList === "ol" ? "</ol>\n" : "</ul>\n";
      inList = false;
    }
    html += `<p>${inlineFormat(line)}</p>\n`;
    i++;
  }

  if (inList) html += inList === "ol" ? "</ol>\n" : "</ul>\n";
  if (inTable) html += "</tbody></table>\n";

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text) {
  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Links
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );
  return text;
}

// ── Build full HTML document ─────────────────────────────────────────────────

function buildHtmlDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Future Architecture Recommendations, Scaling Roadmap, and Long-Term AI Evolution for Nimblize</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      fontSize: '20px',
      fontFamily: 'Inter, sans-serif',
      primaryColor: '#e8f0fe',
      primaryTextColor: '#1a1a2e',
      primaryBorderColor: '#4a6cf7',
      lineColor: '#4a6cf7',
      secondaryColor: '#f0f4ff',
      tertiaryColor: '#fff',
      edgeLabelBackground: '#ffffff'
    },
    flowchart: {
      useWidth: true,
      htmlLabels: true,
      curve: 'basis'
    }
  });
</script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --color-primary: #1a1a2e;
    --color-accent: #4a6cf7;
    --color-accent-light: #e8f0fe;
    --color-text: #2d2d3f;
    --color-text-light: #6b7280;
    --color-border: #e2e8f0;
    --color-bg: #ffffff;
    --color-cover-gradient-start: #0f0c29;
    --color-cover-gradient-mid: #302b63;
    --color-cover-gradient-end: #24243e;
  }

  @page {
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }

  @page :first { margin: 0; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 10.5pt;
    line-height: 1.46;
    color: var(--color-text);
    background: var(--color-bg);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Cover Page ──────────────────────────────────────── */
  .cover-page {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(135deg,
      var(--color-cover-gradient-start) 0%,
      var(--color-cover-gradient-mid) 50%,
      var(--color-cover-gradient-end) 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: #fff;
    position: relative;
    page-break-after: always;
    overflow: hidden;
    padding: 0 30mm;
  }

  .cover-page::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74,108,247,0.15) 0%, transparent 70%);
  }

  .cover-page::after {
    content: '';
    position: absolute;
    bottom: -40%;
    left: -20%;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74,108,247,0.1) 0%, transparent 70%);
  }

  .cover-org-badge {
    font-size: 14pt;
    font-weight: 600;
    letter-spacing: 8px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    margin-bottom: 40px;
    z-index: 1;
  }

  .cover-title {
    font-size: 26pt;
    font-weight: 800;
    line-height: 1.25;
    max-width: 650px;
    z-index: 1;
    margin-bottom: 24px;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 13pt;
    font-weight: 300;
    color: rgba(255,255,255,0.7);
    max-width: 500px;
    line-height: 1.6;
    z-index: 1;
    margin-bottom: 40px;
  }

  .cover-note {
    font-size: 9.5pt;
    font-style: italic;
    color: rgba(255,255,255,0.6);
    max-width: 480px;
    line-height: 1.6;
    z-index: 1;
    border-top: 1px solid rgba(255,255,255,0.2);
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding: 20px 10px;
    margin-bottom: 50px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
  }

  .cover-meta {
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 40px;
    text-align: left;
    font-size: 9.5pt;
    color: rgba(255,255,255,0.6);
    width: 100%;
    max-width: 500px;
  }
  .cover-meta strong {
    color: rgba(255,255,255,0.9);
    font-weight: 600;
  }

  .cover-version {
    position: absolute;
    bottom: 30px;
    right: 30px;
    font-size: 8pt;
    color: rgba(255,255,255,0.35);
    z-index: 1;
  }

  /* ── TOC Page ────────────────────────────────────────── */
  .toc-page {
    page-break-after: always;
    padding-top: 15mm;
  }
  .toc-page h2 {
    font-size: 20pt;
    color: var(--color-primary);
    margin-bottom: 30px;
    border-bottom: 3px solid var(--color-accent);
    padding-bottom: 8px;
    display: inline-block;
  }
  .toc-list {
    list-style: none;
    counter-reset: toc-counter;
  }
  .toc-list li {
    padding: 10px 0;
    border-bottom: 1px dotted var(--color-border);
    font-size: 11pt;
    color: var(--color-text);
    display: flex;
    align-items: baseline;
  }
  .toc-list li .toc-num {
    font-weight: 700;
    color: var(--color-accent);
    min-width: 35px;
  }

  /* ── Content Styles ──────────────────────────────────── */
  .content { }

  h1 {
    font-size: 15pt;
    color: var(--color-primary);
    font-weight: 800;
    margin: 16px 0 8px 0;
    page-break-before: always;
    page-break-after: avoid;
  }
  h1::after {
    content: '';
    display: block;
    width: 35px;
    height: 2.5px;
    background: var(--color-accent);
    margin-top: 5px;
    border-radius: 1px;
  }

  h2 {
    font-size: 12.5pt;
    color: var(--color-primary);
    font-weight: 700;
    margin: 14px 0 6px 0;
    padding-bottom: 3px;
    border-bottom: 1.5px solid var(--color-border);
    page-break-after: avoid;
  }

  h3 {
    font-size: 10pt;
    color: var(--color-accent);
    font-weight: 600;
    margin: 10px 0 4px 0;
    page-break-after: avoid;
  }

  p {
    margin: 4px 0;
    text-align: justify;
  }

  ul, ol {
    margin: 4px 0 4px 18px;
  }

  li {
    margin: 2px 0;
  }

  strong { font-weight: 600; }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 8pt;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    padding: 1px 4px;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-size: 8pt;
    line-height: 1.4;
    margin: 10px 0;
    page-break-inside: avoid;
    border: 1px solid #1e293b;
  }
  pre code {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }

  /* ── Tables ──────────────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }
  thead {
    background: var(--color-primary);
    color: #fff;
  }
  th {
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid var(--color-accent);
  }
  td {
    padding: 7px 10px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
  }
  tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  /* ── Mermaid Diagrams ────────────────────────────────── */
  .mermaid {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px auto;
    padding: 18px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    page-break-inside: avoid;
    box-shadow: 0 2px 8px rgba(74, 108, 247, 0.02);
    text-align: center;
  }
  .mermaid svg {
    max-width: 88% !important;
    width: auto !important;
    height: auto !important;
    max-height: 350px !important;
  }

  /* Premium SVG Custom Overrides */
  .node rect, .node circle, .node polygon, .node path {
    fill: #f0f4ff !important;
    stroke: #4a6cf7 !important;
    stroke-width: 1.5px !important;
  }
  .node .label {
    font-family: 'Inter', sans-serif !important;
    color: #1a1a2e !important;
    font-weight: 600 !important;
    font-size: 12.5pt !important;
  }
  .edgePath .path {
    stroke: #4a6cf7 !important;
    stroke-width: 1.8px !important;
  }
  .edgeLabel rect {
    fill: #ffffff !important;
  }
  .edgeLabel span {
    font-family: 'Inter', sans-serif !important;
    font-size: 11pt !important;
    color: #4b5563 !important;
  }
  .marker {
    fill: #4a6cf7 !important;
    stroke: none !important;
  }
  
  /* Gantt Custom styling overrides */
  .grid .tick line {
    stroke: #e2e8f0 !important;
    stroke-width: 1px !important;
  }
  .taskText {
    font-family: 'Inter', sans-serif !important;
    font-size: 12pt !important;
    fill: #ffffff !important;
    font-weight: 600 !important;
  }
  .task0 {
    fill: #4a6cf7 !important;
    stroke: #4a6cf7 !important;
  }
  .task1 {
    fill: #10b981 !important;
    stroke: #10b981 !important;
  }
  .task2 {
    fill: #f59e0b !important;
    stroke: #f59e0b !important;
  }

  /* ── Footer / Page Numbers ───────────────────────────── */
  @media print {
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 18mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 20mm 8mm 20mm;
      font-size: 7.5pt;
      color: var(--color-text-light);
      border-top: 1px solid var(--color-border);
    }
  }
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 18mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 20mm 8mm 20mm;
    font-size: 7.5pt;
    color: var(--color-text-light);
    border-top: 1px solid var(--color-border);
  }

  /* ── Section break helper ────────────────────────────── */
  .section-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<!-- ═══════════════════ COVER PAGE ═══════════════════ -->
<div class="cover-page">
  <div class="cover-org-badge">Nimblize</div>
  <div class="cover-title">Future Architecture Recommendations, Scaling Roadmap, and Long-Term AI Evolution for Nimblize</div>
  <div class="cover-subtitle">
    Nimblize Future Implementation &amp; Production Roadmap
  </div>
  <div class="cover-note">
    This document contains future implementation recommendations, scaling strategies, and proposed enhancements beyond the currently implemented Phase 4 scope.
  </div>
  <div class="cover-meta">
    <div><strong>Organization:</strong> Nimblize</div>
    <div><strong>Domain:</strong> AI &amp; Automation</div>
    <div><strong>Domain Leader:</strong> Aastha Shukla</div>
    <div><strong>CTO &amp; Co-Founder:</strong> Anshul Sinha</div>
    <div><strong>Version:</strong> 4.2.0-PROD</div>
    <div><strong>Date:</strong> July 2026</div>
  </div>
  <div class="cover-version">Classification: Production-Ready Engineering Blueprint</div>
</div>

<!-- ═══════════════════ TABLE OF CONTENTS ═══════════════════ -->
<div class="toc-page">
  <h2>Table of Contents</h2>
  <ul class="toc-list">
    <li><span class="toc-num">—</span> Executive Summary</li>
    <li><span class="toc-num">1</span> Introduction</li>
    <li><span class="toc-num">2</span> Research &amp; Background</li>
    <li><span class="toc-num">3</span> System Overview</li>
    <li><span class="toc-num">4</span> System Architecture</li>
    <li><span class="toc-num">5</span> Database Design</li>
    <li><span class="toc-num">6</span> AI Architecture</li>
    <li><span class="toc-num">7</span> Retrieval System / RAG Layer</li>
    <li><span class="toc-num">8</span> Multi-Agent Architecture</li>
    <li><span class="toc-num">9</span> Orchestration Workflow</li>
    <li><span class="toc-num">10</span> Security Architecture</li>
    <li><span class="toc-num">11</span> Monitoring &amp; Observability</li>
    <li><span class="toc-num">12</span> Cost Optimization</li>
    <li><span class="toc-num">13</span> Implementation Details</li>
    <li><span class="toc-num">14</span> Testing &amp; Validation</li>
    <li><span class="toc-num">15</span> Execution Results</li>
    <li><span class="toc-num">16</span> Challenges Faced</li>
    <li><span class="toc-num">17</span> Key Engineering Learnings</li>
    <li><span class="toc-num">18</span> Future Scope</li>
    <li><span class="toc-num">19</span> Conclusion</li>
    <li><span class="toc-num">—</span> Appendix</li>
  </ul>
</div>

<!-- ═══════════════════ REPORT CONTENT ═══════════════════ -->
<div class="content">
${bodyHtml}
</div>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<div class="page-footer">
  <span>Future Architecture Recommendations, Scaling Roadmap &amp; AI Evolution</span>
  <span>Confidential &mdash; v4.2.0-PROD</span>
</div>

</body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[1/4] Reading markdown source…");
  const mdContent = fs.readFileSync(MD_PATH, "utf-8");

  console.log("[2/4] Converting Markdown → HTML…");
  const bodyHtml = mdToHtml(mdContent);
  const fullHtml = buildHtmlDocument(bodyHtml);

  const htmlPath = path.resolve(__dirname, "../_temp_report.html");
  fs.writeFileSync(htmlPath, fullHtml, "utf-8");
  console.log("      HTML written to", htmlPath);

  console.log("[3/4] Launching Puppeteer for PDF rendering…");
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    console.error(
      "Puppeteer not found. Install with: npm install puppeteer"
    );
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("file://" + htmlPath, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // Wait for Mermaid diagrams to render
  await page.waitForFunction(
    () => document.querySelectorAll(".mermaid svg").length > 0 ||
          document.querySelectorAll(".mermaid[data-processed]").length > 0,
    { timeout: 15000 }
  ).catch(() => console.log("      (Mermaid rendering timeout — continuing)"));

  await new Promise((r) => setTimeout(r, 2000)); // extra settle time

  await page.pdf({
    path: PDF_PATH,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width:100%;font-size:8px;font-family:Inter,sans-serif;
                  display:flex;justify-content:space-between;padding:0 20mm;
                  color:#9ca3af;">
        <span>Nimblize — Future Implementation & Production Roadmap</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
    margin: {
      top: "22mm",
      bottom: "22mm",
      left: "20mm",
      right: "20mm",
    },
  });

  console.log("[4/4] PDF generated →", PDF_PATH);

  await browser.close();

  // Cleanup
  fs.unlinkSync(htmlPath);
  console.log("      Temp HTML cleaned up.");

  // Report page count (approximate from file)
  const pdfBuf = fs.readFileSync(PDF_PATH);
  const pageMatches = pdfBuf.toString("binary").match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : "unknown";
  console.log(`\n✅ Complete!`);
  console.log(`   PDF Path:   ${PDF_PATH}`);
  console.log(`   Page Count: ${pageCount}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
