import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroVideo } from "@/components/HeroVideo";
import { TopographicMap } from "@/components/TopographicMap";
import { InstagramStrip } from "@/components/InstagramStrip";
import Preloader from "@/components/Preloader";
import { Reveal, Marquee, Chapter } from "@/components/motion";
import { api, imgUrl, INR } from "@/lib/api";
import { useContent, parseList } from "@/lib/content";

const ExplorePreview = () => {
  const [items, setItems] = useState([]);
  const c = useContent();
  useEffect(() => {
    api.get("/explore").then((r) => {
      const all = r.data;
      const pick = ["place", "food", "culture"].flatMap((t) => all.filter((i) => i.type === t).slice(0, 2));
      setItems(pick);
    }).catch(() => {});
  }, []);
  if (!items.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24" data-testid="home-explore-preview">
      <Chapter num="03" label={c.label_explore} />
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10 mt-3">
        <Reveal delay={0.1}>
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-paper leading-none">
            {c.explore_heading_1} <span className="text-gold">{c.explore_heading_2}</span> <span className="text-saffron">{c.explore_heading_3}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <Link to="/explore" data-testid="home-explore-all-link" className="meta text-saffron hover:text-saffron-hover transition-colors inline-flex items-center gap-2">
            {c.explore_all_link} <ArrowRight size={14} />
          </Link>
        </Reveal>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) * 0.08} className="h-full">
            <Link
              to="/explore"
              data-testid={`home-explore-card-${item.id}`}
              className="group block h-full border border-line bg-inkraised overflow-hidden hover:-translate-y-1 hover:border-gold/60 transition-all duration-300"
            >
              <div className="h-52 overflow-hidden">
                <img src={imgUrl(item.image_url)} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <p className="meta text-gold">{item.type} · {item.tag}</p>
                <h3 className="font-display text-2xl uppercase text-paper mt-2">{item.title}</h3>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

const EventsStrip = ({ season }) => {
  const [events, setEvents] = useState([]);
  const c = useContent();
  useEffect(() => {
    api.get("/events").then((r) => {
      let list = r.data;
      if (season === "winter") {
        const isWinter = (ev) => /snow|winter/i.test(`${ev.tag} ${ev.name}`);
        list = [...list].sort((a, b) => Number(isWinter(b)) - Number(isWinter(a)));
      }
      setEvents(list.slice(0, 3));
    }).catch(() => {});
  }, [season]);
  if (!events.length) return null;
  return (
    <section className="border-y border-line bg-inkraised" data-testid="home-events-strip">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <Chapter num="04" label={season === "winter" ? "Snow Season" : c.label_events} />
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 mt-3">
          <Reveal delay={0.1}>
            <h2 className="font-display text-4xl sm:text-5xl uppercase text-paper leading-none">
              {c.events_heading_1} <span className="text-saffron">{c.events_heading_2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <Link to="/events" data-testid="home-events-all-link" className="meta text-saffron hover:text-saffron-hover transition-colors inline-flex items-center gap-2">
              {c.events_all_link} <ArrowRight size={14} />
            </Link>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((ev, i) => (
            <Reveal key={ev.id} delay={i * 0.08} className="h-full">
              <div data-testid={`home-event-card-${ev.id}`} className="border border-line bg-ink p-6 flex flex-col h-full hover:border-gold/50 transition-colors duration-300">
                <p className="meta text-saffron">{ev.tag} · {ev.date}</p>
                <h3 className="font-display text-2xl uppercase text-paper mt-3 leading-tight">{ev.name}</h3>
                <p className="text-smoke text-sm mt-3 flex-1 line-clamp-3">{ev.description}</p>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-line">
                  <span className="font-mono text-gold text-sm">{INR(ev.price)}/person</span>
                  <Link to={`/events/${ev.id}`} data-testid={`home-event-book-${ev.id}`} className="meta text-paper hover:text-saffron transition-colors">
                    View Trip →
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const Intro = () => {
  const figRef = useRef(null);
  const c = useContent();
  const { scrollYProgress } = useScroll({ target: figRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [-28, 28]);

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-12 gap-10 items-center" data-testid="intro-section">
      <div className="lg:col-span-7">
        <Chapter num="02" label={c.label_intro} />
        <Reveal delay={0.1}>
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-paper mt-3 leading-none">
            {c.intro_heading_1}
            <br />
            <span className="text-saffron">{c.intro_heading_2}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-smoke mt-6 text-sm sm:text-base max-w-xl">{c.intro_para_1}</p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="text-smoke mt-4 text-sm sm:text-base max-w-xl">{c.intro_para_2}</p>
        </Reveal>
      </div>
      <motion.figure ref={figRef} style={{ y: imgY }} className="lg:col-span-5 frame">
        <img src={imgUrl(c.banner_url)} alt="Roaming From Rohru banner artwork over Himalayan terrain" className="w-full border border-line object-cover max-h-[420px]" />
        <figcaption className="meta text-smoke mt-3">{c.banner_caption}</figcaption>
      </motion.figure>
    </section>
  );
};

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem("rfr_intro_seen");
    } catch {
      return false;
    }
  });
  const [season, setSeason] = useState("summer");
  const c = useContent();

  useEffect(() => {
    api.get("/settings/site")
      .then((r) => setSeason(r.data?.season === "winter" ? "winter" : "summer"))
      .catch(() => {});
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem("rfr_intro_seen", "1");
    } catch {}
    setShowIntro(false);
  };

  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(dismiss, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIntro]);

  const marqueeItems = parseList(season === "winter" ? c.marquee_items_winter : c.marquee_items);

  return (
    <div className="bg-ink min-h-screen" data-testid="home-page" data-season={season}>
      <AnimatePresence>{showIntro && <Preloader key="intro" onSkip={dismiss} />}</AnimatePresence>
      <Navbar />
      {!showIntro && <HeroVideo season={season} />}
      <Marquee items={marqueeItems} />
      <TopographicMap />
      <Intro />
      <ExplorePreview />
      <EventsStrip season={season} />
      <InstagramStrip />
      <Footer />
    </div>
  );
}
