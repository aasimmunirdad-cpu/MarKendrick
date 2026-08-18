import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Reveal } from "../components/motion";
import JsonLd from "../components/JsonLd";
import Seo from "../components/Seo";

export default function Faq() {
  const { data: flatFaqs = [] } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => (await api.get("/faqs")).data,
  });

  const FAQS = [];
  flatFaqs.forEach((item) => {
    let g = FAQS.find((x) => x.group === item.group);
    if (!g) {
      g = { group: item.group, items: [] };
      FAQS.push(g);
    }
    g.items.push({ q: item.question, a: item.answer });
  });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.flatMap((g) =>
      g.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      }))
    ),
  };
  return (
    <div data-testid="faq-page" className="pt-32 sm:pt-40 pb-24">
      <JsonLd id="faq-schema" data={faqSchema} />
      <Seo title="FAQ — Questions About MarKendrick" description="What MarKendrick does, how we're different, pricing in Pakistan, the Diagnostic Audit, contracts and how to get started." />
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-16">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">FAQ</p>
          <h1 className="font-display font-extrabold tracking-tighter text-5xl sm:text-6xl mb-6">Honest answers,<br /><span className="text-vermilion">no agency-speak.</span></h1>
        </Reveal>

        {FAQS.map((group, gi) => (
          <Reveal key={group.group} className="mb-12">
            <h2 className="font-display text-sm font-bold tracking-[0.25em] uppercase text-vermilion mb-4">{String(gi + 1).padStart(2, "0")} — {group.group}</h2>
            <Accordion type="single" collapsible className="border-t border-border">
              {group.items.map((item, i) => (
                <AccordionItem key={i} value={`${gi}-${i}`} className="border-border">
                  <AccordionTrigger data-testid={`faq-question-${gi}-${i}`} className="text-left font-display text-lg font-bold tracking-tight hover:text-vermilion hover:no-underline py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-6">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        ))}

        <Reveal className="border border-border bg-card/40 p-10 mt-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tighter mb-4">Still have a question?</h2>
          <p className="text-muted-foreground mb-6">Book a free 20-minute call — we'll answer honestly, including if we're not the right fit.</p>
          <Link to="/book-consultation" data-testid="faq-book-button" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors">
            Book a Free Call <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
