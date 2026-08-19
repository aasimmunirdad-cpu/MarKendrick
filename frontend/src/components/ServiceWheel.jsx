import { useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";

const WHEEL_TEXT =
  "MARKET RESEARCH • NEUROMARKETING • BRANDING • PERFORMANCE MARKETING • SEO • SOCIAL MEDIA • ";

// Short display labels for the wheel - the full CMS `name` is often too
// long to sit on a rotating ring, so we show a compact form here while
// every link still points at the real /services/:slug page. Any service
// not listed here (e.g. a brand new one added later) just falls back to
// its full name, so the wheel never breaks - it just runs a bit wider.
const SHORT_LABELS = {
  "consumer-behaviour-insights": "Consumer Behaviour",
  "marketing-strategy-consulting": "Marketing Strategy",
  "sales-decline-diagnosis": "Sales Decline Recovery",
  seo: "SEO",
  "sem-ppc": "SEM / PPC",
  "social-media-marketing": "Social Media",
  "email-marketing-automation": "Email Marketing",
  "marketing-analytics-reporting": "Analytics & Reporting",
  advertising: "Advertising",
};

// Three concentric rings, each spinning continuously (alternating
// direction) via the counter-rotation trick: a ring container animates a
// full spin, every item's inner wrapper animates the exact reverse over
// the same duration, so the label itself always stays upright while it
// orbits. Uses inline `animation` (not Tailwind's arbitrary-value classes,
// which can't be generated for dynamically-built strings - Tailwind's
// compiler only scans for literal class names in source).
const RINGS = [
  { radius: 82, duration: 55, reverse: false },
  { radius: 128, duration: 70, reverse: true },
  { radius: 176, duration: 85, reverse: false },
];

function WheelRing({ items, radius, duration, reverse, paused }) {
  const count = items.length;
  const playState = paused ? "paused" : "running";
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: `mk-wheel-spin ${duration}s linear infinite ${reverse ? "reverse" : "normal"}`,
        animationPlayState: playState,
        transformOrigin: "50% 50%",
      }}
    >
      {items.map((item, i) => {
        const angle = (360 / count) * i;
        return (
          <div
            key={item.slug}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `rotate(${angle}deg) translateX(${radius}px)` }}
          >
            <div
              style={{
                animation: `mk-wheel-spin ${duration}s linear infinite ${reverse ? "normal" : "reverse"}`,
                animationPlayState: playState,
                transformOrigin: "50% 50%",
              }}
            >
              <div style={{ transform: `translate(-50%, -50%) rotate(${-angle}deg)` }}>
                <Link
                  to={`/services/${item.slug}`}
                  data-testid={`service-wheel-service-${item.slug}`}
                  className="block whitespace-nowrap bg-coal border border-vermilion/40 text-white text-[10px] font-medium px-2.5 py-1 rounded-full hover:bg-vermilion hover:text-ink hover:border-vermilion transition-colors duration-150"
                >
                  {item.label}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Radial "service wheel" nav trigger. Idle state is a small orbiting-text
 * dot; hovering/focusing it opens a wheel with all services already
 * visible and continuously orbiting across three rings (no click-to-reveal
 * step). Hovering the open panel pauses the motion so a service is easy
 * to click; every link goes straight to /services/:slug.
 */
export default function ServiceWheel({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const closeTimer = useRef(null);

  const { data: SERVICES = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });

  const rings = useMemo(() => {
    if (!SERVICES.length) return [];
    const withLabels = SERVICES.map((s) => ({
      slug: s.slug,
      label: SHORT_LABELS[s.slug] || s.name,
    }));
    const sorted = [...withLabels].sort((a, b) => a.label.length - b.label.length);
    const n = sorted.length;
    const chunk = Math.ceil(n / 3);
    const buckets = [sorted.slice(0, chunk), sorted.slice(chunk, chunk * 2), sorted.slice(chunk * 2)];
    return RINGS.map((cfg, i) => ({ ...cfg, items: buckets[i] })).filter((r) => r.items.length);
  }, [SERVICES]);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleOpen = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  if (!rings.length) {
    return (
      <Link
        to="/services"
        data-testid="nav-service-wheel"
        aria-label="Explore our services"
        title="Explore our services"
        className={`relative hidden md:flex items-center justify-center w-11 h-11 shrink-0 ${className}`}
      >
        <span className="w-[7px] h-[7px] rounded-full bg-vermilion" />
      </Link>
    );
  }

  return (
    <div
      className={`relative hidden md:flex items-center justify-center ${className}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        data-testid="nav-service-wheel"
        aria-label="Explore all services"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => (open ? handleClose() : handleOpen())}
        className="relative flex items-center justify-center w-11 h-11 shrink-0"
      >
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 animate-[spin_16s_linear_infinite] ${
            open ? "opacity-0" : "opacity-100"
          }`}
        >
          <defs>
            <path id="wheelCircleNav" d="M 50,50 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0" />
          </defs>
          <text className="fill-vermilion" style={{ fontSize: "7.6px", letterSpacing: "0.4px", fontWeight: 700 }}>
            <textPath href="#wheelCircleNav" startOffset="0%">
              {WHEEL_TEXT}
            </textPath>
          </text>
        </svg>
        <span
          className={`w-[7px] h-[7px] rounded-full bg-vermilion transition-transform duration-200 ${
            open ? "scale-150" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="service-wheel-panel"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-[-180px] mt-8 w-[440px] h-[440px] z-50 drop-shadow-2xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="absolute inset-0 rounded-full bg-ink border border-white/10" />

            {rings.map((ring, i) => (
              <WheelRing
                key={i}
                items={ring.items}
                radius={ring.radius}
                duration={ring.duration}
                reverse={ring.reverse}
                paused={paused}
              />
            ))}

            <Link
              to="/services"
              data-testid="service-wheel-hub"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[108px] h-[108px] rounded-full bg-coal border border-vermilion/35 flex flex-col items-center justify-center text-center hover:border-vermilion transition-colors duration-200"
            >
              <span className="text-vermilion font-bold" style={{ fontSize: "10px", letterSpacing: "0.15em" }}>
                SERVICES
              </span>
              <span className="text-white/50 mt-1" style={{ fontSize: "8px", letterSpacing: "0.08em" }}>
                VIEW ALL →
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
