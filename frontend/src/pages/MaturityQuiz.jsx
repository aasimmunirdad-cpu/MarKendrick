import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, RotateCcw, Loader2, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

const QUESTIONS = [
  { id: "research", pillar: "Customer Research", q: "Do you know exactly why customers choose you over competitors — from evidence, not opinion?", fix: "Run a proper insight study before your next campaign. Guessing is the most expensive strategy." },
  { id: "positioning", pillar: "Positioning", q: "Do you have a written positioning statement your whole team can recite?", fix: "Write positioning with a visible enemy: who you're for, what for, and why you win." },
  { id: "measurement", pillar: "Measurement", q: "Can you name the channel that produced your last 10 customers?", fix: "Fix attribution basics — clean tracking beats bigger budgets every time." },
  { id: "creative", pillar: "Creative Testing", q: "Do you test new ad creative every single month?", fix: "Creative is the new targeting. Build a monthly testing rhythm." },
  { id: "retention", pillar: "Retention", q: "Do you email or message your existing customer list at least monthly?", fix: "Your list is your cheapest growth channel. Build lifecycle flows." },
  { id: "brand", pillar: "Brand Consistency", q: "Does your brand look and sound identical everywhere customers meet it?", fix: "Codify identity into a brand book — consistency compounds memory." },
  { id: "alignment", pillar: "Sales–Marketing Alignment", q: "Do sales and marketing agree on what a 'qualified lead' actually is?", fix: "Define 'qualified' jointly, in writing. Pipeline trust starts there." },
  { id: "governance", pillar: "Decision Rhythm", q: "Do you review marketing results monthly and make decisions from them — not just look at dashboards?", fix: "Institute a monthly decision meeting: one metric review, three actions." },
];

const OPTIONS = [
  { label: "Yes, consistently", points: 2 },
  { label: "Somewhat / informally", points: 1 },
  { label: "Not really", points: 0 },
];

const gradeOf = (score) => {
  if (score >= 14) return { g: "A", verdict: "Elite. Your marketing runs on evidence — now scale it.", color: "text-emerald-500" };
  if (score >= 11) return { g: "B", verdict: "Strong foundations with a few expensive gaps.", color: "text-emerald-400" };
  if (score >= 8) return { g: "C", verdict: "Average — and leaking money in predictable places.", color: "text-amber-400" };
  if (score >= 5) return { g: "D", verdict: "Marketing by momentum. The leaks are costing you monthly.", color: "text-vermilion" };
  return { g: "F", verdict: "Marketing by guesswork. Every rupee of spend is a bet.", color: "text-vermilion" };
};

