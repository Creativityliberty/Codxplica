"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Send, Github, Loader2, Sparkles, BookOpen,
  Layers, Share2, Copy, Check, ChevronLeft, ChevronRight,
  Maximize2, Wand2, FileText, Code2, Search
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STEPS = [
  { id: "ingest", label: "Analysing Files", icon: Search },
  { id: "identify", label: "Mapping Concepts", icon: Layers },
  { id: "relationships", label: "Linking Logic", icon: Code2 },
  { id: "write", label: "Writing Chapters", icon: Sparkles },
];

export default function Home() {
  const [source, setSource] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Fake step progression for UX during loading
  useEffect(() => {
    let interval: any;
    if (loading) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
      }, 4000);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSelectedChapter(null);

    try {
      const response = await fetch("/api/tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, projectName }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-blue-900/10 dark:via-black dark:to-black">

      {/* Header */}
      <nav className="w-full max-w-7xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setResult(null)}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Sparkles size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Codxplica</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">AI Code Architect</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-full glass border-none text-sm font-semibold flex items-center gap-2 hover:bg-secondary/50 transition-all">
            <Github size={18} /> Source
          </button>
        </div>
      </nav>

      <div className="w-full max-w-5xl flex flex-col items-center gap-12">

        {/* Input Card - Only show when not viewing a result or loading */}
        {!result && !loading && (
          <div className="w-full max-w-3xl flex flex-col items-center gap-8">
            <section className="text-center space-y-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-extrabold tracking-tighter"
              >
                Decode any <span className="text-primary italic">repository</span>.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-lg max-w-xl mx-auto"
              >
                L'IA analyse, structure et rédige un tutoriel complet pour tes projets préférés.
              </motion.p>
            </section>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full glass rounded-premium p-8 border border-white/20 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Git Repository</label>
                    <div className="relative">
                      <Terminal size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="https://github.com/the-pocket/pocketflow"
                        className="w-full bg-secondary/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all outline-none font-medium"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Alias Name</label>
                    <div className="relative">
                      <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="PocketFlow Core"
                        className="w-full bg-secondary/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all outline-none font-medium"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={loading || !source}
                  className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Send size={20} strokeWidth={3} />
                  Start Ingestion
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Loading State with Stylish Progress */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl py-20 flex flex-col items-center gap-12"
            >
              <div className="relative">
                <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-primary"
                  >
                    {(() => {
                      const Icon = STEPS[currentStep].icon;
                      return <Icon size={40} />;
                    })()}
                  </motion.div>
                </div>
              </div>

              <div className="w-full flex justify-between gap-2 px-4">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-3 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-1000",
                        i <= currentStep ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-secondary text-muted"
                      )}>
                        <Icon size={18} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider text-center",
                        i === currentStep ? "text-primary" : "text-muted"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">L'agent Codxplica travaille...</h3>
                <p className="text-muted-foreground animate-pulse">Ceci peut prendre une minute pour les gros projets.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20"
            >
              {/* Sidebar: Chapter List */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">{result.projectName}</h2>
                  <button onClick={() => copyToClipboard(JSON.stringify(result, null, 2))} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>

                <div className="space-y-3">
                  {result.chapters.map((chapter: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedChapter(i)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group",
                        selectedChapter === i
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-white/50 dark:bg-white/5 border-transparent hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                          selectedChapter === i ? "bg-white/20" : "bg-secondary"
                        )}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm leading-tight">{chapter.title}</p>
                          <p className={cn(
                            "text-[10px] uppercase font-black opacity-60",
                            selectedChapter === i ? "text-white" : "text-muted"
                          )}>Concept Analyzed</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className={cn(
                        "transition-transform",
                        selectedChapter === i ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                      )} />
                    </button>
                  ))}
                </div>

                <div className="pt-8 space-y-4">
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                      <Wand2 size={16} /> Modify with AI
                    </div>
                    <textarea
                      placeholder="Demander une modification ou plus de détails..."
                      className="w-full h-24 bg-white dark:bg-black/40 border border-primary/20 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                    <button className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
                      Update Project
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content: Chapter Preview */}
              <div className="lg:col-span-8">
                {selectedChapter !== null ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={selectedChapter}
                    className="glass rounded-premium border-none min-h-[600px] flex flex-col overflow-hidden"
                  >
                    <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/30 dark:bg-black/30">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedChapter(null)} className="lg:hidden p-2 hover:bg-black/5 rounded-lg">
                          <ChevronLeft />
                        </button>
                        <h2 className="text-xl font-black">{result.chapters[selectedChapter].title}</h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(result.chapters[selectedChapter].content)}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black rounded-full text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all"
                        >
                          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          Copy Chapter
                        </button>
                      </div>
                    </div>

                    <div className="p-8 md:p-12 overflow-y-auto prose dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap leading-relaxed text-lg font-medium opacity-90">
                        {result.chapters[selectedChapter].content}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass rounded-premium border-none h-full flex flex-col items-center justify-center p-20 text-center gap-6 opacity-40">
                    <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center text-muted">
                      <Maximize2 size={40} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">Sélectionne un chapitre</h3>
                      <p className="font-medium">Clique sur un concept à gauche pour explorer l'analyse détaillée.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-auto py-10 text-muted-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50">
        Codxplica <span className="text-primary">v1.0.0</span> • Built on Bun
      </footer>

    </main>
  );
}
