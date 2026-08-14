import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      data-testid="scroll-progress-bar"
      className="fixed top-0 left-0 right-0 h-[3px] bg-vermilion z-[60] origin-left"
      style={{ scaleX }}
    />
  );
}
