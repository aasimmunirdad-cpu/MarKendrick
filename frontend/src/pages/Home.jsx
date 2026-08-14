import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { SERVICES } from "../data/content";
import { MaskLines, Reveal, SectionHeading } from "../components/motion";
import NeuralCanvas from "../components/NeuralCanvas";
import StatsBand from "../components/StatsBand";
import Seo from "../components/Seo";

const MANIFESTO = [
  { n: "01", title: "Insight before instinct", text: "Every rupee of media, every line of copy, every pixel of design starts from evidence. We study how people actually decide — then build strategy on that truth." },
  { n: "02", title: "Science with soul", text: "Behavioural science, neuromarketing and hard data give us the map. Craft, taste and storytelling make the journey worth taking. You need both." },
  { n: "03", title: "Accountable to outcomes", text: "We report on revenue, pipeline and market share — never impressions dressed up as impact. If it doesn't move your business, we don't do it." },
  { n: "04", title: "Rooted in Lahore. Built for the world.", text: "Deep fluency in South Asian consumers, delivered with global-agency discipline. We serve brands across Pakistan, the Middle East, the UK and the US." },
];

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { data: caseStudies = [] } = useQuery({
    queryKey: ["case-studies"],
    queryFn: async () => (await api.get("/case-studies")).data,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data,
  });
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => (await api.get("/testimonials")).data,
  });

  return (
    <div data-testid="home-page">
      <Seo title="Global Marketing Agency in Lahore" description="MarKendrick is an insight-driven marketing agency rooted in Lahore, serving globally. Market research, neuromarketing, branding and performance marketing." />

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-end overflow-hidden" data-testid="hero-section">
        <motion.div style={{ y: imgY }} className="absolute inset-0 -z-10">
          <div className="absolute inset-0 h-[120%]"><NeuralCanvas /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        </motion.div>

        <motion.div style={{ y: textY, opacity: fade }} className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-24 pb-20 sm:pb-28 w-full">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-xs sm:text-sm uppercase tracking-[0.35em] text-muted-foreground mb-6"
          >
            A Global Insight-Driven Marketing Agency
          </motion.p>
          <MaskLines
            lines={["INSIGHTS", "THAT INFORM."]}
            className="font-display font-extrabold tracking-tighter leading-[0.95] text-[12.5vw] sm:text-[10vw] lg:text-[7.2vw]"
            delay={0.25}
          />
          <MaskLines
            lines={["STRATEGIES", "THAT PERFORM."]}
            className="font-display font-extrabold tracking-tighter leading-[0.95] text-[12.5vw] sm:text-[10vw] lg:text-[6.6vw] text-vermilion"
            delay={0.55}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          >
            <Link
              to="/book-consultation"
              data-testid="hero-book-consultation-button"
              className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full text-sm sm:text-base transition-colors duration-200"
            >
              Book a Consultation <ArrowUpRight size={18} />
            </Link>
            <Link
              to="/services"
              data-testid="hero-explore-services-button"
              className="inline-flex items-center gap-2 border border-foreground/25 hover:border-vermilion hover:text-vermilion font-semibold px-8 py-4 rounded-full text-sm sm:text-base transition-colors duration-200"
            >
              Explore 19 Services
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-6 right-6 sm:right-10 hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground"
        >
          Scroll <ArrowDown size={14} className="animate-bounce" />
        </motion.div>
      </section>

      {/* MARQUEE */}
      <section className="py-10 sm:py-14 border-y border-border overflow-hidden" data-testid="marquee-section">
        <Marquee speed={30} gradient={false}>
          {["Market Research", "Neuromarketing", "Branding", "Performance Marketing", "SEO", "Consumer Insight", "Advertising", "B2B Growth"].map((t) => (
            <span key={t} className="mx-8 font-display font-extrabold text-4xl sm:text-6xl tracking-tighter outline-text whitespace-nowrap">
              {t} <span className="text-vermilion" style={{ WebkitTextStroke: 0 }}>·</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* STATS BAND */}
      <section className="py-20 sm:py-28" data-testid="stats-band-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <StatsBand
            items={[
              { value: 19, suffix: "", label: "Marketing capabilities" },
              { value: 13, suffix: "", label: "Industry playbooks" },
              { value: 6, suffix: "", label: "Regions served" },
              { value: 24, suffix: "h", label: "Response time, max" },
            ]}
          />
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-24 sm:py-36" data-testid="manifesto-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <SectionHeading index="§" eyebrow="The Manifesto" title="Four beliefs. One agency." className="mb-16 sm:mb-24" />
          <div className="space-y-0">
            {MANIFESTO.map((m, i) => (
              <Reveal key={m.n} delay={i * 0.05}>
                <div
                  data-testid={`manifesto-chapter-${m.n}`}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-6 py-12 sm:py-16 border-t border-border ${i % 2 === 1 ? "" : ""}`}
                >
                  <div className="lg:col-span-2">
                    <span className="font-display text-5xl sm:text-7xl font-extrabold text-vermilion tracking-tighter">{m.n}</span>
                  </div>
                  <h3 className={`font-display text-2xl sm:text-4xl font-bold tracking-tighter lg:col-span-4 ${i % 2 === 1 ? "lg:order-3 lg:col-start-7" : ""}`}>
                    {m.title}
                  </h3>
                  <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed lg:col-span-5 lg:col-start-7 ${i % 2 === 1 ? "lg:order-2 lg:col-start-2" : ""}`}>
                    {m.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES INDEX */}
      <section className="py-24 sm:py-36 bg-card/40 border-y border-border" data-testid="services-preview-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <SectionHeading index="01" eyebrow="What We Do" title="19 capabilities. One growth engine." />
            <Link to="/services" data-testid="services-preview-all-link" className="inline-flex items-center gap-2 text-sm font-semibold text-vermilion hover:gap-3 transition-all shrink-0">
              All services <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {SERVICES.slice(0, 9).map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.04} className="bg-background">
                <Link
                  to={`/services/${s.slug}`}
                  data-testid={`service-card-${s.slug}`}
                  className="group block h-full p-8 hover:bg-vermilion transition-colors duration-300"
                >
                  <span className="text-xs font-bold tracking-widest text-muted-foreground group-hover:text-white/70 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl font-bold tracking-tight mt-4 mb-3 group-hover:text-white transition-colors">{s.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-white/85 transition-colors line-clamp-3">{s.short}</p>
                  <ArrowUpRight size={18} className="mt-6 text-muted-foreground group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES STRIP */}
      <section className="py-16 sm:py-20 border-b border-border overflow-hidden" data-testid="industries-strip-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 mb-8 flex items-end justify-between gap-6">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Who We Serve</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tighter">13 sector playbooks.</h2>
          </Reveal>
          <Link to="/industries" data-testid="industries-strip-all-link" className="inline-flex items-center gap-2 text-sm font-semibold text-vermilion hover:gap-3 transition-all shrink-0">
            All industries <ArrowUpRight size={16} />
          </Link>
        </div>
        <Marquee speed={25} gradient={false} pauseOnHover>
          {["Real Estate", "Education & EdTech", "Finance & Fintech", "E-commerce & D2C", "Healthcare & Pharma", "Textile & Fashion", "Food & Beverage", "Automotive", "Travel & Hospitality", "IT & Tech Startups", "FMCG & Consumer Goods", "Weddings & Events", "NGOs & Development"].map((t) => (
            <Link key={t} to="/industries" className="mx-6 font-display font-bold text-xl sm:text-2xl tracking-tighter text-muted-foreground/60 hover:text-vermilion transition-colors whitespace-nowrap">
              {t} <span className="text-vermilion">/</span>
            </Link>
          ))}
        </Marquee>
      </section>

      {/* CASE STUDIES */}
      <section className="py-24 sm:py-36" data-testid="case-studies-preview-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <SectionHeading index="02" eyebrow="Selected Work" title="Proof, not promises." />
            <Link to="/work" data-testid="work-preview-all-link" className="inline-flex items-center gap-2 text-sm font-semibold text-vermilion hover:gap-3 transition-all shrink-0">
              All case studies <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="space-y-16">
            {caseStudies.slice(0, 3).map((cs, i) => (
              <Reveal key={cs.slug} delay={0.05}>
                <Link to={`/work/${cs.slug}`} data-testid={`case-study-card-${cs.slug}`} className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className={`lg:col-span-7 overflow-hidden ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={cs.cover}
                        alt={`${cs.client} case study`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                      />
                    </div>
                  </div>
                  <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                    <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-3">{cs.industry} — {cs.client}</p>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tighter mb-4 group-hover:text-vermilion transition-colors">{cs.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{cs.summary}</p>
                    <div className="flex gap-8">
                      {cs.results.slice(0, 2).map((r) => (
                        <div key={r.label}>
                          <p className="font-display text-3xl sm:text-4xl font-extrabold text-vermilion tracking-tighter">{r.metric}</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[140px]">{r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-24 sm:py-36 border-t border-border" data-testid="testimonials-section">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
            <SectionHeading index="03" eyebrow="Client Voices" title="Trusted where it counts." className="mb-14" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
              {testimonials.slice(0, 3).map((t, i) => (
                <Reveal key={t.id || i} delay={i * 0.06} className="bg-background">
                  <figure className="p-8 sm:p-10 h-full flex flex-col" data-testid={`testimonial-card-${i}`}>
                    <span className="font-display text-6xl text-vermilion leading-none mb-6">"</span>
                    <blockquote className="text-base sm:text-lg leading-relaxed flex-1 mb-8">{t.quote}</blockquote>
                    {t.metric && (
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-vermilion mb-4 border border-vermilion/30 bg-vermilion/5 px-3 py-1.5 w-fit">{t.metric}</p>
                    )}
                    <figcaption>
                      <p className="font-display font-bold tracking-tight">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}{t.company ? `, ${t.company}` : ""}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SHOWREEL */}
      <section className="relative border-t border-border overflow-hidden" data-testid="showreel-section">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[80vh] w-full">
          <video
            src="/media/studio-session.mp4"
            poster="https://customer-assets-eiarnc6j.emergentagent.net/job_insights-perform/artifacts/bce0bppp_Team_working_in_marketing_agency_202608090142.webp"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-12">
            <div className="flex justify-between items-start">
              <p className="text-white/90 text-xs uppercase tracking-[0.35em] border border-white/30 px-4 py-2 backdrop-blur-sm">Showreel — Inside MarKendrick</p>
              <Link to="/about" className="hidden sm:inline-flex items-center gap-2 text-white/90 text-xs uppercase tracking-[0.25em] hover:text-vermilion transition-colors">
                Meet the team <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {[
                { metric: "+212%", label: "ROAS — Velora Beauty" },
                { metric: "3.4x", label: "Pipeline — NimbusPay" },
                { metric: "+61%", label: "Recall — Khaas Foods" },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                  className="bg-ink/60 backdrop-blur-md border border-white/15 px-5 py-4"
                >
                  <p className="font-display text-2xl sm:text-4xl font-extrabold text-vermilion tracking-tighter">{m.metric}</p>
                  <p className="text-white/70 text-xs mt-1">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INSIGHTS PREVIEW */}
      <section className="py-24 sm:py-36 bg-card/40 border-y border-border" data-testid="insights-preview-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <SectionHeading index="03" eyebrow="Insights" title="Thinking that travels." />
            <Link to="/insights" data-testid="insights-preview-all-link" className="inline-flex items-center gap-2 text-sm font-semibold text-vermilion hover:gap-3 transition-all shrink-0">
              All insights <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {posts.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                to={`/insights/${p.slug}`}
                data-testid={`insight-card-${p.slug}`}
                className="group bg-background p-8 flex flex-col hover:bg-secondary/60 transition-colors duration-300"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-4">{p.category} · {p.read_time}</p>
                <h3 className="font-display text-xl font-bold tracking-tight mb-3 group-hover:text-vermilion transition-colors flex-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 sm:py-44" data-testid="home-cta-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-6">Ready when you are</p>
            <h2 className="font-display font-extrabold tracking-tighter leading-[0.95] text-[11vw] sm:text-[7.5vw] mb-10">
              Let's make your<br />marketing <span className="text-vermilion">perform.</span>
            </h2>
            <Link
              to="/contact"
              data-testid="home-cta-contact-button"
              className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-10 py-5 rounded-full transition-colors duration-200"
            >
              Start the Conversation <ArrowUpRight size={20} />
            </Link>
            <Link
              to="/quiz"
              data-testid="home-cta-quiz-button"
              className="inline-flex items-center gap-2 border border-foreground/25 hover:border-vermilion hover:text-vermilion font-semibold px-10 py-5 rounded-full transition-colors duration-200 ml-4"
            >
              Take the 2-Minute Quiz
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
