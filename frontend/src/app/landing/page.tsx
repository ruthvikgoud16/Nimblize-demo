"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  Zap 
} from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07070a] text-zinc-100 overflow-hidden flex flex-col justify-between">
      {/* Absolute Glow Backgrounds */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center font-bold text-xs text-white">N</div>
          <span className="font-bold tracking-tight text-sm">NIMBLIZE</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-zinc-100 gap-1.5">
            Console <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col items-center justify-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 max-w-3xl"
        >
          <motion.div variants={itemVariants}>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs">
              Phase 6 Design System Active
            </Badge>
          </motion.div>

          <motion.h1 
            variants={itemVariants} 
            className="text-4xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-zinc-100 to-zinc-400 leading-[1.1]"
          >
            Production-Grade AI Prompt Registry & Orchestration
          </motion.h1>

          <motion.p variants={itemVariants} className="text-zinc-400 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
            Deterministic evaluation, semantic caching, and visual pipeline workflows for engineering teams who demand SLA reliability from LLMs.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-medium text-sm gap-2">
                Launch Console <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm border-zinc-800 text-zinc-300 hover:text-zinc-100 bg-transparent">
              Read Documentation
            </Button>
          </motion.div>
        </motion.div>

        {/* Bento / Metric Features */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-24 text-left"
        >
          {/* Card 1 */}
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">YAML Prompt Registry</h3>
            <p className="text-sm text-zinc-400">Version control, variable specifications, and model dependencies declared in declarative YAML templates.</p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">Deterministic Evaluations</h3>
            <p className="text-sm text-zinc-400">RAGAS framework scoring built-in. Verify context precision, faithfulness, and answer relevance on every execution.</p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">Semantic Caching</h3>
            <p className="text-sm text-zinc-400">Sub-millisecond Redis vector cache layer matching semantic equivalence to minimize LLM token billing.</p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900/50 bg-[#07070a] py-8 mt-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 Nimblize. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
