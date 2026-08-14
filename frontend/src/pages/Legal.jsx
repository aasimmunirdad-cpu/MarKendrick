import { useParams } from "react-router-dom";
import { LEGAL } from "../data/legal";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";
import NotFound from "./NotFound";

export default function Legal({ slugOverride }) {
  const { slug: paramSlug } = useParams();
  const slug = slugOverride || paramSlug;
  const doc = LEGAL[slug];
  if (!doc) return <NotFound />;

  return (
    <div data-testid={`legal-${slug}`} className="pt-32 sm:pt-40 pb-24">
      <Seo title={doc.title} description={doc.metaDesc} />
      <div className="max-w-[760px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">{doc.updated}</p>
          <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-6xl">{doc.title}</h1>
        </Reveal>
        {doc.sections.map((s) => (
          <Reveal key={s.h} className="mb-10">
            <h2 className="font-display text-xl font-bold tracking-tight mb-3">{s.h}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.p}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
