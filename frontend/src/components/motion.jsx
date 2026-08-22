import { motion } from "framer-motion";

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * @param {boolean} [eager] - for content that's already in the initial
 *   viewport (page heroes). whileInView depends on an IntersectionObserver
 *   firing after layout, which stacks on top of the JS-bundle load/parse/
 *   hydrate time this app already pays before anything renders - a UX
 *   audit (22 Aug 2026) found hero content sitting at opacity:0 for that
 *   whole stretch. `eager` animates on mount instead of waiting for
 *   viewport intersection, so above-the-fold content is never held back by
 *   an observer that has nothing new to tell it. Below-the-fold content
 *   should stay on the default (non-eager) scroll-triggered reveal.
 */
export function Reveal({ children, delay = 0, className = "", once = true, eager = false }) {
  if (eager) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function MaskLines({ lines, className = "", lineClassName = "", as: Tag = "h1", delay = 0.15, stagger = 0.12 }) {
  const MotionTag = motion[Tag] || motion.h1;
  return (
    <MotionTag className={className}>
      {lines.map((line, i) => (
        <span className="mask-line" key={i}>
          <motion.span
            className={lineClassName}
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

export function SectionHeading({ index, eyebrow, title, className = "" }) {
  return (
    <Reveal className={className}>
      <div className="flex items-baseline gap-4 mb-4">
        {index && <span className="font-display text-vermilion text-sm font-bold tracking-widest">{index}</span>}
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</span>
      </div>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.12]">{title}</h2>
    </Reveal>
  );
}
