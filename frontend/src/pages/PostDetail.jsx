import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";
import { Reveal } from "../components/motion";
import ShareButtons from "../components/ShareButtons";
import RichText from "../components/RichText";
import { AUTHORS } from "../data/content";
import JsonLd from "../components/JsonLd";
import Seo from "../components/Seo";
import { motion, useScroll, useSpring } from "framer-motion";

export default function PostDetail() {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => (await api.get(`/posts/${slug}`)).data,
  });
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });

  if (isLoading) return <div className="pt-40 pb-24 max-w-3xl mx-auto px-5"><div className="h-96 animate-pulse bg-card" /></div>;
  if (isError || !post) {
    return (
      <div className="pt-40 pb-24 max-w-3xl mx-auto px-5 text-center" data-testid="post-not-found">
        <h1 className="font-display text-4xl font-bold mb-4">Article not found</h1>
        <Link to="/insights" className="text-vermilion font-semibold">Back to Insights</Link>
      </div>
    );
  }

  return (
    <article data-testid="post-detail-page" className="pt-32 sm:pt-40 pb-24">
      <motion.div data-testid="reading-progress" className="fixed top-0 left-0 right-0 h-[3px] bg-vermilion z-[55] origin-left" style={{ scaleX: progress }} />
      <JsonLd
        id="article-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          author: { "@type": "Person", name: post.author },
          publisher: { "@type": "Organization", name: "MarKendrick" },
          datePublished: post.created_at,
          image: post.cover,
        }}
      />
      <Seo title={post.title} description={post.excerpt} />
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <Link to="/insights" data-testid="post-back-link" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vermilion transition-colors mb-10">
            <ArrowLeft size={15} /> All Insights
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-vermilion mb-5">{post.category} · {post.read_time}</p>
          <h1 className="font-display font-extrabold tracking-tighter text-4xl sm:text-5xl leading-[1.05] mb-6">{post.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-10 border-b border-border">
            <p className="text-sm text-muted-foreground">
              By {(() => {
                const author = AUTHORS.find((a) => a.name === post.author);
                return author ? (
                  <Link to={`/insights/author/${author.slug}`} data-testid="post-author-link" className="text-foreground font-medium hover:text-vermilion transition-colors">{post.author}</Link>
                ) : (
                  <span className="text-foreground font-medium">{post.author}</span>
                );
              })()}
              {post.created_at && <> · {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>}
            </p>
            <ShareButtons title={post.title} />
          </div>
        </Reveal>
        {post.cover && (
          <Reveal className="mb-12">
            <img src={post.cover} alt={post.title} className="w-full aspect-[16/9] object-cover" loading="lazy" />
          </Reveal>
        )}
        <Reveal className="prose-custom">
          <RichText html={post.body} className="text-base sm:text-lg leading-relaxed text-foreground/90" />
        </Reveal>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
            {post.tags.map((t) => (
              <span key={t} className="text-xs border border-border rounded-full px-3 py-1.5 text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>

      {post.related?.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 mt-24">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">Keep reading</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
            {post.related.map((r) => (
              <Link key={r.slug} to={`/insights/${r.slug}`} data-testid={`related-post-${r.slug}`} className="group bg-background p-8 hover:bg-secondary/60 transition-colors">
                <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">{r.category}</p>
                <h3 className="font-display text-lg font-bold tracking-tight group-hover:text-vermilion transition-colors mb-4">{r.title}</h3>
                <span className="text-sm font-semibold inline-flex items-center gap-1.5">Read <ArrowUpRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
