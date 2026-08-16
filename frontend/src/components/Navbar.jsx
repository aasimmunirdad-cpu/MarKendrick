import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, ArrowUpRight } from "lucide-react";

const LINKS = [
  { to: "/services", label: "Services" },
  { to: "/industries", label: "Industries" },
  { to: "/work", label: "Work" },
  { to: "/insights", label: "Insights" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar({ onSearchOpen }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

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
            src="/media/brand/logo-color-mark.png"
            alt="MarKendrick"
            className="h-7 sm:h-8 w-auto"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion ${
                  isActive ? "text-vermilion" : "text-foreground/80"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            data-testid="nav-search-button"
            onClick={onSearchOpen}
            aria-label="Search"
            className="p-2 rounded-full border border-border hover:border-vermilion hover:text-vermilion transition-colors duration-200"
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
            className="lg:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl"
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
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
