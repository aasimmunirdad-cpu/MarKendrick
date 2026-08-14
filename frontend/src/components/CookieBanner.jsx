import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("mk-cookie-consent")) {
      const t = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value) => {
    localStorage.setItem("mk-cookie-consent", value);
    window.dispatchEvent(new Event("mk-consent-changed"));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="cookie-consent-banner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-5 z-[60] max-w-sm border border-border bg-card/95 backdrop-blur-xl p-5 shadow-2xl"
        >
          <p className="font-display font-bold tracking-tight mb-2">Cookies, minimally.</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            We use essential cookies to run the site and analytics cookies to improve it. No ad tracking, ever. Details in our{" "}
            <Link to="/cookie-policy" className="text-vermilion hover:underline">Cookie Policy</Link>.
          </p>
          <div className="flex gap-2">
            <button
              data-testid="cookie-accept-button"
              onClick={() => choose("all")}
              className="flex-1 bg-vermilion hover:bg-vermilion-hover text-white text-xs font-semibold px-4 py-2.5 transition-colors"
            >
              Accept All
            </button>
            <button
              data-testid="cookie-essential-button"
              onClick={() => choose("essential")}
              className="flex-1 border border-border hover:border-vermilion text-xs font-semibold px-4 py-2.5 transition-colors"
            >
              Essential Only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
