import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import RichText from "../components/RichText";
import Seo from "../components/Seo";
import NotFound from "./NotFound";

export default function IndustryDetail() {
  const { slug } = useParams();
  const { data: ind, isLoading, isError } = useQuery({
    queryKey: ["industry", slug],
    queryFn: async () => (await api.get(`/industries/${slug}`)).data,
    retry: false,
  });
  const { data: allIndustries = [] } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => (await api.get("/industries")).data,
  });
  const { data: allServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });

  if (isLoading) return <div className="pt-40 pb-24 flex justify-center"><Loader2 className="animate-spin text-vermilion" size={28} /></div>;
  if (isError || !ind) return <NotFound />;

  const relatedServices = (ind.services || []).map((s) => allServices.find((x) => x.slug === s)).filter(Boolean);
  const others = allIndustries.filter((i) => i.slug !== slug).slice(0, 4);

  return (
    <div data-testid="industry-detail-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title={ind.metaTitle} description={ind.metaDesc} />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16">
          <Link to="/industries" data-testid="industry-back-link" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vermilion transition-colors mb-10">
            <ArrowLeft size={15} /> All Industries
          </Link>
          <p className="text-xs uppercase tracking-[0.35em] text-vermilion mb-4">Industry Playbook</p>
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl leading-[1.1] max-w-4xl mb-4">{ind.name}</h1>
          <p className="font-display text-xl sm:text-2xl text-muted-foreground tracking-tight mb-8">{ind.tagline}</p>
          <Link to={`/book-consultation`} data-testid="industry-book-button" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors">
            Book a Free Audit Call <ArrowUpRight size={18} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <Reveal className="lg:col-span-7">
            <RichText html={ind.intro} className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-10" />
            <h2 className="font-display text-2xl font-bold tracking-tight mb-6">Where growth usually gets stuck</h2>
            <ul className="space-y-4">
              {ind.challenges.map((c) => (
                <li key={c} className="flex items-start gap-3 text-foreground/85 border border-border p-5">
                  <X size={16} className="text-vermilion shrink-0 mt-1" />
                  <span className="text-sm sm:text-base leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="border border-border bg-card/40 p-8">
              <h2 className="font-display text-xl font-bold tracking-tight mb-6">The playbook we run</h2>
              <ul className="space-y-3">
                {relatedServices.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/services/${s.slug}`} data-testid={`industry-service-${s.slug}`} className="group flex items-center justify-between border-b border-border pb-3 hover:border-vermilion transition-colors">
                      <span className="text-sm font-medium group-hover:text-vermilion transition-colors">{s.name}</span>
                      <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-vermilion transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="border-t border-border pt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">More playbooks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {others.map((o) => (
              <Link key={o.slug} to={`/industries/${o.slug}`} data-testid={`related-industry-${o.slug}`} className="group bg-background p-6 hover:bg-secondary/60 transition-colors">
                <h3 className="font-display font-bold tracking-tight group-hover:text-vermilion transition-colors mb-1">{o.name}</h3>
                <p className="text-xs text-muted-foreground">{o.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
