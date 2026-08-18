import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, CalendarDays, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { OFFICE } from "../data/content";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("menu"); // menu | message | done
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/leads", { ...form, company: "", service: "", budget: "", timeline: "", source: "chat-widget" });
      setMode("done");
      toast.success("Message sent - we reply within one business day.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.button
        data-testid="chat-widget-bubble"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.4, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[65] w-14 h-14 rounded-full bg-foreground text-background hover:bg-vermilion hover:text-white flex items-center justify-center shadow-2xl transition-colors duration-300"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} strokeWidth={2} />}
        {!open && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-vermilion rounded-full animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="chat-widget-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-[65] w-[calc(100vw-3rem)] max-w-sm bg-card border border-border shadow-2xl overflow-hidden"
          >
            <div className="bg-vermilion text-white px-5 py-4">
              <p className="font-display font-bold tracking-tight">MarKendrick</p>
              <p className="text-xs text-white/80">Typically replies within minutes, PKT hours</p>
            </div>

            {mode === "menu" && (
              <div className="p-5">
                <div className="bg-secondary/60 text-sm px-4 py-3 rounded-lg rounded-tl-none mb-5 max-w-[90%]">
                  Salaam! Looking for research, branding or performance help? Pick a lane -
                </div>
                <div className="space-y-2">
                  <a
                    data-testid="chat-whatsapp-option"
                    href={`https://wa.me/${OFFICE.whatsapp}?text=${encodeURIComponent("Hi MarKendrick - I'd like to discuss a project.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border border-border hover:border-[#25D366] px-4 py-3.5 transition-colors group"
                  >
                    <MessageCircle size={18} className="text-[#25D366]" />
                    <span className="text-sm font-semibold flex-1">Chat on WhatsApp</span>
                    <span className="text-xs text-muted-foreground group-hover:text-[#25D366]">Fastest</span>
                  </a>
                  <button
                    data-testid="chat-message-option"
                    onClick={() => setMode("message")}
                    className="w-full flex items-center gap-3 border border-border hover:border-vermilion px-4 py-3.5 transition-colors text-left"
                  >
                    <Send size={18} className="text-vermilion" />
                    <span className="text-sm font-semibold flex-1">Leave a message</span>
                    <span className="text-xs text-muted-foreground">1 business day</span>
                  </button>
                  <Link
                    data-testid="chat-book-option"
                    to="/book-consultation"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 border border-border hover:border-vermilion px-4 py-3.5 transition-colors"
                  >
                    <CalendarDays size={18} className="text-vermilion" />
                    <span className="text-sm font-semibold flex-1">Book a free consultation</span>
                    <span className="text-xs text-muted-foreground">30 min</span>
                  </Link>
                </div>
              </div>
            )}

            {mode === "message" && (
              <form onSubmit={send} className="p-5 space-y-3" data-testid="chat-message-form">
                <input
                  data-testid="chat-name-input"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors"
                />
                <input
                  data-testid="chat-email-input"
                  required
                  type="email"
                  placeholder="Work email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors"
                />
                <textarea
                  data-testid="chat-message-input"
                  required
                  rows={3}
                  placeholder="What's the challenge?"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button type="button" data-testid="chat-back-button" onClick={() => setMode("menu")} className="px-4 py-3 text-sm border border-border hover:border-vermilion transition-colors">Back</button>
                  <button
                    data-testid="chat-send-button"
                    type="submit"
                    disabled={sending}
                    className="flex-1 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold py-3 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <>Send <Send size={14} /></>}
                  </button>
                </div>
              </form>
            )}

            {mode === "done" && (
              <div className="p-8 text-center" data-testid="chat-message-sent">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4"><Check size={22} /></div>
                <p className="font-display font-bold tracking-tight mb-2">Message received.</p>
                <p className="text-sm text-muted-foreground mb-5">A senior consultant will reply to {form.email} within one business day.</p>
                <button data-testid="chat-done-close" onClick={() => { setOpen(false); setMode("menu"); setForm({ name: "", email: "", message: "" }); }} className="text-sm text-vermilion font-semibold">Close</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