export default function MaturityQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [emailForm, setEmailForm] = useState({ name: "", email: "" });
  const [emailState, setEmailState] = useState("idle"); // idle | loading | done

  const done = step >= QUESTIONS.length;
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const grade = gradeOf(score);
  const weakest = QUESTIONS.filter((q) => (answers[q.id] ?? 0) < 2)
    .sort((a, b) => (answers[a.id] ?? 0) - (answers[b.id] ?? 0))
    .slice(0, 3);

  const pick = (qid, points) => {
    setAnswers((a) => ({ ...a, [qid]: points }));
    setTimeout(() => setStep((s) => s + 1), 200);
  };

  const sendReport = async (e) => {
    e.preventDefault();
    setEmailState("loading");
    try {
      await api.post("/maturity-report", {
        name: emailForm.name,
        email: emailForm.email,
        score,
        grade: grade.g,
        weakest: weakest.map((w) => `${w.pillar}: ${w.fix}`),
      });
      setEmailState("done");
      toast.success("Your full report is on its way.");
    } catch (err) {
      setEmailState("idle");
      toast.error(formatApiError(err));
    }
  };

  const stepAnim = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div data-testid="maturity-quiz-page" className="pt-32 sm:pt-40 pb-24 min-h-screen">
      <Seo title="Marketing Maturity Assessment — Grade A to F" description="Eight questions. One honest grade. Find out how mature your marketing really is — and get the fix-list by email." />
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        {!done && (
          <Reveal className="mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">The Maturity Assessment</p>
            <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl">How mature is<br /><span className="text-vermilion">your marketing?</span></h1>
            <p className="text-muted-foreground mt-4 max-w-xl">Eight brutally honest questions. Answer fast — first instinct is the true one.</p>
          </Reveal>
        )}

        {!done && (
          <div className="flex gap-2 mb-10" data-testid="maturity-progress">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 transition-colors duration-300 ${i < step ? "bg-vermilion" : "bg-border"}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!done && (
            <motion.div key={step} {...stepAnim}>
              <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">{String(step + 1).padStart(2, "0")} — {QUESTIONS[step].pillar}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-8 leading-snug">{QUESTIONS[step].q}</h2>
              <div className="grid grid-cols-1 gap-3">
                {OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    data-testid={`maturity-q${step}-${o.points}`}
                    onClick={() => pick(QUESTIONS[step].id, o.points)}
                    className={`text-left border px-6 py-4 text-sm font-semibold transition-all duration-200 ${answers[QUESTIONS[step].id] === o.points ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button data-testid="maturity-back-button" onClick={() => setStep((s) => s - 1)} className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft size={15} /> Back
                </button>
              )}
            </motion.div>
          )}

          {done && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} data-testid="maturity-result">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-border border border-border mb-10">
                <div className="lg:col-span-5 bg-background p-10 sm:p-14 text-center flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Your Grade</p>
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 14 }}
                    className={`font-display text-[9rem] leading-none font-extrabold tracking-tight ${grade.color}`}
                    data-testid="maturity-grade"
                  >
                    {grade.g}
                  </motion.p>
                  <p className="font-display text-2xl font-bold mt-2">{score}<span className="text-muted-foreground">/16</span></p>
                </div>
                <div className="lg:col-span-7 bg-background p-10 sm:p-14">
                  <p className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-8">{grade.verdict}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-4">Your three biggest opportunities</p>
                  <div className="space-y-4">
                    {weakest.length === 0 && <p className="text-muted-foreground">None — you're strong across the board.</p>}
                    {weakest.map((w, i) => (
                      <div key={w.id} className="border-l-2 border-vermilion pl-4">
                        <p className="font-semibold text-sm">{i + 1}. {w.pillar}</p>
                        <p className="text-sm text-muted-foreground mt-1">{w.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {emailState === "done" ? (
                <div className="border border-emerald-500/40 bg-emerald-500/5 p-8 mb-10 flex items-start gap-4" data-testid="maturity-report-sent">
                  <Check size={22} className="text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <p className="font-display font-bold tracking-tight mb-1">Full report sent.</p>
                    <p className="text-sm text-muted-foreground">Check {emailForm.email} — your grade, fix-list and next steps are there. Talk soon.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={sendReport} className="border border-vermilion/40 bg-vermilion/5 p-8 mb-10" data-testid="maturity-email-form">
                  <p className="font-display text-xl font-bold tracking-tight mb-2 flex items-center gap-2"><Mail size={19} className="text-vermilion" /> Get the full action plan</p>
                  <p className="text-sm text-muted-foreground mb-5">Your grade breakdown plus a prioritised fix-list — emailed instantly.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input data-testid="maturity-name-input" required placeholder="Name" value={emailForm.name} onChange={(e) => setEmailForm((f) => ({ ...f, name: e.target.value }))} className="flex-1 bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors" />
                    <input data-testid="maturity-email-input" required type="email" placeholder="Work email" value={emailForm.email} onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))} className="flex-1 bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors" />
                    <button data-testid="maturity-send-button" type="submit" disabled={emailState === "loading"} className="bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-7 py-3 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shrink-0">
                      {emailState === "loading" ? <Loader2 size={15} className="animate-spin" /> : "Email My Report"}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap items-center gap-5">
                <Link to="/book-consultation" data-testid="maturity-book-button" className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-vermilion hover:text-white font-semibold px-8 py-4 rounded-full transition-colors">
                  Discuss My Grade — Free Call <ArrowRight size={17} />
                </Link>
                <button data-testid="maturity-retake-button" onClick={() => { setAnswers({}); setStep(0); setEmailState("idle"); setEmailForm({ name: "", email: "" }); }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
