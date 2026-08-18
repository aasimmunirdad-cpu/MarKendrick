import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api, formatApiError } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

const SLOTS = ["10:00", "11:30", "14:00", "15:30", "17:00"];

export default function BookConsultation() {
  const [params] = useSearchParams();
  const { data: SERVICES = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ service: "", serviceOther: "", date: "", slot: "", name: "", email: "", company: "", notes: "" });
  const [status, setStatus] = useState("idle");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.service && SERVICES.length) {
      const preService = SERVICES.find((s) => s.slug === params.get("service"));
      if (preService) set("service", preService.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SERVICES]);

  const days = useMemo(() => {
    const out = [];
    const d = new Date();
    while (out.length < 10) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        out.push({
          iso: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString("en-GB", { weekday: "short" }),
          day: d.getDate(),
          month: d.toLocaleDateString("en-GB", { month: "short" }),
        });
      }
    }
    return out;
  }, []);

  const submit = async () => {
    setStatus("loading");
    try {
      const service = form.service === "__other__" ? `Other${form.serviceOther.trim() ? `: ${form.serviceOther.trim()}` : ""}` : form.service;
      const { serviceOther, ...rest } = form;
      await api.post("/bookings", { ...rest, service });
      setStatus("done");
      toast.success("Consultation requested. Confirmation is on its way to your inbox.");
    } catch (err) {
      setStatus("idle");
      toast.error(formatApiError(err));
    }
  };

  const stepAnim = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div data-testid="book-consultation-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Book a Consultation" description="Book a free 30-minute strategy consultation with a senior MarKendrick consultant." />
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">Book a Consultation</p>
          <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-6xl mb-4">30 minutes.<br /><span className="text-vermilion">Zero pitch.</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg">A working session with a senior consultant. Bring your hardest problem; leave with at least one idea worth stealing.</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border border-border bg-card/40 p-8 sm:p-12 min-h-[460px] flex flex-col" data-testid="booking-card">
            {status === "done" ? (
              <motion.div {...stepAnim} className="flex-1 flex flex-col items-start justify-center" data-testid="booking-success">
                <div className="w-14 h-14 rounded-full bg-vermilion text-white flex items-center justify-center mb-6"><Check size={26} /></div>
                <h2 className="font-display text-3xl font-bold tracking-tight mb-3">You're in the calendar.</h2>
                <p className="text-muted-foreground max-w-md">
                  <strong className="text-foreground">{form.date} at {form.slot} PKT</strong> — a confirmation and video link are on their way to <strong className="text-foreground">{form.email}</strong>.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex gap-2 mb-10">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-1 flex-1 transition-colors duration-300 ${i <= step ? "bg-vermilion" : "bg-border"}`} />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="b0" {...stepAnim} className="flex-1 flex flex-col">
                      <h2 className="font-display text-2xl font-bold tracking-tight mb-6">What should we focus on?</h2>
                      <div data-lenis-prevent className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-72 pr-1">
                        {SERVICES.map((s) => (
                          <button
                            key={s.slug}
                            type="button"
                            data-testid={`booking-service-${s.slug}`}
                            onClick={() => set("service", s.name)}
                            className={`text-left border px-5 py-4 text-sm font-medium transition-all duration-200 ${form.service === s.name ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
                          >
                            {s.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          data-testid="booking-service-other"
                          onClick={() => set("service", "__other__")}
                          className={`text-left border px-5 py-4 text-sm font-medium transition-all duration-200 ${form.service === "__other__" ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
                        >
                          Other
                        </button>
                      </div>
                      {form.service === "__other__" && (
                        <input
                          data-testid="booking-service-other-input"
                          value={form.serviceOther}
                          onChange={(e) => set("serviceOther", e.target.value)}
                          placeholder="Tell us briefly what you need (optional)"
                          className="mt-3 w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors"
                        />
                      )}
                      <Nav onNext={() => setStep(1)} nextDisabled={!form.service} />
                    </motion.div>
                  )}
                  {step === 1 && (
                    <motion.div key="b1" {...stepAnim} className="flex-1 flex flex-col">
                      <h2 className="font-display text-2xl font-bold tracking-tight mb-2">Pick a day & time</h2>
                      <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2"><CalendarDays size={15} /> All times Pakistan (PKT)</p>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
                        {days.map((d) => (
                          <button
                            key={d.iso}
                            type="button"
                            data-testid={`booking-date-${d.iso}`}
                            onClick={() => set("date", d.iso)}
                            className={`border py-3 text-center transition-all duration-200 ${form.date === d.iso ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
                          >
                            <span className="block text-[10px] uppercase tracking-wider opacity-70">{d.label}</span>
                            <span className="block font-display font-bold">{d.day}</span>
                            <span className="block text-[10px] opacity-70">{d.month}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SLOTS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            data-testid={`booking-slot-${t.replace(":", "")}`}
                            onClick={() => set("slot", t)}
                            className={`border rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${form.slot === t ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <Nav onNext={() => setStep(2)} onBack={() => setStep(0)} nextDisabled={!form.date || !form.slot} />
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="b2" {...stepAnim} className="flex-1 flex flex-col">
                      <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Your details</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input testId="booking-name-input" label="Name *" value={form.name} onChange={(v) => set("name", v)} />
                        <Input testId="booking-email-input" label="Work email *" type="email" value={form.email} onChange={(v) => set("email", v)} />
                        <Input testId="booking-company-input" label="Company" value={form.company} onChange={(v) => set("company", v)} />
                        <Input testId="booking-notes-input" label="Anything we should prep for?" value={form.notes} onChange={(v) => set("notes", v)} />
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-8">
                        <button type="button" data-testid="booking-back-button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <ArrowLeft size={15} /> Back
                        </button>
                        <button
                          type="button"
                          data-testid="booking-submit-button"
                          disabled={!form.name || !form.email || status === "loading"}
                          onClick={submit}
                          className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-3.5 rounded-full transition-colors disabled:opacity-50"
                        >
                          {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <>Confirm Booking <ArrowRight size={16} /></>}
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
  );
}

function Input({ label, value, onChange, type = "text", testId }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">{label}</label>
      <input data-testid={testId} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors" />
    </div>
  );
}

function Nav({ onNext, onBack, nextDisabled }) {
  return (
    <div className="flex items-center justify-between mt-auto pt-8">
      {onBack ? (
        <button type="button" data-testid="booking-step-back" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
      ) : <span />}
      <button type="button" data-testid="booking-step-next" disabled={nextDisabled} onClick={onNext} className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-vermilion hover:text-white font-semibold px-8 py-3.5 rounded-full transition-colors disabled:opacity-40">
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}
