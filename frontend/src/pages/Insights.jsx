import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";
import CoverImage from "../components/CoverImage";

const CATEGORIES = ["All", "Strategy", "Research", "Trends", "Guides"];

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
}

export default function Insights() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "All";

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data,
  });

  const filtered = useMemo(
    () => (activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory)),
    [posts, activeCategory]
  );

  const latest = posts[0];

  const setCategory = (cat) => {
    if (cat === "All") setParams({});
    else setParams({ category: cat });
  };

  return (
    <div data-testid="insights-page" className="pt-32 sm:pt-40 pb-36">
      <Seo title="Insights - Marketing Strategy, Research & Trends" description="Marketing insight from MarKendrick: consumer psychology, neuromarketing, performance media and brand science from Lahore to the world." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-14 items-end">
          <Reveal eager className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.35em] text-vermilion font-semibold mb-4">The Insights Hub - Field Notes on Marketing That Works</p>
            <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-6xl leading-[1.04] mb-6">Thinking that<br /><span className="text-vermilion">travels.</span></h1>
            <p className="text-muted-foreground max-w-xl text-lg">Field notes from research labs, media accounts and brand war rooms — no fluff, only what we'd defend in a client review.</p>
          </Reveal>

          {latest && (
            <Reveal eager delay={0.1} className="lg:col-span-5">
              <Link to={`/insights/${latest.slug}`} data-testid="insights-hero-latest" className="group block border border-border bg-card/40 hover:border-vermilion/50 transition-colors p-6 sm:p-7">
                <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">Latest &middot; {latest.category}</p>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight leading-snug mb-3 group-hover:text-vermilion transition-colors">{latest.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 [overflow-wrap:normal] [word-break:normal]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{latest.excerpt}</p>
                <span className="text-sm font-semibold inline-flex items-center gap-1.5 group-hover:gap-3 transition-all">
                  Read the piece <ArrowUpRight size={15} />
                </span>
              </Link>
            </Reveal>
          )}
        </div>

        <Reveal className="mb-10">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter articles by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                data-testid={`insights-filter-${cat.toLowerCase()}`}
                onClick={() => setCategory(cat)}
                className={`text-xs uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-vermilion border-vermilion text-white"
                    : "border-border text-muted-foreground hover:border-vermilion hover:text-vermilion"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-background h-72 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center" data-testid="insights-empty-state">No articles in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.05}>
                <Link to={`/insights/${p.slug}`} data-testid={`insight-post-${p.slug}`} className="group flex flex-col h-full">
                  <CoverImage
                    src={p.cover}
                    alt={p.title}
                    className="aspect-[4/3] overflow-hidden mb-6"
                    imgClassName="w-full h-full object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-700"
                  />
                  <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">
                    {p.category} &middot; {formatDate(p.created_at)} &middot; {p.read_time}
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-3 group-hover:text-vermilion transition-colors">{p.title}</h2>
                  <p
                    className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 [overflow-wrap:normal] [word-break:normal]"
                    style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {p.excerpt}
                  </p>
                  <span className="text-sm font-semibold inline-flex items-center gap-1.5 group-hover:text-vermilion group-hover:gap-3 transition-all mt-auto">
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
            <p className="text-sm text-muted-foreground max-w-md">The Pakistan Consumer Report 2026, Neuromarketing at the Shelf, and the CMO's Diagnostic Toolkit - free with your email.</p>
          </div>
          <Link to="/whitepapers" data-testid="insights-whitepapers-link" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-7 py-3.5 rounded-full transition-colors shrink-0">
            Browse Whitepapers <ArrowUpRight size={16} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
