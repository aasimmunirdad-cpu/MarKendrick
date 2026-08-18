import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

const successAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export default function ShareTestimonial() {
  const [form, setForm] = useState({ name: "", role: "", company: "", quote: "", metric: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const payload = { ...form };
      if (!payload.email) delete payload.email;
      await api.post("/testimonials/submit", payload);
      setStatus("done");
      toast.success("Thank you — your testimonial has been submitted.");
    } catch (err) {
      setStatus("idle");
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="share-testimonial-page" className="pt-32 sm:pt-40 pb-24">
      <Seo
        title="Share Your Experience"
        description="Worked with MarKendrick? Tell us how it went — your testimonial helps other brands decide with confidence."
      />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">Client Voices</p>
            <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-6xl mb-6">
              Tell us how<br /><span className="text-vermilion">it went.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
              Worked with us on a project? A few honest sentences help other brands decide with confidence —
              and help us know what's actually working. We read every one.
            </p>
            <div className="text-sm text-muted-foreground border-t border-border pt-8 space-y-3 max-w-md">
              <p>Submissions are reviewed before publishing — nothing goes live automatically.</p>
              <p>Sharing your email is optional. It's only used if we want to follow up, and is never published.</p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <div className="border border-border bg-card/40 p-8 sm:p-12 min-h-[480px] flex flex-col" data-testid="share-testimonial-form-card">
              {status === "done" ? (
                <motion.div {...successAnim} className="flex-1 flex flex-col items-start justify-center" data-testid="share-testimonial-success">
                  <div className="w-14 h-14 rounded-full bg-vermilion text-white flex items-center justify-center mb-6">
                    <Check size={26} />
                  </div>
                  <h2 className="font-display text-3xl font-bold tracking-tight mb-3">Thank you.</h2>
                  <p className="text-muted-foreground max-w-md">
                    Your testimonial is in for review. Once approved, it'll appear on our site — we appreciate you taking the time.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={submit} className="flex-1 flex flex-col">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Your experience</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Field testId="testimonial-name-input" label="Name *" value={form.name} onChange={(v) => set("name", v)} required />
                    <Field testId="testimonial-role-input" label="Role" value={form.role} onChange={(v) => set("role", v)} placeholder="e.g. Founder, Marketing Director" />
                    <Field testId="testimonial-company-input" label="Company" value={form.company} onChange={(v) => set("company", v)} className="sm:col-span-2" />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">Your testimonial *</label>
                    <textarea
                      data-testid="testimonial-quote-input"
                      required
                      minLength={20}
                      rows={5}
                      value={form.quote}
                      onChange={(e) => set("quote", e.target.value)}
                      placeholder="What changed after working with MarKendrick? Be as specific as you like."
                      className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <Field
                      testId="testimonial-metric-input"
                      label="A result you saw (optional)"
                      value={form.metric}
                      onChange={(v) => set("metric", v)}
                      placeholder="e.g. +40% conversions"
                    />
                    <Field
                      testId="testimonial-email-input"
                      label="Email (optional, not published)"
                      type="email"
                      value={form.email}
                      onChange={(v) => set("email", v)}
                    />
                  </div>
                  <div className="flex items-center justify-end mt-auto pt-4">
                    <button
                      type="submit"
                      data-testid="testimonial-submit-button"
                      disabled={!form.name || form.quote.trim().length < 20 || status === "loading"}
                      className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-3.5 rounded-full transition-colors disabled:opacity-50"
                    >
                      {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <>Submit Testimonial <ArrowRight size={16} /></>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", testId, className = "", placeholder = "", required = false }) {
  return (
    <div className={className}>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">{label}</label>
      <input
        data-testid={testId}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors"
      />
    </div>
  );
}
