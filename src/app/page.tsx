"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Code, Shield } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-blue-900/10 dark:via-black dark:to-black pb-20">

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest shadow-sm border border-primary/10"
        >
          <Sparkles size={14} /> Powered by Gemini 2.0 & Bun
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-tight"
        >
          The architecture of code,<br />
          <span className="text-primary italic">explained by AI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium"
        >
          Transformez n'importe quel dépôt GitHub en un tutoriel structuré, pédagogique et esthétique en quelques secondes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/dashboard">
            <button className="px-10 py-5 bg-primary text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group">
              Get Started for free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <button className="px-10 py-5 glass border-none rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-secondary/50 transition-all">
            View Example
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Zap, title: "Analyse Instantanée", desc: "Grâce à Gitingest, nous lisons des milliers de lignes de code en un clin d'œil." },
          { icon: Code, title: "Graph de Connaissances", desc: "L'IA identifie les abstractions et mappe leurs relations pour un apprentissage optimal." },
          { icon: Shield, title: "Prêt pour la Prod", desc: "Exportez vos tutoriels en Markdown, PDF ou Notion pour votre équipe ou vos utilisateurs." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="p-8 glass rounded-premium border-none space-y-4 text-left"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <feat.icon size={24} />
            </div>
            <h3 className="text-xl font-bold">{feat.title}</h3>
            <p className="text-muted-foreground font-medium">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

    </main>
  );
}
