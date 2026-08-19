import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal, SectionHeading } from "../components/motion";
import Seo from "../components/Seo";
import BreadcrumbSchema from "../components/BreadcrumbSchema";

const PROCESS = [
  {
    n: "01",
    phase: "Days 1-2",
    title: "Diagnostic Audit",
    text: "Before we propose anything, we audit your positioning, funnel and buyer behaviour against real data - not a template checklist. You get a one-page recommendation memo, not a 60-slide deck. This is a paid, scoped engagement, so there's no pressure to say yes to a retainer just to see what we'd actually do.",
  },
  {
    n: "02",
    phase: "Days 3-14",
    title: "Strategy & Proposal",
    text: "Based on the audit, we present a strategy built around your actual constraints - budget, team, timeline - with clear KPIs and a reporting cadence agreed upfront. This is where misalignment gets caught early, before either side has committed to anything long-term.",
  },
  {
    n: "03",
    phase: "Days 14-30",
    title: "Onboarding",
    text: "We request access to what we need - ad accounts, analytics, CRM, brand assets - within 48 hours of sign-off, and run a baseline audit before touching a single campaign. You'll meet the actual people working your account in week one, not after the contract's signed.",
  },
  {
    n: "04",
    phase: "Day 30 onward",
    title: "Active Delivery & Reporting",
    text: "Weekly check-ins, a monthly strategic review, and a quarterly planning session - each with a documented agenda, not a status call that could've been an email. By day 90 you get a full performance report and a revised roadmap based on what the data actually showed, not what the original plan assumed.",
  },
];

const STAFFING = [
  "A senior strategist owns your account end to end - the person in your kickoff call is the person reading your data every week, not a rotating account manager.",
  "We tell you upfront who's doing what: which strategist, which specialist, and how many other accounts they're running alongside yours.",
  "Research, brand, digital, media and performance sit under one roof - no handing your account between three separate vendors who never talk to each other.",
];

const REPORTING = [
  "Direct access to the platforms and dashboards we use - GA4, ad accounts, live reporting - not a static PDF once a month.",
  "We say when something isn't working. A channel that's underperforming gets flagged in the next check-in, not buried until the quarterly review.",
  "Every recommendation traces back to a number. If we can't show you the data behind a suggestion, we don't make it.",
];

const CONTENT_APPROACH = [
  "Strategy, positioning and research are led by senior human strategists - always. That doesn't change.",
  "AI tools support research synthesis, first drafts and production speed on high-volume content; every piece is reviewed and edited by a strategist before it reaches you.",
  "If a deliverable used AI assistance in a meaningful way, we'll tell you - it's not something we hide either direction.",
];

const TERMS = [
  "Engagements start with the scoped Diagnostic Audit, not a long-term contract signed on a first call.",
  "After the audit, terms are set out plainly in the proposal - no auto-renewing lock-ins buried in an annex.",
  "We'd rather earn a renewal every quarter than rely on a contract clause to keep a client who wants to leave.",
];

export default function HowWeWork() {
  return (
    <div data-testid="how-we-work-page" className="pt-32 sm:pt-40 pb-24">
      <Seo
        title="How We Work"
        description="From Diagnostic Audit to quarterly review: how MarKendrick actually runs an engagement - staffing, reporting cadence, AI-in-content policy and contract terms, laid out plainly."
        path="/how-we-work"
      />
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "How We Work", path: "/how-we-work" }]} />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-20">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">How We Work</p>
          <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-7xl mb-6">
            No mystery.<br /><span className="text-vermilion">No black box.</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Most agency evaluations stall on the same unanswered questions: who actually works my account, how often do I hear from them, is the content AI-written, and what happens if I want to leave. Here are straight answers to all four, before you ever get on a call with us.
          </p>
        </Reveal>

        <section className="mb-24">
          <SectionHeading index="01" eyebrow="The Process" title="What the first 90 days look like." className="mb-14" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-border border border-border">
            {PROCESS.map((p) => (
              <div key={p.n} data-testid={`process-step-${p.n}`} className="bg-background p-8 hover:bg-card transition-colors duration-300">
                <span className="font-display text-3xl font-extrabold text-vermilion tracking-tight mb-2 block">{p.n}</span>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{p.phase}</p>
                <h3 className="font-display text-lg font-bold tracking-tight mb-3">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <section>
            <SectionHeading index="02" eyebrow="Staffing" title="Who actually works your account." className="mb-10" />
            <ul className="space-y-4">
              {STAFFING.map((item) => (
                <li key={item} className="flex items-start gap-3 border border-border p-5">
                  <Check size={16} className="text-vermilion shrink-0 mt-1" />
                  <span className="text-sm sm:text-base text-foreground/85 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading index="03" eyebrow="Reporting" title="Transparent, by default." className="mb-10" />
            <ul className="space-y-4">
              {REPORTING.map((item) => (
                <li key={item} className="flex items-start gap-3 border border-border p-5">
                  <Check size={16} className="text-vermilion shrink-0 mt-1" />
                  <span className="text-sm sm:text-base text-foreground/85 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading index="04" eyebrow="Content & AI" title="Human-led, AI-assisted." className="mb-10" />
            <ul className="space-y-4">
              {CONTENT_APPROACH.map((item) => (
                <li key={item} className="flex items-start gap-3 border border-border p-5">
                  <Check size={16} className="text-vermilion shrink-0 mt-1" />
                  <span className="text-sm sm:text-base text-foreground/85 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading index="05" eyebrow="Engagement Terms" title="No long lock-ins." className="mb-10" />
            <ul className="space-y-4">
              {TERMS.map((item) => (
                <li key={item} className="flex items-start gap-3 border border-border p-5">
                  <Check size={16} className="text-vermilion shrink-0 mt-1" />
                  <span className="text-sm sm:text-base text-foreground/85 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mb-16 text-center border border-border p-10 sm:p-16">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Ready When You Are</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-6">Start with the audit,<br />not a contract.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Book a free consultation and we'll walk you through what a Diagnostic Audit would actually look like for your business.
          </p>
          <Link
            to="/book-consultation"
            data-testid="how-we-work-book-consultation-button"
            className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors"
          >
            Book a Consultation <ArrowUpRight size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}
