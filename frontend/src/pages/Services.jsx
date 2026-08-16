import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SERVICES, SERVICE_GROUPS } from "../data/content";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

export default function Services() {
  return (
    <div data-testid="services-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Marketing & Media Services — Full-Service Capabilities" description="From market research and neuromarketing to SEO, performance marketing, media and brand strategy — every capability under one insight-driven roof." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-20">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">The Services Hub</p>
          <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-7xl mb-6">Every capability.<br /><span className="text-vermilion">One engine.</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg">Every service begins with insight and ends with a number you can hold us to. Hire one, or run the full stack.</p>
          <Link to="/quiz" data-testid="services-quiz-banner" className="group mt-8 flex items-center justify-between border border-vermilion/40 bg-vermilion/5 p-6 max-w-xl hover:bg-vermilion/15 transition-colors">
            <div>
              <p className="font-display font-bold tracking-tight group-hover:text-vermilion transition-colors">Not sure where to start?</p>
              <p className="text-sm text-muted-foreground">Take the 2-minute quiz — get a research-led recommendation.</p>
            </div>
            <ArrowUpRight size={22} className="text-vermilion shrink-0" />
          </Link>
        </Reveal>

        {SERVICE_GROUPS.map((group, gi) => (
          <div key={group.label} className="mb-20">
            <Reveal className="flex items-baseline gap-4 mb-8 border-b border-border pb-4">
              <span className="font-display text-vermilion text-sm font-bold tracking-widest">{String(gi + 1).padStart(2, "0")}</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tighter">{group.label}</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              {group.slugs.map((slug) => {
                const s = SERVICES.find((x) => x.slug === slug);
                if (!s) return null;
                return (
                  <Link
                    key={slug}
                    to={`/services/${slug}`}
                    data-testid={`services-hub-${slug}`}
                    className="group bg-background p-8 sm:p-10 hover:bg-vermilion transition-colors duration-300"
                  >
                    <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-3 group-hover:text-white transition-colors">{s.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-white/85 transition-colors">{s.short}</p>
                    <ArrowUpRight size={18} className="mt-6 text-muted-foreground group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
