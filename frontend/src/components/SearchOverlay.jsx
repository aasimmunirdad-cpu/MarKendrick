import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Calculator, Gauge, Sparkles, FileText, HelpCircle, MessageSquarePlus, Briefcase, Building2, FolderOpen, BookOpen, User, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const QUICK_LINKS = [
  { to: "/services", label: "Services", icon: Briefcase },
  { to: "/industries", label: "Industries", icon: Building2 },
  { to: "/work", label: "Work", icon: FolderOpen },
  { to: "/insights", label: "Insights", icon: BookOpen },
  { to: "/about", label: "About", icon: User },
  { to: "/contact", label: "Contact", icon: Mail },
];

const TOOL_LINKS = [
  { to: "/roi-calculator", label: "ROI Calculator", icon: Calculator },
  { to: "/maturity-quiz", label: "Marketing Maturity Grade", icon: Gauge },
  { to: "/quiz", label: "Take the Quiz", icon: Sparkles },
  { to: "/whitepapers", label: "Whitepapers & Reports", icon: FileText },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/share-your-experience", label: "Share Your Experience", icon: MessageSquarePlus },
];

export default function SearchOverlay({ open, onClose }) {
  const { data: SERVICES = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });
  const { data: INDUSTRIES_DETAILED = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => (await api.get("/industries")).data,
  });
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ posts: [], case_studies: [] });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults({ posts: [], case_studies: [] });
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults({ posts: [], case_studies: [] });
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
        setResults(res.data);
      } catch {
        /* silent */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const onKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const matchedServices = q.trim().length >= 2
    ? SERVICES.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4)
    : [];
  const matchedIndustries = q.trim().length >= 2
    ? INDUSTRIES_DETAILED.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3)
    : [];

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] bg-background/90 backdrop-blur-2xl"
          onClick={onClose}
        >
          <div className="max-w-3xl mx-auto px-5 pt-24 sm:pt-32" onClick={(e) => e.stopPropagation()}>
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex items-center gap-4 border-b-2 border-foreground/20 focus-within:border-vermilion pb-4 transition-colors">
                <Search size={26} className="text-vermilion shrink-0" />
                <input
                  ref={inputRef}
                  data-testid="search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search, or jump to any page…"
                  className="w-full bg-transparent font-display text-2xl sm:text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
                />
                <button data-testid="search-close-button" onClick={onClose} aria-label="Close search" className="p-2 hover:text-vermilion transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div data-lenis-prevent className="mt-8 max-h-[55vh] overflow-y-auto pr-2 space-y-8 pb-8">
                {matchedServices.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Services</p>
                    {matchedServices.map((s) => (
                      <button key={s.slug} data-testid={`search-service-${s.slug}`} onClick={() => go(`/services/${s.slug}`)} className="w-full text-left group flex items-center justify-between py-3 border-b border-border hover:border-vermilion transition-colors">
                        <span className="font-display text-lg font-semibold group-hover:text-vermilion transition-colors">{s.name}</span>
                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-vermilion group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
                {matchedIndustries.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Industries</p>
                    {matchedIndustries.map((i) => (
                      <button key={i.slug} data-testid={`search-industry-${i.slug}`} onClick={() => go(`/industries/${i.slug}`)} className="w-full text-left group flex items-center justify-between py-3 border-b border-border hover:border-vermilion transition-colors">
                        <span className="font-display text-lg font-semibold group-hover:text-vermilion transition-colors">{i.name}</span>
                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-vermilion group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
                {results.case_studies.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Case Studies</p>
                    {results.case_studies.map((c) => (
                      <button key={c.slug} data-testid={`search-case-${c.slug}`} onClick={() => go(`/work/${c.slug}`)} className="w-full text-left group py-3 border-b border-border hover:border-vermilion transition-colors">
                        <span className="font-display text-lg font-semibold group-hover:text-vermilion transition-colors block">{c.client}</span>
                        <span className="text-sm text-muted-foreground">{c.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.posts.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Insights</p>
                    {results.posts.map((p) => (
                      <button key={p.slug} data-testid={`search-post-${p.slug}`} onClick={() => go(`/insights/${p.slug}`)} className="w-full text-left group py-3 border-b border-border hover:border-vermilion transition-colors">
                        <span className="font-display text-lg font-semibold group-hover:text-vermilion transition-colors block">{p.title}</span>
                        <span className="text-sm text-muted-foreground">{p.category} · {p.read_time}</span>
                      </button>
                    ))}
                  </div>
                )}
                {q.trim().length >= 2 && !matchedServices.length && !matchedIndustries.length && !results.posts.length && !results.case_studies.length && (
                  <p data-testid="search-no-results" className="text-muted-foreground py-6">Nothing found for “{q}”. Try a service, topic or industry.</p>
                )}
                {q.trim().length < 2 && (
                  <div className="space-y-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Jump to</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {QUICK_LINKS.map((l) => (
                          <button
                            key={l.to}
                            data-testid={`command-link-${l.to.slice(1) || "home"}`}
                            onClick={() => go(l.to)}
                            className="flex items-center gap-2.5 text-left px-3.5 py-3 border border-border rounded-lg hover:border-vermilion hover:bg-secondary/60 transition-colors group"
                          >
                            <l.icon size={16} className="text-vermilion shrink-0" />
                            <span className="text-sm font-medium group-hover:text-vermilion transition-colors">{l.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Free Tools &amp; Resources</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TOOL_LINKS.map((l) => (
                          <button
                            key={l.to}
                            data-testid={`command-link-${l.to.slice(1)}`}
                            onClick={() => go(l.to)}
                            className="flex items-center gap-2.5 text-left px-3.5 py-3 border border-border rounded-lg hover:border-vermilion hover:bg-secondary/60 transition-colors group"
                          >
                            <l.icon size={16} className="text-vermilion shrink-0" />
                            <span className="text-sm font-medium group-hover:text-vermilion transition-colors">{l.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Or try searching</p>
                      <div className="flex flex-wrap gap-2">
                        {["Neuromarketing", "SEO", "FMCG", "Performance", "Branding"].map((t) => (
                          <button key={t} onClick={() => setQ(t)} className="text-sm border border-border rounded-full px-4 py-2 hover:border-vermilion hover:text-vermilion transition-colors">
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
