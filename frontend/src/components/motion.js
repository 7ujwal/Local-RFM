import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1];

export const Reveal = ({ children, delay = 0, y = 28, className = "", testid }) => (
  <motion.div
    className={className}
    data-testid={testid}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-70px" }}
    transition={{ duration: 0.75, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export const Chapter = ({ num, label }) => (
  <Reveal y={16}>
    <div className="flex items-end gap-4 sm:gap-5">
      <span className="chapter-num text-7xl sm:text-8xl" aria-hidden="true">{num}</span>
      <span className="meta text-gold pb-2">{label}</span>
    </div>
  </Reveal>
);

const MARQUEE_ITEMS = [
  "Off The Beaten Path",
  "Chanshal Pass · 4520M",
  "Chandar Nahan Lake",
  "Kuppar Peak",
  "Dodra Kwar",
  "Rupin Pass · 4650M",
  "Pabbar Valley",
  "Kharapathar",
];

export const Marquee = ({ items = MARQUEE_ITEMS }) => (
  <div
    className="border-y border-line bg-ink overflow-hidden py-5 sm:py-6 select-none"
    aria-hidden="true"
    data-testid="editorial-marquee"
  >
    <div className="marquee-track">
      {[0, 1].map((half) => (
        <div key={half} className="flex shrink-0 items-center">
          {items.map((t, i) => (
            <span key={i} className="flex items-center">
              <span
                className={`font-display uppercase text-3xl sm:text-4xl tracking-wide whitespace-nowrap ${
                  i % 2 ? "marquee-outline" : "text-paper/85"
                }`}
              >
                {t}
              </span>
              <span className="text-saffron mx-6 sm:mx-8 text-lg">▲</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const Snowfall = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let raf;
    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const flakes = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 2.2 + 0.6,
      s: Math.random() * 0.0022 + 0.0008,
      d: Math.random() * Math.PI * 2,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(241, 233, 216, 0.8)";
      for (const f of flakes) {
        f.y += f.s;
        f.d += 0.008;
        if (f.y > 1) {
          f.y = -0.02;
          f.x = Math.random();
        }
        const x = (f.x + Math.sin(f.d) * 0.015) * w;
        ctx.beginPath();
        ctx.arc(x, f.y * h, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-testid="snowfall-layer"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};
