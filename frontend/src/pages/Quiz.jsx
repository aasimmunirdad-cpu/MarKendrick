import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, RotateCcw, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

const GOALS = [
  { id: "understand", label: "Understand my customers deeply", desc: "Research, insight and the 'why' behind buying", services: ["market-research", "consumer-behaviour-insights", "neuromarketing"] },
  { id: "brand", label: "Build a brand people remember", desc: "Positioning, identity and campaigns", services: ["branding-identity", "marketing-strategy-consulting", "advertising"] },
  { id: "leads", label: "Get more leads & sales now", desc: "Performance channels that pay back fast", services: ["performance-marketing", "sem-ppc", "social-media-marketing"] },
  { id: "decline", label: "Fix declining sales", desc: "Diagnose first, then recover", services: ["sales-decline-diagnosis", "marketing-analytics-reporting", "market-research"] },
  { id: "launch", label: "Launch something new", desc: "Go-to-market done right the first time", services: ["marketing-strategy-consulting", "branding-identity", "digital-marketing"] },
  { id: "retain", label: "Keep the customers I have", desc: "Retention, loyalty and lifetime value", services: ["email-marketing-automation", "ecommerce-marketing", "marketing-analytics-reporting"] },
];

const STAGES = [
  { id: "none", label: "No real marketing yet", note: "You need strategy before spend — a Diagnostic Audit is the safest first move." },
  { id: "stuck", label: "Marketing runs, but results disappoint", note: "Something in the system is broken — diagnose before you spend more." },
  { id: "scale", label: "Marketing works — time to scale", note: "You have proof; now add fuel with discipline." },
];

const BUDGETS = [
  { id: "audit", label: "Under PKR 150k / month", note: "Start with a one-time Diagnostic Audit (from PKR 60,000) — maximum clarity per rupee." },
  { id: "growth", label: "PKR 150k – 400k / month", note: "A Growth Retainer fits — research-led strategy plus execution, monthly." },
  { id: "scale", label: "PKR 400k+ / month", note: "Full-stack engagement: research, brand and performance under one senior team." },
];

