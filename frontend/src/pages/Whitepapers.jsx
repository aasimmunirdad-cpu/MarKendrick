import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Loader2, Check, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

export default function Whitepapers() {
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["whitepapers"],
    queryFn: async () => (await api.get("/whitepapers")).data,
  });
  const [gating, setGating] = useState(null); // paper object
  const [unlocked, setUnlocked] = useState({}); // id -> download_url

  return (
    <div data-testid="whitepapers-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Whitepapers & Research Reports" description="Free research reports from MarKendrick: the Pakistan Consumer Report 2026, Neuromarketing at the Shelf, and the CMO's Diagnostic Toolkit." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">Whitepapers & Reports</p>
          <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-7xl mb-6">Research worth<br /><span className="text-vermilion">an email address.</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg">Free to download. We ask for your email so The Signal — our monthly briefing — lands in your inbox too. Unsubscribe anytime.</p>
        </Reveal>

        {isLoading ? (
          <div className="h-72 animate-pulse bg-card" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {papers.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06} className="bg-background">
                <div className="p-8 sm:p-10 h-full flex flex-col" data-testid={`whitepaper-card-${p.id}`}>
                  <div className="w-12 h-12 border border-vermilion/40 bg-vermilion/10 text-vermilion flex items-center justify-center mb-6">
                    <FileText size={20} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">{p.category} · {p.pages}</p>
                  <h2 className="font-display text-2xl font-bold tracking-tighter mb-3">{p.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">{p.description}</p>
                  {unlocked[p.id] ? (
                    <a
                      href={unlocked[p.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`whitepaper-download-link-${p.id}`}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3.5 rounded-full transition-colors w-fit"
                    >
                      <Download size={16} /> Download PDF
                    </a>
                  ) : (
                    <button
                      data-testid={`whitepaper-unlock-button-${p.id}`}
                      onClick={() => setGating(p)}
                      className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-vermilion hover:text-white font-semibold px-6 py-3.5 rounded-full transition-colors w-fit"
                    >
                      Unlock Free Copy <ArrowUpRight size={16} />
                    </button>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {gating && <GateModal paper={gating} onClose={() => setGating(null)} onUnlock={(url) => { setUnlocked((u) => ({ ...u, [gating.id]: url })); setGating(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function GateModal({ paper, onClose, onUnlock }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/whitepaper-download", { whitepaper_id: paper.id, name, email });
      toast.success("Unlocked — the download link is also on its way to your inbox.");
      onUnlock(res.data.download_url);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      data-testid="whitepaper-gate-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background/85 backdrop-blur-md flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-2">Free Download</p>
            <h3 className="font-display text-2xl font-bold tracking-tighter">{paper.title}</h3>
          </div>
          <button type="button" data-testid="gate-close-button" onClick={onClose} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
        </div>
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">Name</label>
        <input
          data-testid="gate-name-input"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors mb-4"
        />
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">Work email</label>
        <input
          data-testid="gate-email-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors mb-6"
        />
        <button
          data-testid="gate-submit-button"
          type="submit"
          disabled={loading}
          className="w-full bg-vermilion hover:bg-vermilion-hover text-white font-semibold py-3.5 rounded-full transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Unlock the Report</>}
        </button>
        <p className="text-xs text-muted-foreground mt-4 text-center">You'll also join The Signal — one email a month. Unsubscribe anytime.</p>
      </motion.form>
    </motion.div>
  );
}
