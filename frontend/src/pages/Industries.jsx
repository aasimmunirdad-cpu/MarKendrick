import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { INDUSTRIES_DETAILED } from "../data/pages";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

export default function Industries() {
  return (
    <div data-testid="industries-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Industries We Serve — Sector Playbooks" description="Marketing playbooks across every sector: real estate, education, fintech, e-commerce, healthcare, fashion, F&B, automotive, travel, tech, FMCG, events and NGOs." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">Industries We Serve</p>
          <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-7xl mb-6">Category-fluent.<br /><span className="text-vermilion">Never generic.</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg">Sector playbooks, each built from real category research. The same diagnostic method applies anywhere buyers decide.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {INDUSTRIES_DETAILED.map((ind, i) => (
            <Reveal key={ind.slug} delay={i * 0.03} className="bg-background">
              <Link
                to={`/industries/${ind.slug}`}
                data-testid={`industry-card-${ind.slug}`}
                className="group block h-full p-8 hover:bg-vermilion transition-colors duration-300"
              >
                <span className="text-xs font-bold tracking-widest text-muted-foreground group-hover:text-white/70 transition-colors">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-xl font-bold tracking-tight mt-4 mb-2 group-hover:text-white transition-colors">{ind.name}</h2>
                <p className="text-sm text-muted-foreground group-hover:text-white/85 transition-colors">{ind.tagline}</p>
                <ArrowUpRight size={18} className="mt-6 text-muted-foreground group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
