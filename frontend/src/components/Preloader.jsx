import { motion } from "framer-motion";
import { imgUrl } from "@/lib/api";
import { useContent } from "@/lib/content";
import { EASE } from "@/components/motion";

const MaskedLine = ({ children, delay, className = "" }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className="block"
      initial={{ y: "115%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export default function Preloader({ onSkip }) {
  const c = useContent();
  return (
    <motion.div
      data-testid="preloader"
      role="button"
      aria-label="Skip intro"
      tabIndex={0}
      onClick={onSkip}
      onKeyDown={(e) => e.key === "Enter" && onSkip()}
      className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-center cursor-pointer select-none"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute w-44 h-44 rounded-full border border-saffron/50"
        initial={{ scale: 0.5, opacity: 0.9 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
      />
      <motion.img
        src={imgUrl(c.logo_badge)}
        alt="Roaming From Rohru stamp"
        data-testid="preloader-stamp"
        className="w-36 h-36 sm:w-44 sm:h-44 relative rounded-full overflow-hidden"
        initial={{ scale: 1.9, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1.35, 0.3, 1] }}
      />
      <MaskedLine delay={0.55} className="mt-9">
        <span className="font-display text-3xl sm:text-4xl uppercase text-paper tracking-wide">
          {c.preloader_title}
        </span>
      </MaskedLine>
      <MaskedLine delay={0.72} className="mt-2.5">
        <span className="meta text-gold">{c.preloader_subtitle}</span>
      </MaskedLine>
      <div className="mt-11 w-40 h-px bg-line overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-full w-full bg-saffron origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.7, delay: 0.35, ease: "easeInOut" }}
        />
      </div>
      <span className="meta text-smoke/50 mt-5">Tap to skip</span>
    </motion.div>
  );
}
