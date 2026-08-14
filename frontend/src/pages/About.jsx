import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { TEAM, INDUSTRIES, OFFICE } from "../data/content";
import { Reveal, SectionHeading } from "../components/motion";
import Seo from "../components/Seo";

const TEAM_IMG = "https://customer-assets-eiarnc6j.emergentagent.net/job_insights-perform/artifacts/bce0bppp_Team_working_in_marketing_agency_202608090142.webp";
const STUDIO_VIDEO = "/media/studio-session.mp4";

export default function About() {
  return (
    <div data-testid="about-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="About — Rooted in Lahore, Built for the World" description="MarKendrick blends Welsh insight heritage with Lahore energy. Meet the team and the story behind the name." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-20">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">About MarKendrick</p>
          <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-7xl mb-6">Welsh rigour.<br /><span className="text-vermilion">Lahore fire.</span></h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            The name is a collision: <strong className="text-foreground">Mar</strong> — from the Welsh <em>màr</em>, boundary lines drawn with intent — and <strong className="text-foreground">Kendrick</strong>, the Welsh name of our co-founder's grandfather, a market researcher in Cardiff who believed every number hides a human story.
            We carry both: the discipline of evidence and the courage of a boundary-pushing new agency in Lahore.
          </p>
        </Reveal>

        <Reveal className="mb-24">
          <div className="aspect-[21/9] overflow-hidden">
            <img src={TEAM_IMG} alt="MarKendrick team collaborating in our Lahore studio" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">The strategy floor, Gulberg III, Lahore.</p>
        </Reveal>

        <Reveal className="mb-24">
          <div className="border border-border">
            <video
              data-testid="studio-video"
              src={STUDIO_VIDEO}
              poster={TEAM_IMG}
              preload="metadata"
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-video object-cover"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Inside the studio — a working session with a client growth team.</p>
        </Reveal>

        <section className="mb-24">
          <SectionHeading index="01" eyebrow="Leadership" title="The people behind the work." className="mb-14" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {TEAM.map((t) => (
              <div key={t.name} data-testid={`team-member-${t.initial.toLowerCase()}`} className="bg-background p-8 group hover:bg-card transition-colors duration-300">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-6 ring-2 ring-vermilion/40 group-hover:ring-vermilion group-hover:scale-105 transition-all duration-300">
                  <img src={t.img} alt={`${t.name} — ${t.role} at MarKendrick`} loading="lazy" className="w-full h-full object-cover grayscale-[45%] group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight mb-1">{t.name}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-vermilion mb-4">{t.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <SectionHeading index="02" eyebrow="Industries We Serve" title="Category-fluent, not category-blind." className="mb-14" />
          <div className="flex flex-wrap gap-3">
            {INDUSTRIES.map((ind) => (
              <span key={ind} data-testid={`industry-chip-${ind.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="border border-border rounded-full px-5 py-2.5 text-sm hover:border-vermilion hover:text-vermilion transition-colors cursor-default">
                {ind}
              </span>
            ))}
          </div>
        </section>

        <section id="careers" className="border border-border bg-card/40 p-10 sm:p-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-4">Careers</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tighter mb-6">Do the best work<br />of your life here.</h2>
            <p className="text-muted-foreground max-w-xl mb-8 leading-relaxed">
              We're hiring strategists, performance specialists and researchers who'd rather be proven right than sound smart. Karachi, Lahore or remote — the work matters more than the postcode.
            </p>
            <a
              href={`mailto:careers@markendrick.co?subject=${encodeURIComponent("Careers — MarKendrick")}`}
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
