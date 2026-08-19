import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Quote } from "lucide-react";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import RichText from "../components/RichText";
import Seo from "../components/Seo";
import BreadcrumbSchema from "../components/BreadcrumbSchema";
import JsonLd from "../components/JsonLd";

export default function CaseStudyDetail() {
  const { slug } = useParams();
  const { data: cs, isLoading, isError } = useQuery({
    queryKey: ["case-study", slug],
    queryFn: async () => (await api.get(`/case-studies/${slug}`)).data,
  });

  if (isLoading) return <div className="pt-40 pb-24 max-w-4xl mx-auto px-5"><div className="h-96 animate-pulse bg-card" /></div>;
  if (isError || !cs) {
    return (
      <div className="pt-40 pb-24 max-w-3xl mx-auto px-5 text-center">
        <h1 className="font-display text-4xl font-bold mb-4">Case study not found</h1>
        <Link to="/work" className="text-vermilion font-semibold">Back to Work</Link>
      </div>
    );
  }

  return (
    <article data-testid="case-study-detail-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title={`${cs.client} - ${cs.title}`} description={cs.summary} image={cs.cover} type="article" path={`/work/${slug}`} />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: cs.client, path: `/work/${slug}` },
        ]}
      />
      <JsonLd
        id={`case-study-schema-${slug}`}
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          headline: cs.title,
          about: cs.client,
          description: cs.summary,
          image: cs.cover,
          url: `https://accurate-serenity-production.up.railway.app/work/${slug}`,
          author: { "@type": "Organization", name: "MarKendrick" },
        }}
      />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal>
          <Link to="/work" data-testid="case-back-link" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vermilion transition-colors mb-10">
            <ArrowLeft size={15} /> All Work
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-4">{cs.industry} - {cs.client}</p>
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl leading-[1.1] max-w-4xl mb-8">{cs.title}</h1>
          <div className="flex flex-wrap gap-2 mb-12">
            {cs.services.map((s) => (
              <span key={s} className="text-xs border border-border rounded-full px-3 py-1.5 text-muted-foreground">{s}</span>
            ))}
          </div>
        </Reveal>

        {cs.cover && (
          <Reveal className="mb-16">
            <img src={cs.cover} alt={`${cs.client} case study`} className="w-full aspect-[21/9] object-cover" loading="lazy" />
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 border-y border-border py-12">
          {cs.results.map((r) => (
            <Reveal key={r.label}>
              <p className="font-display text-5xl font-extrabold text-vermilion tracking-tight mb-2">{r.metric}</p>
              <p className="text-sm text-muted-foreground">{r.label}</p>
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <h2 className="font-display text-2xl font-bold tracking-tight mb-4">The Challenge</h2>
            <RichText html={cs.challenge} className="text-foreground/85 leading-relaxed" />
          </div>
          <div className="lg:col-span-4">
            <h2 className="font-display text-2xl font-bold tracking-tight mb-4">The Approach</h2>
            <RichText html={cs.approach} className="text-foreground/85 leading-relaxed" />
          </div>
          {cs.quote && (
            <div className="lg:col-span-4 bg-card/40 border border-border p-8">
              <Quote size={24} className="text-vermilion mb-4" />
              <p className="text-lg leading-relaxed mb-4">"{cs.quote}"</p>
              <p className="text-sm text-muted-foreground">- {cs.quote_author}</p>
            </div>
          )}
        </div>

        <Reveal className="text-center border-t border-border pt-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-6">Want results like these?</h2>
          <Link to="/book-consultation" data-testid="case-cta-button" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors">
            Book a Consultation <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
