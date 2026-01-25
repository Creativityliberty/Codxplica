"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Send, Loader2, Sparkles, BookOpen,
  Layers, Copy, Check, ChevronRight,
  Maximize2, Share2, Search, Code2, Clock, Cpu, Zap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Configuration des providers et modèles
const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    icon: Sparkles,
    models: [
      { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash Exp", description: "Rapide et intelligent" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Stable, rapide" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Plus puissant" },
    ],
  },
  openrouter: {
    name: "OpenRouter (Gratuit)",
    icon: Zap,
    models: [
      { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1", description: "Reasoning, excellent pour l'analyse" },
      { id: "deepseek/deepseek-chat:free", name: "DeepSeek Chat", description: "Chat rapide et efficace" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", description: "Tres puissant, 70B params" },
      { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B", description: "Leger et rapide" },
      { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B", description: "Excellent pour le code" },
      { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", description: "Par Google, equilibre" },
      { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", description: "Francais, rapide" },
      { id: "microsoft/phi-3-medium-128k-instruct:free", name: "Phi-3 Medium", description: "Par Microsoft, 128k context" },
    ],
  },
};

const STEPS = [
  { id: "ingest", label: "Analysing Files", icon: Search },
  { id: "identify", label: "Mapping Concepts", icon: Layers },
  { id: "relationships", label: "Linking Logic", icon: Code2 },
  { id: "write", label: "Writing Chapters", icon: Sparkles },
];

export default function DashboardPage() {
  const [source, setSource] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"new" | "history">("new");

  // Nouveaux états pour provider et modèle
  const [provider, setProvider] = useState<"gemini" | "openrouter">("openrouter");
  const [model, setModel] = useState(PROVIDERS.openrouter.models[0].id);

  // Fetch past projects
  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error(err));
  }, [result]);

  // Fake step progression
  useEffect(() => {
    let interval: any;
    if (loading) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Mettre à jour le modèle quand le provider change
  useEffect(() => {
    setModel(PROVIDERS[provider].models[0].id);
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSelectedChapter(null);

    try {
      const response = await fetch("/api/tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, projectName, provider, model }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setView("new");
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
  const downloadMarkdown = () => {
    if (!result || !result.chapters) return;
    const content = result.chapters.map((c: any) => `# ${c.title}\n\n${c.content}`).join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.name.replace(/\s+/g, "_").toLowerCase()}_tutorial.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-12 px-6 pb-20">
      {/* ... tabs ... */}
      {!loading && !result && (
        <div className="flex gap-4 p-1 glass rounded-2xl">
          <button
            onClick={() => setView("new")}
            className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === "new" ? "bg-primary text-white shadow-lg" : "hover:bg-black/5")}
          >
            New Tutorial
          </button>
          <button
            onClick={() => setView("history")}
            className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === "history" ? "bg-primary text-white shadow-lg" : "hover:bg-black/5")}
          >
            My Projects ({projects.length})
          </button>
        </div>
      )}

      {/* New Project Form */}
      {view === "new" && !result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl glass rounded-premium p-10 shadow-2xl space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Start an Analysis</h2>
            <p className="text-muted-foreground font-medium">Decode any repository into a structured tutorial.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">GitHub URL</label>
                <div className="relative">
                  <Terminal size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    className="w-full bg-secondary/30 border-none rounded-2xl py-5 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-bold"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Alias Name</label>
                <div className="relative">
                  <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Project Name"
                    className="w-full bg-secondary/30 border-none rounded-2xl py-5 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-bold"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sélection du Provider */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">AI Provider</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(PROVIDERS) as Array<keyof typeof PROVIDERS>).map((key) => {
                  const p = PROVIDERS[key];
                  const Icon = p.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProvider(key)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex items-center gap-3",
                        provider === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent bg-secondary/30 hover:border-primary/30"
                      )}
                    >
                      <Icon size={20} />
                      <div className="text-left">
                        <div className="font-bold text-sm">{p.name}</div>
                        {key === "openrouter" && (
                          <div className="text-[10px] text-green-500 font-bold">GRATUIT</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sélection du Modèle */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">
                Model <span className="text-primary">({PROVIDERS[provider].models.length} disponibles)</span>
              </label>
              <div className="relative">
                <Cpu size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-secondary/30 border-none rounded-2xl py-5 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none font-bold appearance-none cursor-pointer"
                >
                  {PROVIDERS[provider].models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.description}
                    </option>
                  ))}
                </select>
                <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted rotate-90 pointer-events-none" />
              </div>
            </div>

            <button className="w-full py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <Send size={20} /> Generate Now
            </button>
          </form>
        </motion.div>
      )}

      {/* Project History */}
      {view === "history" && !result && !loading && (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-40 italic">Aucun projet trouvé.</div>
          ) : (
            projects.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -5 }}
                onClick={() => setResult(p)}
                className="glass rounded-premium p-6 border-none cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <BookOpen size={24} />
                  </div>
                  <div className="text-[10px] font-black uppercase flex items-center gap-1 text-muted">
                    <Clock size={10} /> {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{p.name}</h3>
                <p className="text-xs text-muted-foreground font-medium truncate mb-6">{p.sourceUrl}</p>
                <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-wider">
                  View Tutorial <ChevronRight size={14} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Loading Progress */}
      {loading && (
        <div className="w-full max-w-2xl py-20 flex flex-col items-center gap-12">
          <div className="relative">
            <div className="w-40 h-40 border-8 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-primary">
              {(() => {
                const Icon = STEPS[currentStep].icon;
                return <Icon size={50} />;
              })()}
            </div>
          </div>
          <div className="w-full flex justify-between gap-2 px-10">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex flex-col items-center gap-3 flex-1">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-1000", i <= currentStep ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-black/5 text-muted")}>
                  <step.icon size={20} />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest text-center", i === currentStep ? "text-primary opacity-100" : "opacity-40")}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Section (Viewer) */}
      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">{result.name}</h2>
              <button
                onClick={() => { setResult(null); setView("history"); }}
                className="text-xs font-black uppercase tracking-widest py-2 px-4 glass border-none rounded-xl"
              >
                Back
              </button>
            </div>

            <div className="space-y-3 pointer-events-auto">
              {result.chapters.map((chapter: any, i: number) => (
                <button
                  key={chapter.id || i}
                  onClick={() => setSelectedChapter(i)}
                  className={cn(
                    "w-full text-left p-6 rounded-3xl border transition-all flex items-center justify-between group",
                    selectedChapter === i ? "bg-primary text-white shadow-2xl shadow-primary/30 border-primary" : "bg-white/40 dark:bg-white/5 border-transparent hover:border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs", selectedChapter === i ? "bg-white/20" : "bg-secondary")}>{i + 1}</span>
                    <span className="font-bold text-sm tracking-tight">{chapter.title}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={downloadMarkdown}
              className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              <Share2 size={16} /> Download Markdown Bundle
            </button>
          </div>

          {/* Viewer */}
          <div className="lg:col-span-8">
            {selectedChapter !== null ? (
              <div className="glass rounded-premium border-none min-h-[700px] flex flex-col overflow-hidden">
                <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/20">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{result.chapters[selectedChapter].title}</h2>
                  <button onClick={() => copyToClipboard(result.chapters[selectedChapter].content)} className="p-3 hover:bg-black/5 rounded-2xl">
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
                <div className="p-10 md:p-14 overflow-y-auto prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed text-xl font-medium opacity-90">{result.chapters[selectedChapter].content}</div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-premium h-[700px] flex flex-col items-center justify-center text-center opacity-30">
                <Maximize2 size={60} className="mb-6" />
                <h3 className="text-3xl font-black uppercase italic italic tracking-tighter">Sélectionnez un chapitre</h3>
              </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}
