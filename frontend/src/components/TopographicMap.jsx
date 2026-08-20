import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, Chapter } from "@/components/motion";
import { useContent } from "@/lib/content";

const Peak = ({ cx, cy, rings, ratio, rotate }) => (
  <g transform={`rotate(${rotate} ${cx} ${cy})`} aria-hidden="true">
    {Array.from({ length: rings }).map((_, i) => {
      const rx = 52 + i * 42;
      return (
        <ellipse
          key={i}
          cx={cx + (i % 2 === 0 ? i * 3 : -i * 2)}
          cy={cy + (i % 3 === 0 ? i * 2 : -i)}
          rx={rx}
          ry={rx * ratio}
          fill="none"
          stroke="#D6A84F"
          strokeOpacity={Math.max(0.1, 0.42 - i * 0.05)}
          strokeWidth="1"
          strokeDasharray={i % 3 === 0 ? "6 5" : "none"}
        />
      );
    })}
  </g>
);

export const TopographicMap = () => {
  const ref = useRef(null);
  const c = useContent();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const mapY = useTransform(scrollYProgress, [0, 1], [-26, 26]);

  return (
    <section ref={ref} data-testid="topo-map-section" className="border-y border-line bg-inkraised overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-4">
          <Chapter num="01" label={c.label_terrain} />
          <Reveal delay={0.1}>
            <h2 className="font-display text-4xl sm:text-5xl uppercase text-paper mt-3 leading-none">
              {c.terrain_heading_1}
              <br />
              <span className="text-saffron">{c.terrain_heading_2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-smoke mt-5 text-sm sm:text-base max-w-sm">{c.terrain_text}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <ul className="mt-6 space-y-2.5 font-mono text-[0.7rem] tracking-[0.18em] uppercase text-smoke">
              <li data-testid="map-fact-chanshal"><span className="text-saffron">▲</span>&nbsp; Chanshal Pass — 4,520 m</li>
              <li data-testid="map-fact-pabbar"><span className="text-gold">≈</span>&nbsp; Pabbar River — trout waters</li>
              <li data-testid="map-fact-rohru"><span className="text-saffron">●</span>&nbsp; Rohru Town — 1,550 m</li>
            </ul>
          </Reveal>
        </div>
        <motion.div style={{ y: mapY }} className="lg:col-span-8 frame">
          <svg
            viewBox="0 0 800 520"
            role="img"
            aria-label="Stylised topographic contour map of the Rohru valley and surrounding Shimla district mountains, showing Chanshal Pass, Kharapathar and the Pabbar river"
            className="w-full h-auto"
          >
            <rect x="0" y="0" width="800" height="520" fill="#0D0E0C" />
            <Peak cx={270} cy={215} rings={6} ratio={0.62} rotate={-12} />
            <Peak cx={610} cy={300} rings={5} ratio={0.58} rotate={9} />
            <path
              d="M -10 470 C 140 430, 260 505, 430 458 S 700 495, 810 445"
              fill="none"
              stroke="#F05A28"
              strokeOpacity="0.55"
              strokeWidth="2"
            />
            <text x="640" y="500" fill="#B5AA99" fontSize="11" letterSpacing="3" fontFamily="Roboto Mono, monospace">PABBAR RIVER</text>
            <text x="205" y="150" fill="#F1E9D8" fontSize="12" letterSpacing="3" fontFamily="Roboto Mono, monospace">▲ CHANSHAL PASS 4520M</text>
            <text x="565" y="245" fill="#F1E9D8" fontSize="11" letterSpacing="3" fontFamily="Roboto Mono, monospace">▲ KHARAPATHAR</text>
            <circle cx="430" cy="455" r="6" fill="#F05A28" />
            <circle cx="430" cy="455" r="6" fill="none" stroke="#F05A28" strokeWidth="2">
              <animate attributeName="r" from="6" to="28" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <text x="448" y="459" fill="#F1E9D8" fontSize="12" letterSpacing="3" fontFamily="Roboto Mono, monospace">ROHRU 1550M</text>
            <text x="30" y="40" fill="#B5AA99" fontSize="10" letterSpacing="4" fontFamily="Roboto Mono, monospace">31.20° N · 77.75° E</text>
            <text x="30" y="60" fill="#B5AA99" fontSize="10" letterSpacing="4" fontFamily="Roboto Mono, monospace">FIELD MAP 01 — NOT TO SCALE</text>
            <line x1="30" y1="80" x2="150" y2="80" stroke="#3A332B" strokeWidth="1" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
