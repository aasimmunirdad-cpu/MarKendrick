import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, ArrowUpRight, ChevronDown, Calculator, Gauge, Sparkles, FileText, HelpCircle, MessageSquarePlus, Workflow } from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";
import ServiceWheel from "./ServiceWheel";

const LINKS = [
  { to: "/services", label: "Services" },
  { to: "/industries", label: "Industries" },
  { to: "/work", label: "Work" },
  { to: "/insights", label: "Insights" },
];

const AFTER_LINKS = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const RESOURCE_GROUPS = [
  {
    heading: "Free Tools",
    items: [
      { to: "/roi-calculator", label: "ROI Calculator", desc: "What fixing your funnel is worth", icon: Calculator },
      { to: "/maturity-quiz", label: "Marketing Maturity Grade", desc: "Get graded A to F in 2 minutes", icon: Gauge },
      { to: "/quiz", label: "Take the Quiz", desc: "A quick fit-check for your brand", icon: Sparkles },
    ],
  },
  {
    heading: "Resources",
    items: [
      { to: "/whitepapers", label: "Whitepapers & Reports", desc: "Free research, downloadable", icon: FileText },
      { to: "/how-we-work", label: "How We Work", desc: "Process, staffing, reporting, terms", icon: Workflow },
      { to: "/faq", label: "FAQ", desc: "Common questions, answered", icon: HelpCircle },
      { to: "/share-your-experience", label: "Share Your Experience", desc: "Leave us a testimonial", icon: MessageSquarePlus },
    ],
  },
];

export default function Navbar({ onSearchOpen }) {
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const settings = useSiteSettings();
  const resourcesRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setResourcesOpen(false);
    setMobileResourcesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!resourcesOpen) return;
    const onClick = (e) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) setResourcesOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setResourcesOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [resourcesOpen]);

  const navLinkCls = ({ isActive }) =>
    `text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion ${
      isActive ? "text-vermilion" : "text-foreground/80"
    }`;

  return (
    <header
      data-testid="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open ? "bg-background/70 backdrop-blur-xl border-b border-border" : "border-b border-transparent"
      }`}
    >
      <nav className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center">
          <img
            src={settings.logo_url}
            alt="MarKendrick"
            className="h-7 sm:h-8 w-auto"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} data-testid={`nav-link-${l.label.toLowerCase()}`} className={navLinkCls}>
              {l.label}
            </NavLink>
          ))}

          <div className="relative" ref={resourcesRef}>
            <button
              type="button"
              data-testid="nav-resources-button"
              onClick={() => setResourcesOpen((v) => !v)}
              aria-expanded={resourcesOpen}
              className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion ${
                resourcesOpen ? "text-vermilion" : "text-foreground/80"
              }`}
            >
              Resources <ChevronDown size={14} className={`transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  data-testid="nav-resources-dropdown"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[560px] bg-background border border-border shadow-xl grid grid-cols-2 gap-px bg-border"
                >
                  {RESOURCE_GROUPS.map((group) => (
                    <div key={group.heading} className="bg-background p-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-vermilion mb-3">{group.heading}</p>
                      <div className="flex flex-col gap-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            data-testid={`nav-resource-${item.to.slice(1)}`}
                            className="flex items-start gap-3 p-2.5 -mx-2.5 rounded-lg hover:bg-secondary/60 transition-colors group"
                          >
                            <item.icon size={17} className="text-vermilion shrink-0 mt-0.5" />
                            <span>
                              <span className="block text-sm font-semibold group-hover:text-vermilion transition-colors">{item.label}</span>
                              <span className="block text-xs text-muted-foreground">{item.desc}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {AFTER_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} data-testid={`nav-link-${l.label.toLowerCase()}`} className={navLinkCls}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ServiceWheel />
          <button
            data-testid="nav-search-button"
            onClick={onSearchOpen}
            aria-label="Search (Cmd+K)"
            className="hidden sm:flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-full border border-border hover:border-vermilion hover:text-vermilion transition-colors duration-200 text-muted-foreground"
          >
            <Search size={15} />
            <span className="text-xs font-medium border border-current/30 rounded px-1.5 py-0.5 leading-none">⌘K</span>
          </button>
          <button
            data-testid="nav-search-button-mobile"
            onClick={onSearchOpen}
            aria-label="Search"
            className="sm:hidden p-2 rounded-full border border-border hover:border-vermilion hover:text-vermilion transition-colors duration-200"
          >
            <Search size={17} />
          </button>
          <Link
            to="/book-consultation"
            data-testid="nav-book-consultation-button"
            className="hidden sm:inline-flex items-center gap-1.5 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200"
          >
            Book a Consultation <ArrowUpRight size={15} />
          </Link>
          <button
            data-testid="mobile-menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="lg:hidden p-2 rounded-full border border-border"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl max-h-[calc(100svh-4rem)] overflow-y-auto"
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <NavLink to={l.to} className="block py-3 font-display text-2xl font-bold tracking-tight hover:text-vermilion transition-colors">
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}

              <motion.div initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: LINKS.length * 0.05 }}>
                <button
                  type="button"
                  data-testid="mobile-resources-toggle"
                  onClick={() => setMobileResourcesOpen((v) => !v)}
                  className="w-full flex items-center justify-between py-3 font-display text-2xl font-bold tracking-tight hover:text-vermilion transition-colors"
                >
                  Resources
                  <ChevronDown size={20} className={`transition-transform duration-200 ${mobileResourcesOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileResourcesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden pl-1"
                    >
                      {RESOURCE_GROUPS.flatMap((g) => g.items).map((item) => (
                        <Link key={item.to} to={item.to} className="flex items-center gap-3 py-2.5 text-base font-medium text-foreground/80 hover:text-vermilion transition-colors">
                          <item.icon size={16} className="text-vermilion shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {AFTER_LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: (LINKS.length + 1 + i) * 0.05 }}>
                  <NavLink to={l.to} className="block py-3 font-display text-2xl font-bold tracking-tight hover:text-vermilion transition-colors">
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}

              <Link
                to="/book-consultation"
                data-testid="mobile-book-consultation-button"
                className="mt-4 inline-flex items-center justify-center gap-2 bg-vermilion text-white font-semibold px-6 py-3.5 rounded-full"
              >
                Book a Consultation <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
