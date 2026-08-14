import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { OFFICE } from "../data/content";

export default function WhatsAppButton() {
  return (
    <motion.a
      data-testid="whatsapp-float-button"
      href={`https://wa.me/${OFFICE.whatsapp}?text=${encodeURIComponent("Hi MarKendrick — I'd like to discuss a project.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-foreground text-background hover:bg-[#25D366] hover:text-white flex items-center justify-center shadow-2xl transition-colors duration-300"
    >
      <MessageCircle size={24} strokeWidth={2} />
    </motion.a>
  );
}
