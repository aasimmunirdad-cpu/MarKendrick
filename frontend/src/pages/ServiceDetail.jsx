import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import RichText from "../components/RichText";
import Seo from "../components/Seo";
import BreadcrumbSchema from "../components/BreadcrumbSchema";
import JsonLd from "../components/JsonLd";
import NotFound from "./NotFound";

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data: service, isLoading, isError } = useQuery({
    queryKey: ["service", slug],
    queryFn: async () => (await api.get(`/services/${slug}`)).data,
    retry: false,
  });
  const { data: allServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });

  if (isLoading) return <div className="pt-40 pb-24 flex justify-center"><Loader2 className="animate-spin text-vermilion" size={28} /></div>;
  if (isError || !service) return <NotFound />;

  const related = allServices.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <div data-testid="service-detail-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title={service.metaTitle} description={service.metaDesc} path={`/services/${service.slug}`} />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
      />
      <JsonLd
        id={`service-schema-${service.slug}`}
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.name,
          description: service.metaDesc || service.short,
          serviceType: service.name,
          url: `https://accurate-serenity-production.up.railway.app/services/${service.slug}`,
          provider: {
            "@type": "ProfessionalService",
            name: "MarKendrick",
            url: "https://accurate-serenity-production.up.railway.app/",
          },
          areaServed: ["Pakistan", "Middle East", "United Kingdom", "United States", "Europe"],
        }}
      />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16 sm:mb-24">
          <Link to="/services" data-testid="service-back-link" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vermilion transition-colors mb-10">
            <ArrowLeft size={15} /> All Services
          </Link>
          <p className="text-xs uppercase tracking-[0.35em] text-vermilion mb-4">{service.name}</p>
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl lg:text-7xl leading-[1.1] max-w-5xl mb-8">{service.hero}</h1>
          <Link
            to={`/book-consultation?service=${service.slug}`}
            data-testid="service-book-button"
            className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors duration-200"
          >
            Discuss {service.name} <ArrowUpRight size={18} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <div className="lg:col-span-7">
            <Reveal>
              <RichText html={service.body} className="text-base sm:text-lg text-foreground/90 leading-relaxed" />
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <div className="border border-border p-8 bg-card/40">
                <h2 className="font-display text-xl font-bold tracking-tight mb-6">What you get</h2>
                <ul className="space-y-4">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm">
                      <Check size={16} className="text-vermilion shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="border-t border-border pt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">Related capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {related.map((s) => (
              <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`related-service-${s.slug}`} className="group bg-background p-8 hover:bg-secondary/60 transition-colors">
                <h3 className="font-display text-lg font-bold tracking-tight group-hover:text-vermilion transition-colors mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{s.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