const stepAnim = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export default function Quiz() {
  const { data: SERVICES = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });
  const { data: INDUSTRIES_DETAILED = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => (await api.get("/industries")).data,
  });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ industry: null, goal: null, stage: null, budget: null });

  const pick = (key, value) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(() => setStep((s) => s + 1), 220);
  };

  const done = step >= 4;

  const recommended = (() => {
    if (!done) return [];
    const goal = GOALS.find((g) => g.id === answers.goal);
    let slugs = [...(goal?.services || [])];
    if (answers.stage === "none") slugs = ["marketing-strategy-consulting", ...slugs];
    if (answers.stage === "stuck") slugs = ["sales-decline-diagnosis", ...slugs];
    const unique = [...new Set(slugs)].slice(0, 3);
    return unique.map((s) => SERVICES.find((x) => x.slug === s)).filter(Boolean);
  })();

  const industry = INDUSTRIES_DETAILED.find((i) => i.slug === answers.industry);
  const stage = STAGES.find((s) => s.id === answers.stage);
  const budget = BUDGETS.find((b) => b.id === answers.budget);

  return (
    <div data-testid="quiz-page" className="pt-32 sm:pt-40 pb-24 min-h-screen">
      <Seo title="Which Marketing Service Do You Need? — 2-Minute Quiz" description="Answer four questions and get a research-led recommendation: the right MarKendrick services and playbook for your business." />
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        {!done && (
          <Reveal className="mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">The 2-Minute Quiz</p>
            <h1 className="font-display font-extrabold tracking-tighter text-4xl sm:text-6xl">Which service<br /><span className="text-vermilion">do you need?</span></h1>
          </Reveal>
        )}

        {!done && (
          <div className="flex gap-2 mb-10" data-testid="quiz-progress">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 transition-colors duration-300 ${i <= step ? "bg-vermilion" : "bg-border"}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="q0" {...stepAnim}>
              <Q title="What kind of business are you?" sub="Your industry playbook waits at the end.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INDUSTRIES_DETAILED.map((i) => (
                    <Opt key={i.slug} testId={`quiz-industry-${i.slug}`} label={i.name} active={answers.industry === i.slug} onClick={() => pick("industry", i.slug)} />
                  ))}
                </div>
              </Q>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="q1" {...stepAnim}>
              <Q title="What's the #1 goal right now?" sub="Be honest — the one that keeps you up at night.">
                <div className="grid grid-cols-1 gap-3">
                  {GOALS.map((g) => (
                    <Opt key={g.id} testId={`quiz-goal-${g.id}`} label={g.label} desc={g.desc} active={answers.goal === g.id} onClick={() => pick("goal", g.id)} />
                  ))}
                </div>
              </Q>
              <Back onClick={() => setStep(0)} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="q2" {...stepAnim}>
              <Q title="Where are you starting from?" sub="No judgment — every starting point has a path.">
                <div className="grid grid-cols-1 gap-3">
                  {STAGES.map((s) => (
                    <Opt key={s.id} testId={`quiz-stage-${s.id}`} label={s.label} active={answers.stage === s.id} onClick={() => pick("stage", s.id)} />
                  ))}
                </div>
              </Q>
              <Back onClick={() => setStep(1)} />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="q3" {...stepAnim}>
              <Q title="What's the monthly budget?" sub="A rough range — it shapes the recommendation, not the price.">
                <div className="grid grid-cols-1 gap-3">
                  {BUDGETS.map((b) => (
                    <Opt key={b.id} testId={`quiz-budget-${b.id}`} label={b.label} active={answers.budget === b.id} onClick={() => pick("budget", b.id)} />
                  ))}
                </div>
              </Q>
              <Back onClick={() => setStep(2)} />
            </motion.div>
          )}
          {done && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} data-testid="quiz-result">
              <p className="text-xs uppercase tracking-[0.35em] text-vermilion mb-4">Your Recommendation</p>
              <h2 className="font-display font-extrabold tracking-tighter text-4xl sm:text-5xl mb-6">Start with a<br />Diagnostic Audit.</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-2xl">{stage?.note}</p>
              <p className="text-muted-foreground leading-relaxed mb-10 max-w-2xl">{budget?.note}</p>

              <h3 className="font-display text-xl font-bold tracking-tight mb-5">Then, your three priority services:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border mb-10">
                {recommended.map((s, i) => (
                  <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`quiz-result-service-${s.slug}`} className="group bg-background p-7 hover:bg-vermilion transition-colors duration-300">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground group-hover:text-white/70">0{i + 1}</span>
                    <h4 className="font-display text-lg font-bold tracking-tight mt-3 mb-2 group-hover:text-white transition-colors">{s.name}</h4>
                    <p className="text-xs text-muted-foreground group-hover:text-white/85 transition-colors line-clamp-3">{s.short}</p>
                  </Link>
                ))}
              </div>

              {industry && (
                <Link to={`/industries/${industry.slug}`} data-testid="quiz-result-industry" className="group flex items-center justify-between border border-border p-6 mb-10 hover:border-vermilion transition-colors">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-1">Your industry playbook</p>
                    <p className="font-display text-lg font-bold tracking-tight group-hover:text-vermilion transition-colors">{industry.name}</p>
                  </div>
                  <ArrowUpRight size={20} className="text-muted-foreground group-hover:text-vermilion transition-colors" />
                </Link>
              )}

              <div className="flex flex-wrap gap-4 items-center">
                <Link to="/book-consultation" data-testid="quiz-result-book-button" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors">
                  Book Your Free Audit Call <ArrowRight size={18} />
                </Link>
                <Link to="/maturity-quiz" data-testid="quiz-result-maturity-link" className="inline-flex items-center gap-2 border border-foreground/25 hover:border-vermilion hover:text-vermilion font-semibold px-8 py-4 rounded-full transition-colors">
                  Grade My Marketing A–F
                </Link>
                <button
                  data-testid="quiz-restart-button"
                  onClick={() => { setAnswers({ industry: null, goal: null, stage: null, budget: null }); setStep(0); }}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw size={15} /> Retake
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Q({ title, sub, children }) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-8">{sub}</p>
      {children}
    </div>
  );
}

function Opt({ label, desc, active, onClick, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`text-left border px-5 py-4 transition-all duration-200 ${active ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      {desc && <span className={`block text-xs mt-1 ${active ? "text-white/80" : "text-muted-foreground"}`}>{desc}</span>}
    </button>
  );
}

function Back({ onClick }) {
  return (
    <button type="button" data-testid="quiz-back-button" onClick={onClick} className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft size={15} /> Back
    </button>
  );
}
