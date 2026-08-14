import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { SERVICES, OFFICE } from "../data/content";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await api.post("/newsletter", { email });
      setStatus("done");
      setEmail("");
      toast.success(res.data.status === "already_subscribed" ? "You're already on the list." : "Welcome to The Signal. Check your inbox.");
    } catch (err) {
      setStatus("idle");
      toast.error(formatApiError(err));
    }
  };

  return (
    <footer data-testid="site-footer" className="border-t border-border bg-card/40">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">The Signal — Monthly Briefing</p>
            <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter leading-tight mb-6">
              One email a month.<br />Zero fluff.
            </h3>
            <form onSubmit={subscribe} data-testid="newsletter-form" className="flex max-w-md border border-border rounded-full overflow-hidden focus-within:border-vermilion transition-colors">
              <input
                data-testid="newsletter-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 bg-transparent px-5 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                data-testid="newsletter-submit-button"
                type="submit"
                disabled={status === "loading"}
                className="bg-vermilion hover:bg-vermilion-hover text-white px-6 text-sm font-semibold transition-colors duration-200 disabled:opacity-60 flex items-center gap-2"
              >
                {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : status === "done" ? <Check size={16} /> : "Subscribe"}
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">Consumer psychology, performance media, brand science. Unsubscribe anytime.</p>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-5">Agency</p>
            <ul className="space-y-3 text-sm">
              {[["About", "/about"], ["Industries", "/industries"], ["Work", "/work"], ["Insights", "/insights"], ["Whitepapers", "/whitepapers"], ["ROI Calculator", "/roi-calculator"], ["Maturity Quiz", "/maturity-quiz"], ["FAQ", "/faq"], ["Take the Quiz", "/quiz"], ["Contact", "/contact"]].map(([label, to]) => (
                <li key={label}><Link to={to} className="hover:text-vermilion transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-5">Services</p>
            <ul className="space-y-3 text-sm grid grid-cols-1">
              {SERVICES.slice(0, 6).map((s) => (
                <li key={s.slug}><Link to={`/services/${s.slug}`} className="hover:text-vermilion transition-colors">{s.name}</Link></li>
              ))}
              <li><Link to="/services" className="text-vermilion font-medium inline-flex items-center gap-1">All 19 services <ArrowUpRight size={13} /></Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-5">Office</p>
            <address className="not-italic text-sm space-y-3 text-muted-foreground">
              <p>{OFFICE.address}</p>
              <p><a href={`mailto:${OFFICE.email}`} className="hover:text-vermilion transition-colors">{OFFICE.email}</a></p>
              <p>{OFFICE.hours}</p>
            </address>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-8 mb-4">Locations</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[["Lahore", "/locations/marketing-agency-lahore"], ["Pakistan", "/locations/marketing-agency-pakistan"], ["Middle East", "/locations/middle-east"], ["United Kingdom", "/locations/united-kingdom"], ["United States", "/locations/united-states"], ["Europe", "/locations/europe"]].map(([label, to]) => (
                <li key={label}><Link to={to} className="hover:text-vermilion transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border overflow-hidden select-none" aria-hidden="true">
          <p className="font-display font-extrabold tracking-tighter leading-none text-[13.5vw] outline-text whitespace-nowrap text-center -mb-[2vw]">MARKENDRICK</p>
        </div>

        <div className="py-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-display font-extrabold text-lg tracking-tighter">Mar<span className="text-vermilion">Kendrick</span></p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MarKendrick. Insights that Inform. Strategies that Perform.</p>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-vermilion transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-vermilion transition-colors">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-vermilion transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
