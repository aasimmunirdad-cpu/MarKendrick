import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";

const CENTER = 200;
const HUB_R = 54;
const WEDGE_INNER_R = 58;
const WEDGE_OUTER_R = 140;
const BUBBLE_SPREAD = 300;
const WHEEL_TEXT =
  "MARKET RESEARCH • NEUROMARKETING • BRANDING • PERFORMANCE MARKETING • SEO • SOCIAL MEDIA • ";

function polar(angle, r) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function wedgePath(a0, a1, rIn, rOut) {
  const p1 = polar(a0, rOut);
  const p2 = polar(a1, rOut);
  const p3 = polar(a1, rIn);
  const p4 = polar(a0, rIn);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
}

/**
 * Radial "service wheel" nav trigger. Idle state is a small orbiting-text
 * dot (kept from the original design); hovering/focusing it opens a
 * three-slice wheel grouped by the live service categories from the CMS.
 * Hovering a slice fans that group's services out as a ring of clickable
 * pills that link straight to /services/:slug.
 */
export default function ServiceWheel({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const closeTimer = useRef(null);

  const { data: SERVICES = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
  });

  const groups = useMemo(() => {
    const map = new Map();
    SERVICES.forEach((s) => {
      const key = s.group || "Services";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    const names = Array.from(map.keys());
    const span = 360 / (names.length || 1);
    return names.map((name, i) => ({
      name,
      start: i * span,
      end: (i + 1) * span,
      services: map.get(name),
    }));
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
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setActiveGroup(null);
    }, 220);
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveGroup(null);
    }
  }, []);

  if (!groups.length) {
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

  const active = activeGroup !== null ? groups[activeGroup] : null;

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
        aria-label="Explore services by category"
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
            className="absolute top-full right-[-190px] mt-3 w-[460px] h-[460px] z-50"
          >
            <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible" aria-hidden="true">
              <circle cx={CENTER} cy={CENTER} r={HUB_R} fill="#141414" stroke="rgba(224,146,61,0.35)" strokeWidth="1" />
              <text
                x={CENTER}
                y={CENTER - 4}
                textAnchor="middle"
                className="fill-vermilion"
                style={{ fontSize: "10px", letterSpacing: "0.15em", fontWeight: 700 }}
              >
                SERVICES
              </text>
              <text
                x={CENTER}
                y={CENTER + 12}
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                style={{ fontSize: "8px", letterSpacing: "0.08em" }}
              >
                {active ? active.name.toUpperCase() : "HOVER A SLICE"}
              </text>
              {groups.map((g, gi) => {
                const mid = (g.start + g.end) / 2;
                const lp = polar(mid, 99);
                const words = g.name.split(" & ");
                const isActive = activeGroup === gi;
                return (
                  <g key={g.name}>
                    <path
                      data-testid={`service-wheel-group-${gi}`}
                      d={wedgePath(g.start, g.end, WEDGE_INNER_R, WEDGE_OUTER_R)}
                      fill={isActive ? "#E0923D" : "rgba(255,255,255,0.06)"}
                      stroke="#0A0A0A"
                      strokeWidth="2"
                      className="cursor-pointer transition-colors duration-200"
                      onMouseEnter={() => setActiveGroup(gi)}
                      onFocus={() => setActiveGroup(gi)}
                      tabIndex={0}
                    />
                    <text
                      x={lp.x}
                      y={lp.y}
                      textAnchor="middle"
                      fill={isActive ? "#0A0A0A" : "rgba(255,255,255,0.85)"}
                      style={{ fontSize: "10px", fontWeight: 600, pointerEvents: "none" }}
                    >
                      {words.map((w, i) => (
                        <tspan key={i} x={lp.x} dy={i === 0 ? 0 : 11}>
                          {w}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="absolute inset-0">
              <AnimatePresence>
                {active &&
                  active.services.map((s, i) => {
                    const count = active.services.length;
                    const mid = (active.start + active.end) / 2;
                    const startA = mid - BUBBLE_SPREAD / 2;
                    const angle = count > 1 ? startA + (BUBBLE_SPREAD / (count - 1)) * i : mid;
                    const r = count > 6 ? (i % 2 === 0 ? 176 : 206) : 185;
                    const p = polar(angle, r);
                    return (
                      <motion.div
                        key={s.slug}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.18, delay: i * 0.015 }}
                        style={{
                          position: "absolute",
                          left: `${(p.x / 400) * 100}%`,
                          top: `${(p.y / 400) * 100}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <Link
                          to={`/services/${s.slug}`}
                          data-testid={`service-wheel-service-${s.slug}`}
                          className="block whitespace-nowrap bg-coal border border-vermilion/40 text-white text-[10.5px] font-medium px-3 py-1.5 rounded-full hover:bg-vermilion hover:text-ink hover:border-vermilion transition-colors duration-150"
                        >
                          {s.name}
                        </Link>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>

            <Link
              to="/services"
              data-testid="service-wheel-view-all"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full text-[11px] font-medium text-muted-foreground hover:text-vermilion transition-colors pt-2"
            >
              View all services →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
