import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api, formatApiError } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";
import { useSiteSettings } from "../hooks/useSiteSettings";

const BUDGETS = ["Under $2,000 / mo", "$2,000 – $5,000 / mo", "$5,000 – $15,000 / mo", "$15,000+ / mo", "One-off project"];
const TIMELINES = ["ASAP", "Within 1 month", "1–3 months", "3–6 months", "Exploring options"];

const stepAnim = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export default function Contact() {
  const settings = useSiteSettings();
  const OFFICE = { address: settings.office_address, email: settings.office_email, hours: settings.office_hours };
  const { data: SERVICES = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ services: [], serviceOther: "", budget: "", timeline: "", name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState("idle");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleService = (name) =>
    setForm((f) => ({
      ...f,
      services: f.services.includes(name) ? f.services.filter((s) => s !== name) : [...f.services, name],
    }));

  const submit = async () => {
    setStatus("loading");
    try {
      const serviceParts = form.services.filter((s) => s !== "__other__");
      if (form.services.includes("__other__")) serviceParts.push(`Other${form.serviceOther.trim() ? `: ${form.serviceOther.trim()}` : ""}`);
      const { services, serviceOther, ...rest } = form;
      await api.post("/leads", { ...rest, service: serviceParts.join(", "), source: "contact" });
      setStatus("done");
      toast.success("Brief received. We'll reply within one business day.");
    } catch (err) {
      setStatus("idle");
      toast.error(formatApiError(err));
    }
  };

  const Option = ({ label, active, onClick, testId }) => (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`text-left border rounded-none px-5 py-4 text-sm font-medium transition-all duration-200 ${
        active ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-testid="contact-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Contact — Start a Project" description="Tell MarKendrick about your project. A senior consultant replies within one business day." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">Contact</p>
            <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-6xl mb-6">Tell us the<br /><span className="text-vermilion">real problem.</span></h1>
            <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
              Four quick questions and your brief lands with a senior consultant — never a bot, never a sales rep. Reply within one business day.
            </p>
            <address className="not-italic space-y-4 text-sm border-t border-border pt-8">
              <p><span className="text-muted-foreground block text-xs uppercase tracking-[0.25em] mb-1">Office</span>{OFFICE.address}</p>
              <p><span className="text-muted-foreground block text-xs uppercase tracking-[0.25em] mb-1">Email</span><a href={`mailto:${OFFICE.email}`} className="hover:text-vermilion transition-colors">{OFFICE.email}</a></p>
              <p><span className="text-muted-foreground block text-xs uppercase tracking-[0.25em] mb-1">Hours</span>{OFFICE.hours}</p>
            </address>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <div className="border border-border bg-card/40 p-8 sm:p-12 min-h-[480px] flex flex-col" data-testid="contact-form-card">
              {status === "done" ? (
                <motion.div {...stepAnim} className="flex-1 flex flex-col items-start justify-center" data-testid="contact-success">
                  <div className="w-14 h-14 rounded-full bg-vermilion text-white flex items-center justify-center mb-6"><Check size={26} /></div>
                  <h2 className="font-display text-3xl font-bold tracking-tighter mb-3">Brief received.</h2>
                  <p className="text-muted-foreground max-w-md">A senior consultant will reply to <strong className="text-foreground">{form.email}</strong> within one business day. Talk soon.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex gap-2 mb-10" data-testid="contact-step-indicator">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 transition-colors duration-300 ${i <= step ? "bg-vermilion" : "bg-border"}`} />
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="s0" {...stepAnim} className="flex-1 flex flex-col">
                        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">What do you need?</h2>
                        <p className="text-sm text-muted-foreground mb-6">Pick as many as apply.</p>
                        <div data-lenis-prevent className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-72 pr-1">
                          {SERVICES.map((s) => (
                            <Option key={s.slug} testId={`contact-service-${s.slug}`} label={s.name} active={form.services.includes(s.name)} onClick={() => toggleService(s.name)} />
                          ))}
                          <Option testId="contact-service-other" label="Other" active={!!form.serviceOther || form.services.includes("__other__")} onClick={() => toggleService("__other__")} />
                        </div>
                        {form.services.includes("__other__") && (
                          <input
                            data-testid="contact-service-other-input"
                            value={form.serviceOther}
                            onChange={(e) => set("serviceOther", e.target.value)}
                            placeholder="Tell us briefly what you need (optional)"
                            className="mt-3 w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors"
                          />
                        )}
                        <StepNav nextDisabled={form.services.length === 0} onNext={() => setStep(1)} step={step} />
                      </motion.div>
                    )}
                    {step === 1 && (
                      <motion.div key="s1" {...stepAnim} className="flex-1 flex flex-col">
                        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">What's the budget?</h2>
                        <p className="text-sm text-muted-foreground mb-6">A rough range is fine — it shapes the plan, not the price.</p>
                        <div className="grid grid-cols-1 gap-3">
                          {BUDGETS.map((b) => (
                            <Option key={b} testId={`contact-budget-${b.split(" ")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase()}`} label={b} active={form.budget === b} onClick={() => set("budget", b)} />
                          ))}
                        </div>
                        <StepNav nextDisabled={!form.budget} onNext={() => setStep(2)} onBack={() => setStep(0)} step={step} />
                      </motion.div>
                    )}
                    {step === 2 && (
                      <motion.div key="s2" {...stepAnim} className="flex-1 flex flex-col">
                        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">When do we start?</h2>
                        <p className="text-sm text-muted-foreground mb-6">Timelines change. Direction helps.</p>
                        <div className="grid grid-cols-1 gap-3">
                          {TIMELINES.map((t) => (
                            <Option key={t} testId={`contact-timeline-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} label={t} active={form.timeline === t} onClick={() => set("timeline", t)} />
                          ))}
                        </div>
                        <StepNav nextDisabled={!form.timeline} onNext={() => setStep(3)} onBack={() => setStep(1)} step={step} />
                      </motion.div>
                    )}
                    {step === 3 && (
                      <motion.div key="s3" {...stepAnim} className="flex-1 flex flex-col">
                        <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Finally — who are you?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field testId="contact-name-input" label="Name *" value={form.name} onChange={(v) => set("name", v)} />
                          <Field testId="contact-email-input" label="Work email *" type="email" value={form.email} onChange={(v) => set("email", v)} />
                          <Field testId="contact-company-input" label="Company" value={form.company} onChange={(v) => set("company", v)} className="sm:col-span-2" />
                          <div className="sm:col-span-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">The problem, in your words</label>
                            <textarea
                              data-testid="contact-message-input"
                              value={form.message}
                              onChange={(e) => set("message", e.target.value)}
                              rows={4}
                              className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-8">
                          <button type="button" data-testid="contact-back-button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft size={15} /> Back
                          </button>
                          <button
                            type="button"
                            data-testid="contact-submit-button"
                            disabled={!form.name || !form.email || status === "loading"}
                            onClick={submit}
                            className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-3.5 rounded-full transition-colors disabled:opacity-50"
                          >
                            {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <>Send the Brief <ArrowRight size={16} /></>}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", testId, className = "" }) {
  return (
    <div className={className}>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">{label}</label>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors"
      />
    </div>
  );
}

function StepNav({ onNext, onBack, nextDisabled, step }) {
  return (
    <div className="flex items-center justify-between mt-auto pt-8">
      {onBack ? (
        <button type="button" data-testid="contact-step-back" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
      ) : <span />}
      <button
        type="button"
        data-testid="contact-step-next"
        disabled={nextDisabled}
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-vermilion hover:text-white font-semibold px-8 py-3.5 rounded-full transition-colors disabled:opacity-40"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}
