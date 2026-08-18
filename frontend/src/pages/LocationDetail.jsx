import { useParams, Link } from "react-router-dom";
import { ArrowUpRight, Check, MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import RichText from "../components/RichText";
import Seo from "../components/Seo";
import NotFound from "./NotFound";

export default function LocationDetail() {
  const { slug } = useParams();
  const { data: loc, isLoading, isError } = useQuery({
    queryKey: ["location", slug],
    queryFn: async () => (await api.get(`/locations/${slug}`)).data,
    retry: false,
  });
  const { data: allLocations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await api.get("/locations")).data,
  });

  if (isLoading) return <div className="pt-40 pb-24 flex justify-center"><Loader2 className="animate-spin text-vermilion" size={28} /></div>;
  if (isError || !loc) return <NotFound />;

  const others = allLocations.filter((l) => l.slug !== slug);

  return (
    <div data-testid="location-detail-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title={loc.metaTitle} description={loc.metaDesc} />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4 flex items-center gap-2"><MapPin size={14} className="text-vermilion" /> {loc.eyebrow}</p>
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl leading-[1.1] max-w-4xl mb-8">{loc.h1}</h1>
          <Link to="/book-consultation" data-testid="location-book-button" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors">
            Book a Free Consultation <ArrowUpRight size={18} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <Reveal className="lg:col-span-7">
            <RichText html={loc.intro} className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6" />
            <RichText html={loc.body2} className="text-base sm:text-lg text-foreground/90 leading-relaxed" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="border border-border bg-card/40 p-8">
              <h2 className="font-display text-xl font-bold tracking-tight mb-6">Why brands here choose us</h2>
              <ul className="space-y-4">
                {loc.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="text-vermilion shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="border-t border-border pt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">Where else we work</h2>
          <div className="flex flex-wrap gap-3">
            {others.map((o) => (
              <Link key={o.slug} to={`/locations/${o.slug}`} data-testid={`related-location-${o.slug}`} className="border border-border rounded-full px-5 py-2.5 text-sm hover:border-vermilion hover:text-vermilion transition-colors">
                {o.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
