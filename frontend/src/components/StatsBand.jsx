import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export function Stat({ value, suffix, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} data-testid={`stat-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <p className="font-display text-5xl sm:text-6xl font-extrabold tracking-tighter">
        {display}<span className="text-vermilion">{suffix}</span>
      </p>
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">{label}</p>
    </div>
  );
}

export default function StatsBand({ items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-10"
    >
      {items.map((s) => <Stat key={s.label} {...s} />)}
    </motion.div>
  );
}
