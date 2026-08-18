import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

export default function Work() {
  const { data: studies = [], isLoading } = useQuery({
    queryKey: ["case-studies"],
    queryFn: async () => (await api.get("/case-studies")).data,
  });

  return (
    <div data-testid="work-page" className="pt-32 sm:pt-40 pb-24">
      <Seo title="Work & Case Studies" description="Case studies with measurable results: ROAS turnarounds, B2B pipeline engines and FMCG repositioning from MarKendrick." />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16 sm:mb-20">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">Selected Work</p>
          <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-7xl mb-6">Proof, not<br /><span className="text-vermilion">promises.</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg">Every engagement ends with a number. Here are the ones we're proudest of.</p>
        </Reveal>

        {isLoading ? (
          <div className="h-96 animate-pulse bg-card" />
        ) : (
          <div className="space-y-20">
            {studies.map((cs, i) => (
              <Reveal key={cs.slug}>
                <Link to={`/work/${cs.slug}`} data-testid={`work-card-${cs.slug}`} className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className={`lg:col-span-7 overflow-hidden ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={cs.cover} alt={`${cs.client} case study`} loading="lazy" className="w-full h-full object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700" />
                    </div>
                  </div>
                  <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                    <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-3">{cs.industry} - {cs.client}</p>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4 group-hover:text-vermilion transition-colors">{cs.title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">{cs.summary}</p>
                    <div className="flex flex-wrap gap-8">
                      {cs.results.map((r) => (
                        <div key={r.label}>
                          <p className="font-display text-3xl font-extrabold text-vermilion tracking-tight">{r.metric}</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[130px]">{r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
