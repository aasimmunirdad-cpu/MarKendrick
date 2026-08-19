import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { loadGA, trackPage } from "@/lib/gtag";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import SearchOverlay from "@/components/SearchOverlay";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import GlobalTypography from "@/components/GlobalTypography";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Industries from "@/pages/Industries";
import IndustryDetail from "@/pages/IndustryDetail";
import LocationDetail from "@/pages/LocationDetail";
import Faq from "@/pages/Faq";
import Legal from "@/pages/Legal";
import Whitepapers from "@/pages/Whitepapers";
import Quiz from "@/pages/Quiz";
import RoiCalculator from "@/pages/RoiCalculator";
import MaturityQuiz from "@/pages/MaturityQuiz";
import AuthorPage from "@/pages/AuthorPage";
import Work from "@/pages/Work";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import Insights from "@/pages/Insights";
import PostDetail from "@/pages/PostDetail";
import Contact from "@/pages/Contact";
import ShareTestimonial from "@/pages/ShareTestimonial";
import HowWeWork from "@/pages/HowWeWork";
import BookConsultation from "@/pages/BookConsultation";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageWrap({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}

function Shell() {
  useLenis();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (localStorage.getItem("mk-cookie-consent") === "all") loadGA();
    const onConsent = () => {
      if (localStorage.getItem("mk-cookie-consent") === "all") loadGA();
    };
    window.addEventListener("mk-consent-changed", onConsent);
    return () => window.removeEventListener("mk-consent-changed", onConsent);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <ScrollTop />
      {!isAdmin && <GlobalTypography />}
      {!isAdmin && <ScrollProgress />}
      {!isAdmin && <Navbar onSearchOpen={() => setSearchOpen(true)} />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrap><Home /></PageWrap>} />
          <Route path="/about" element={<PageWrap><About /></PageWrap>} />
          <Route path="/services" element={<PageWrap><Services /></PageWrap>} />
          <Route path="/services/:slug" element={<PageWrap><ServiceDetail /></PageWrap>} />
          <Route path="/industries" element={<PageWrap><Industries /></PageWrap>} />
          <Route path="/industries/:slug" element={<PageWrap><IndustryDetail /></PageWrap>} />
          <Route path="/locations/:slug" element={<PageWrap><LocationDetail /></PageWrap>} />
          <Route path="/faq" element={<PageWrap><Faq /></PageWrap>} />
          <Route path="/whitepapers" element={<PageWrap><Whitepapers /></PageWrap>} />
          <Route path="/quiz" element={<PageWrap><Quiz /></PageWrap>} />
          <Route path="/roi-calculator" element={<PageWrap><RoiCalculator /></PageWrap>} />
          <Route path="/maturity-quiz" element={<PageWrap><MaturityQuiz /></PageWrap>} />
          <Route path="/insights/author/:slug" element={<PageWrap><AuthorPage /></PageWrap>} />
          <Route path="/privacy-policy" element={<PageWrap><Legal key="privacy" slugOverride="privacy-policy" /></PageWrap>} />
          <Route path="/terms-of-service" element={<PageWrap><Legal key="terms" slugOverride="terms-of-service" /></PageWrap>} />
          <Route path="/cookie-policy" element={<PageWrap><Legal key="cookies" slugOverride="cookie-policy" /></PageWrap>} />
          <Route path="/work" element={<PageWrap><Work /></PageWrap>} />
          <Route path="/work/:slug" element={<PageWrap><CaseStudyDetail /></PageWrap>} />
          <Route path="/insights" element={<PageWrap><Insights /></PageWrap>} />
          <Route path="/insights/:slug" element={<PageWrap><PostDetail /></PageWrap>} />
          <Route path="/contact" element={<PageWrap><Contact /></PageWrap>} />
          <Route path="/share-your-experience" element={<PageWrap><ShareTestimonial /></PageWrap>} />
          <Route path="/how-we-work" element={<PageWrap><HowWeWork /></PageWrap>} />
          <Route path="/book-consultation" element={<PageWrap><BookConsultation /></PageWrap>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<PageWrap><NotFound /></PageWrap>} />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <Footer />}
      {!isAdmin && <ChatWidget />}
      {!isAdmin && <CookieBanner />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster position="bottom-center" toastOptions={{ style: { background: "#141414", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" } }} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
