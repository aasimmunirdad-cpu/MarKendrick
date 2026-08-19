import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Reveal, SectionHeading } from "../components/motion";
import Seo from "../components/Seo";
import { useSiteSettings } from "../hooks/useSiteSettings";

const DIFFERENTIATORS = [
  {
    n: "01",
    title: "Diagnosis before delivery",
    text: "Every engagement opens with a research-led audit - consumer psychology, market data and competitor signal - before a single campaign is built.",
  },
  {
    n: "02",
    title: "One accountable team",
    text: "Market research, brand strategy, digital, media and performance marketing sit under one roof. No agency-of-agencies hand-offs, no diluted accountability.",
  },
  {
    n: "03",
    title: "Evidence, not templates",
    text: "Our methods draw on published research in neuromarketing and data- and AI-driven marketing strategy - not repurposed playbooks.",
  },
  {
    n: "04",
    title: "Measured on outcomes",
    text: "Revenue, pipeline and market share are the scoreboard. Reach and impressions are inputs, not results.",
  },
];

export default function About() {
  const settings = useSiteSettings();
  const { data: industries = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => (await api.get("/industries")).data,
  });
  return (
    <div data-testid="about-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="About MarKendrick - Full-Service Marketing & Media Agency" description="MarKendrick is a research-led, full-service marketing and media agency. Evidence-based strategy across market research, brand, digital, media and performance marketing." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-20">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">About MarKendrick</p>
          <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-7xl mb-6">Built on evidence.<br /><span className="text-vermilion">Measured by results.</span></h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            MarKendrick is a full-service marketing and media agency built on one premise: strategy should start with evidence, not opinion. Every engagement runs through a diagnostic process rooted in consumer psychology and data before any campaign work begins - a discipline shaped by over a decade of published research in neuromarketing, digital and AI-driven marketing strategy.
            We operate across market research, brand strategy, digital, media and performance marketing - one accountable team, start to finish.
          </p>
        </Reveal>

        <Reveal className="mb-24">
          <div className="aspect-[21/9] overflow-hidden">
            <img src={settings.about_office_photo_url} alt="Inside MarKendrick's Lahore studio" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">The strategy floor, MarKendrick studio, Lahore.</p>
        </Reveal>

        <Reveal className="mb-24">
          <div className="border border-border">
            <video
              data-testid="studio-video"
              src={settings.studio_video_url}
              poster={settings.about_office_photo_url}
              preload="metadata"
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-video object-cover"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Inside the studio - a working session with a client growth team.</p>
        </Reveal>

        <section className="mb-24">
          <SectionHeading index="01" eyebrow="Why MarKendrick" title="What makes the work different." className="mb-14" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.n} data-testid={`differentiator-${d.n}`} className="bg-background p-8 hover:bg-card transition-colors duration-300">
                <span className="font-display text-3xl font-extrabold text-vermilion tracking-tight mb-4 block">{d.n}</span>
                <h3 className="font-display text-lg font-bold tracking-tight mb-3">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <SectionHeading index="02" eyebrow="Industries We Serve" title="Category-fluent, not category-blind." className="mb-14" />
          <div className="flex flex-wrap gap-3">
            {industries.map((ind) => (
              <span key={ind.slug} data-testid={`industry-chip-${ind.slug}`} className="border border-border rounded-full px-5 py-2.5 text-sm hover:border-vermilion hover:text-vermilion transition-colors cursor-default">
                {ind.name}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-16 text-center border border-border p-10 sm:p-16">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Ready When You Are</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-6">Let's put your strategy<br />through a diagnostic.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Book a consultation and we'll show you exactly where your marketing has room to perform harder.
          </p>
          <Link
            to="/book-consultation"
            data-testid="about-book-consultation-button"
            className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors"
          >
            Book a Consultation <ArrowUpRight size={18} />
          </Link>
        </section>

        <section id="careers" className="border border-border bg-card/40 p-10 sm:p-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-4">Careers</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-6">Do the best work<br />of your life here.</h2>
            <p className="text-muted-foreground max-w-xl mb-8 leading-relaxed">
              We're hiring strategists, performance specialists and researchers who'd rather be proven right than sound smart. Karachi, Lahore or remote - the work matters more than the postcode.
            </p>
            <a
              href={`mailto:careers@markendrick.co?subject=${encodeURIComponent("Careers - MarKendrick")}`}
              data-testid="careers-apply-button"
              className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              Send Your Portfolio <ArrowUpRight size={18} />
            </a>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
