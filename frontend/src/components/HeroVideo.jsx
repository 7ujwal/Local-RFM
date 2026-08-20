import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { BRAND, api, imgUrl } from "@/lib/api";
import { EASE, Snowfall } from "@/components/motion";
import { useContent } from "@/lib/content";

const MaskedLine = ({ children, delay = 0, className = "" }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className="block will-change-transform"
      initial={{ y: "115%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1.05, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export const HeroVideo = ({ season = "summer" }) => {
  const ref = useRef(null);
  const [videoSrc, setVideoSrc] = useState(BRAND.video);
  const winter = season === "winter";
  const c = useContent();

  useEffect(() => {
    api.get("/settings/site")
      .then((r) => {
        if (r.data?.hero_video) setVideoSrc(imgUrl(r.data.hero_video));
      })
      .catch(() => {});
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], [0, 190]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.2]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(mx, { stiffness: 55, damping: 16 });
  const tiltY = useSpring(my, { stiffness: 55, damping: 16 });

  const onMouseMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 16);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 12);
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      data-testid="hero-section"
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden"
    >
      <motion.video
        key={videoSrc}
        style={{ y: videoY, scale: videoScale }}
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        poster={imgUrl(c.banner_url)}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        data-testid="hero-video"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/25" aria-hidden="true" />
      {winter && <div className="absolute inset-0 bg-[#9db8d3]/10 mix-blend-screen" aria-hidden="true" />}
      {winter && <Snowfall />}

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-end pt-28 pb-16 sm:pb-20"
      >
        <motion.div style={{ x: tiltX, y: tiltY }}>
          <motion.img
            src={imgUrl(c.logo_badge)}
            alt="Roaming From Rohru logo"
            data-testid="hero-logo"
            className="w-24 sm:w-32 mb-6 rounded-full drop-shadow-[0_12px_35px_rgba(240,90,40,0.3)]"
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          />
          <MaskedLine delay={0.3} className="mb-3">
            <span className="meta text-gold">{winter ? c.hero_winter_kicker : c.hero_kicker}</span>
          </MaskedLine>
          <h1 className="font-display uppercase text-paper leading-[0.9] text-6xl sm:text-7xl lg:text-8xl">
            <MaskedLine delay={0.45}>{c.hero_title_1}</MaskedLine>
            <MaskedLine delay={0.58}>
              <span className="text-saffron">{c.hero_title_2}</span>
            </MaskedLine>
          </h1>
          <MaskedLine delay={0.75} className="mt-5 max-w-md">
            <span className="text-smoke text-base sm:text-lg">
              {winter ? c.hero_winter_tagline : c.hero_tagline}
            </span>
          </MaskedLine>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
          >
            <Link to="/explore" data-testid="hero-explore-button" className="btn-orange">
              {c.hero_cta_primary}
            </Link>
            <Link to="/events" data-testid="hero-events-button" className="btn-ghost">
              {c.hero_cta_secondary}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 right-6 sm:right-10 z-10 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        aria-hidden="true"
      >
        <span className="meta text-smoke">Scroll</span>
        <motion.span
          className="block w-12 h-px bg-saffron origin-left"
          animate={{ scaleX: [0.25, 1, 0.25] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
};
