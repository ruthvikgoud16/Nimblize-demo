"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LiquidButton } from "@/components/ui/liquid-button";
import { 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  Zap,
  Sparkles,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070c] text-white overflow-hidden flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      {/* ─── Animated Ambient Liquid Blobs ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-50 blur-[130px] animate-liquid-drift-1"
          style={{ background: "radial-gradient(circle, #a855f7 0%, #6366f1 70%)" }}
        />
        <div 
          className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full opacity-40 blur-[140px] animate-liquid-drift-2"
          style={{ background: "radial-gradient(circle, #ec4899 0%, #38bdf8 70%)" }}
        />
        <div 
          className="absolute bottom-[-10%] left-[25%] w-[650px] h-[650px] rounded-full opacity-35 blur-[150px] animate-liquid-drift-1"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, #10b981 70%)" }}
        />
        <div className="absolute inset-0 tech-grid-pattern opacity-40 mix-blend-overlay" />
      </div>

      {/* ─── Dynamic Island Floating Header ─── */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl liquid-glass-pill rounded-full px-5 py-3 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-sm text-white shadow-inner">
            ✦
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-sm text-white flex items-center gap-1.5">
              NIMBLIZE <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">v1.0.0</span>
            </span>
          </div>
        </div>

        {/* Dynamic Island Center Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Presets: 29 YAML Templates</span>
          <span className="text-zinc-600">|</span>
          <span className="text-purple-300 font-mono">RAGAS &gt; 0.85</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/playground/liquid-button">
            <span className="hidden sm:inline-block text-xs text-zinc-300 hover:text-white transition-colors px-2 py-1">
              Liquid Demo
            </span>
          </Link>
          <Link href="/">
            <LiquidButton
              label="Launch Studio"
              options={{
                glassThickness: 70,
                bezelWidth: 6,
                refractiveIndex: 1.45,
                profile: "convexSquircle",
              }}
              className="px-4 py-1.5 text-xs font-semibold text-white shadow-lg"
            />
          </Link>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 pt-36 pb-20 flex flex-col items-center justify-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 max-w-4xl"
        >
          {/* iOS Liquid Badge */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-lg text-xs font-medium text-purple-200">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>iPhone Liquid Glass Engine · Phase 6 Release</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            </div>
          </motion.div>

          {/* Liquid Gradient Heading */}
          <motion.h1 
            variants={itemVariants} 
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.08] text-white"
          >
            Production AI Assets & <br />
            <span className="liquid-accent-gradient">Agent Orchestration</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants} 
            className="text-zinc-300 text-lg sm:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-balance"
          >
            Enterprise competitor intelligence & semantic recommendation platform built with <span className="text-white font-medium">MS Presidio PII scrubbing</span>, <span className="text-white font-medium">Redis vector caching</span>, and <span className="text-white font-medium">RAGAS circuit breakers</span>.
          </motion.p>

          {/* Liquid Action CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <LiquidButton
                label="Launch Nimblize Studio"
                options={{
                  glassThickness: 90,
                  bezelWidth: 10,
                  refractiveIndex: 1.5,
                  profile: "convexSquircle",
                }}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white shadow-xl cursor-pointer"
              />
            </Link>
            
            <Link href="/playground/liquid-button" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-7 py-3.5 rounded-2xl liquid-glass-card text-sm font-medium text-zinc-200 hover:text-white hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-2 group">
                <Layers className="h-4 w-4 text-purple-400 group-hover:rotate-12 transition-transform" />
                View Liquid Glass Playground
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ─── iPhone Liquid Glass Interactive Showcase Stage ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl mt-20 relative z-20"
        >
          <div className="liquid-glass-card rounded-[2.5rem] p-6 sm:p-8 border border-white/20 shadow-[0_32px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden">
            {/* Top iOS Status Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 text-xs text-zinc-400">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-white">9:41</span>
                <span className="text-emerald-400">✦ NimblizeOS</span>
              </div>

              {/* Dynamic Island Notch */}
              <div className="h-5 w-28 rounded-full bg-black/80 border border-white/15 flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[9px] font-mono text-zinc-300 uppercase">CIMS Live</span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-purple-300">pgvector: Active</span>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-200">5G 100%</span>
              </div>
            </div>

            {/* Metrics HUD Row inside Glass Stage */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 text-left">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-purple-300">Prompt Library</span>
                <p className="text-2xl font-bold text-white mt-1">29 YAMLs</p>
                <span className="text-[11px] text-zinc-400">8 Categories</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">Vector Cache</span>
                <p className="text-2xl font-bold text-white mt-1">&lt; 15ms</p>
                <span className="text-[11px] text-zinc-400">Redis 0.15 Cosine</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-cyan-400">RAGAS Quality</span>
                <p className="text-2xl font-bold text-white mt-1">0.94 SLA</p>
                <span className="text-[11px] text-zinc-400">Circuit Breaker &gt;0.85</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-pink-400">PII Security</span>
                <p className="text-2xl font-bold text-white mt-1">0 Leaks</p>
                <span className="text-[11px] text-zinc-400">Presidio Scrubbed</span>
              </div>
            </div>

            {/* Terminal Live Code Preview */}
            <div className="rounded-2xl bg-[#030509]/90 border border-white/10 p-5 text-left font-mono text-xs text-zinc-300 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-purple-400" />
                  assets/prompts/competitor_analysis/CA-001.yaml
                </span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Schema Validated 100%
                </span>
              </div>
              <pre className="text-zinc-300 leading-relaxed overflow-x-auto">
{`name: "Competitor Strategy Extractor"
version: "1.1.0"
category: "competitor_analysis"
temperature: 0.2
model: "gpt-4o"
parameters:
  - name: "raw_scraped_text"
    type: "string"
    required: true
evaluation_metric: "ragas_faithfulness"`}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* ─── iOS Squircle Feature Widgets Grid ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-24 text-left relative z-20"
        >
          {/* Feature 1 */}
          <div className="p-7 rounded-[2rem] liquid-glass-card hover:border-purple-500/40 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">29 Prompt Templates</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Fully decoupled YAML prompt library across 8 categories with versioning, parameters, and temperature benchmarks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-[2rem] liquid-glass-card hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">RAGAS Quality Gate</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Inline automated evaluation circuit breakers rerouting reports with quality scores &lt; 0.85 to human review queues.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-[2rem] liquid-glass-card hover:border-cyan-500/40 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sub-15ms Vector Cache</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Redis semantic caching layer matching 0.15 cosine similarity thresholds to eliminate unnecessary token spending.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-[2rem] liquid-glass-card hover:border-pink-500/40 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-5 group-hover:scale-110 transition-transform">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Presidio PII Protection</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Local Microsoft Presidio NER scrubbers filtering out sensitive data prior to sending requests to external LLM providers.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-[2rem] liquid-glass-card hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">LangGraph State Machines</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Self-correcting agentic extraction loops dynamically validating structure and retrying failures automatically.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-[2rem] liquid-glass-card hover:border-blue-500/40 transition-all duration-300 group">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">OpenTelemetry Metrics</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Full observability instrumentation tracking latencies, cost savings, error rates, and Prometheus dashboards.
            </p>
          </div>
        </motion.div>
      </main>

      {/* ─── Liquid Glass Footer ─── */}
      <footer className="relative z-20 border-t border-white/10 bg-black/40 backdrop-blur-2xl py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">✦ NIMBLIZE STUDIO</span>
            <span className="text-zinc-600">·</span>
            <span>Production AI Assets & Automation Engine</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Console</Link>
            <Link href="/playground" className="hover:text-white transition-colors">Playground</Link>
            <Link href="/automation" className="hover:text-white transition-colors">Automation</Link>
            <Link href="/playground/liquid-button" className="hover:text-white transition-colors">Liquid Glass</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
