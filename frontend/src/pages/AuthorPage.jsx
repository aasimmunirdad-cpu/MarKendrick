import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";
import { AUTHORS } from "../data/content";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";
import NotFound from "./NotFound";

export default function AuthorPage() {
  const { slug } = useParams();
  const author = AUTHORS.find((a) => a.slug === slug);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data,
  });

  if (!author) return <NotFound />;
  const mine = posts.filter((p) => p.author === author.name);
  const TITLES = new Set(["dr", "mr", "mrs", "ms", "prof", "eng"]);
  const nameParts = author.name.split(" ").filter((w) => !TITLES.has(w.toLowerCase().replace(/\.$/, "")));
  const initials = ((nameParts[0]?.[0] || "") + (nameParts[nameParts.length - 1]?.[0] || "")).toUpperCase();
  const firstName = nameParts[0] || author.name.split(" ")[0];

  return (
    <div data-testid="author-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title={`${author.name} — ${author.role}`} description={author.bio} />
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16">
          <Link to="/insights" data-testid="author-back-link" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vermilion transition-colors mb-10">
            <ArrowLeft size={15} /> All Insights
          </Link>
          <div className="flex flex-col sm:flex-row items-start gap-8">
            <div className="w-24 h-24 rounded-full bg-vermilion text-white font-display font-extrabold text-2xl flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-2">{author.role}</p>
              <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl mb-4">{author.name}</h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">{author.bio}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-4">Focus: {author.focus}</p>
            </div>
          </div>
        </Reveal>

        <h2 className="font-display text-2xl font-bold tracking-tight mb-8 border-t border-border pt-12">
          Articles by {firstName} <span className="text-muted-foreground">({mine.length})</span>
        </h2>
        {isLoading ? (
          <div className="h-60 animate-pulse bg-card" />
        ) : mine.length === 0 ? (
          <p className="text-muted-foreground">No published articles yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {mine.map((p) => (
              <Link key={p.slug} to={`/insights/${p.slug}`} data-testid={`author-post-${p.slug}`} className="group bg-background p-8 hover:bg-secondary/60 transition-colors">
                <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">{p.category} · {p.read_time}</p>
                <h3 className="font-display text-xl font-bold tracking-tight mb-3 group-hover:text-vermilion transition-colors">{p.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.excerpt}</p>
                <span className="text-sm font-semibold inline-flex items-center gap-1.5 group-hover:text-vermilion transition-colors">Read <ArrowUpRight size={14} /></span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
