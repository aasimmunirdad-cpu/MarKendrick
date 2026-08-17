import { motion } from "framer-motion";

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Reveal({ children, delay = 0, className = "", once = true }) {
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
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter leading-[1.05]">{title}</h2>
    </Reveal>
  );
}
