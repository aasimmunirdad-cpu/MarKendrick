import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

const CATEGORIES = ["All", "Strategy", "Research", "Trends", "Guides"];

export default function Insights() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data,
  });

  return (
    <div data-testid="insights-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Insights — Marketing Strategy, Research & Trends" description="Marketing insight from MarKendrick: consumer psychology, neuromarketing, performance media and brand science from Lahore to the world." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">The Insights Hub</p>
          <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-7xl mb-6">Thinking that<br /><span className="text-vermilion">travels.</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg mb-14">Field notes from research labs, media accounts and brand war rooms. No fluff — publishable evidence only.</p>
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-background h-72 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.05}>
                <Link to={`/insights/${p.slug}`} data-testid={`insight-post-${p.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden mb-6">
                    <img src={p.cover} alt={p.title} loading="lazy" className="w-full h-full object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-700" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">{p.category} · {p.read_time}</p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-3 group-hover:text-vermilion transition-colors">{p.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{p.excerpt}</p>
                  <span className="text-sm font-semibold inline-flex items-center gap-1.5 group-hover:text-vermilion group-hover:gap-3 transition-all">
                    Read <ArrowUpRight size={15} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="mt-20 border border-vermilion/40 bg-vermilion/5 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-2">Go Deeper</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">Free research reports.</h2>
            <p className="text-sm text-muted-foreground max-w-md">The Pakistan Consumer Report 2026, Neuromarketing at the Shelf, and the CMO's Diagnostic Toolkit — free with your email.</p>
          </div>
          <Link to="/whitepapers" data-testid="insights-whitepapers-link" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-7 py-3.5 rounded-full transition-colors shrink-0">
            Browse Whitepapers <ArrowUpRight size={16} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
