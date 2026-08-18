import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Reveal } from "../components/motion";
import Seo from "../components/Seo";

const fmt = (n) => {
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(1)} Lac`;
  return `PKR ${Math.round(n).toLocaleString()}`;
};

function CountUp({ value }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = performance.now();
    const from = display;
    const dur = 800;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{fmt(display)}</span>;
}

const SCENARIOS = [
  { id: "conservative", label: "Conservative", uplift: 0.10, note: "Just fixing obvious leaks" },
  { id: "expected", label: "Expected", uplift: 0.25, note: "Diagnostic + one full campaign cycle" },
  { id: "stretch", label: "Stretch", uplift: 0.40, note: "Full research-led program, 6+ months" },
];

export default function RoiCalculator() {
  const [revenue, setRevenue] = useState(5_000_000);
  const [share, setShare] = useState(40);
  const [scenario, setScenario] = useState("expected");

  const result = useMemo(() => {
    const s = SCENARIOS.find((x) => x.id === scenario);
    const attributable = revenue * (share / 100);
    const monthlyGain = attributable * s.uplift;
    const annualGain = monthlyGain * 12;
    const auditCost = 60_000;
    const retainerCost = 250_000 * 3;
    return {
      monthlyGain,
      annualGain,
      auditPaybackDays: monthlyGain > 0 ? Math.ceil(auditCost / (monthlyGain / 30)) : 0,
      roiMultiple: retainerCost > 0 ? (monthlyGain * 3) / retainerCost : 0,
    };
  }, [revenue, share, scenario]);

  return (
    <div data-testid="roi-calculator-page" className="pt-32 sm:pt-40 pb-24 min-h-screen">
      <Seo title="Marketing ROI Calculator" description="What could fixing your marketing bottleneck be worth? Estimate the revenue upside of research-led marketing in 30 seconds." />
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
        <Reveal className="mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">ROI Calculator</p>
          <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-6xl mb-4">What's your bottleneck<br /><span className="text-vermilion">costing you?</span></h1>
          <p className="text-muted-foreground max-w-xl text-lg">Three honest inputs. One uncomfortable number. Then we'll show you how to claim it back.</p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-border border border-border">
          <div className="lg:col-span-7 bg-background p-8 sm:p-12">
            <div className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Monthly revenue</label>
                <span className="font-display text-xl font-bold text-vermilion" data-testid="roi-revenue-label">{fmt(revenue)}</span>
              </div>
              <input
                data-testid="roi-revenue-slider"
                type="range"
                min={500_000}
                max={100_000_000}
                step={500_000}
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full accent-vermilion h-1.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>PKR 5 Lac</span><span>PKR 10 Cr</span></div>
            </div>

            <div className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Revenue marketing influences</label>
                <span className="font-display text-xl font-bold text-vermilion" data-testid="roi-share-label">{share}%</span>
              </div>
              <input
                data-testid="roi-share-slider"
                type="range"
                min={10}
                max={90}
                step={5}
                value={share}
                onChange={(e) => setShare(Number(e.target.value))}
                className="w-full accent-vermilion h-1.5"
              />
              <p className="text-xs text-muted-foreground mt-2">Most B2C brands sit at 40–70%. Most B2B at 20–40%.</p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-4">Your scenario</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    data-testid={`roi-scenario-${s.id}`}
                    onClick={() => setScenario(s.id)}
                    className={`text-left border p-4 transition-all duration-200 ${scenario === s.id ? "border-vermilion bg-vermilion text-white" : "border-border hover:border-vermilion"}`}
                  >
                    <span className="block font-display font-bold">{s.label}</span>
                    <span className={`block text-xs mt-1 ${scenario === s.id ? "text-white/80" : "text-muted-foreground"}`}>+{s.uplift * 100}% · {s.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-coal dark:bg-card text-white p-8 sm:p-12 flex flex-col">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-8 flex items-center gap-2"><TrendingUp size={14} className="text-vermilion" /> Your upside</p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">Extra revenue, every month</p>
            <p className="font-display text-5xl font-extrabold tracking-tight text-vermilion mb-8" data-testid="roi-monthly-gain">
              <CountUp value={result.monthlyGain} />
            </p>
            <div className="space-y-5 text-sm flex-1">
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-white/60">Per year</span>
                <span className="font-display font-bold" data-testid="roi-annual-gain">{fmt(result.annualGain)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-white/60">Diagnostic Audit pays back in</span>
                <span className="font-display font-bold" data-testid="roi-payback">{result.auditPaybackDays} days</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3">
                <span className="text-white/60">3-month retainer returns</span>
                <span className="font-display font-bold" data-testid="roi-multiple">{result.roiMultiple.toFixed(1)}x</span>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-6 mb-6">Estimates only - your real number comes from a Diagnostic Audit, not a slider.</p>
            <Link
              to="/book-consultation"
              data-testid="roi-book-button"
              className="inline-flex items-center justify-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-7 py-4 rounded-full transition-colors"
            >
              Get Your Real Diagnosis <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
