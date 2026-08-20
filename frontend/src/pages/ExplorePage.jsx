import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal, EASE } from "@/components/motion";
import { api, imgUrl } from "@/lib/api";
import { useContent } from "@/lib/content";

const SPANS = ["md:col-span-7", "md:col-span-5", "md:col-span-4", "md:col-span-4", "md:col-span-4", "md:col-span-8", "md:col-span-6", "md:col-span-6"];

export default function ExplorePage() {
  const [type, setType] = useState("place");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const c = useContent();

  const TYPES = [
    { key: "place", label: "Places", heading: c.explore_place_heading, blurb: c.explore_place_blurb },
    { key: "food", label: "Food", heading: c.explore_food_heading, blurb: c.explore_food_blurb },
    { key: "culture", label: "Culture", heading: c.explore_culture_heading, blurb: c.explore_culture_blurb },
  ];

  useEffect(() => {
    setLoading(true);
    api.get(`/explore?type=${type}`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [type]);

  const active = TYPES.find((t) => t.key === type);

  return (
    <div className="bg-ink min-h-screen" data-testid="explore-page">
      <Navbar />
      <div className="pt-28 pb-16 sm:pb-24 max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal y={16}><p className="meta text-gold">Explore Rohru</p></Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-display text-5xl sm:text-6xl uppercase text-paper mt-3 leading-none">
            {active.heading}
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="text-smoke mt-4 max-w-lg text-sm sm:text-base">{active.blurb}</p>
        </Reveal>

        <div className="flex gap-2 mt-10 mb-10" role="tablist" aria-label="Explore categories">
          {TYPES.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={type === t.key}
              data-testid={`explore-tab-${t.key}`}
              onClick={() => setType(t.key)}
              className={`meta px-5 py-2.5 border transition-colors ${
                type === t.key
                  ? "bg-saffron text-ink border-saffron"
                  : "border-line text-smoke hover:text-paper hover:border-smoke"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="meta text-smoke" data-testid="explore-loading">Loading the valley…</p>
        ) : items.length === 0 ? (
          <p className="text-smoke" data-testid="explore-empty">Nothing here yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {items.map((item, i) => (
              <motion.article
                key={item.id}
                data-testid={`explore-card-${item.id}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.65, delay: (i % 3) * 0.08, ease: EASE }}
                className={`${SPANS[i % SPANS.length]} group border border-line bg-inkraised overflow-hidden hover:-translate-y-1 hover:border-gold/60 transition-all duration-300`}
              >
                <div className="h-60 overflow-hidden">
                  <img
                    src={imgUrl(item.image_url)}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {item.tag && <span className="meta text-gold">{item.tag}</span>}
                    {item.altitude && <span className="meta text-smoke">· {item.altitude}</span>}
                    {item.difficulty && <span className="meta text-saffron">· {item.difficulty}</span>}
                  </div>
                  <h2 className="font-display text-3xl uppercase text-paper mt-2 leading-none">{item.title}</h2>
                  <p className="text-smoke text-sm mt-3 leading-relaxed">{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
