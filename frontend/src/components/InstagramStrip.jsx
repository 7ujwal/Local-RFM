import { Instagram } from "lucide-react";
import { BRAND } from "@/lib/api";
import { Reveal, Chapter } from "@/components/motion";
import { useContent } from "@/lib/content";

const P = "https://images.pexels.com/photos";
const THUMBS = [
  `${P}/32225789/pexels-photo-32225789.jpeg?auto=compress&cs=tinysrgb&w=500`,
  `${P}/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=500`,
  `${P}/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=500`,
  `${P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=500`,
  `${P}/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=500`,
  `${P}/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=500`,
];

export const InstagramStrip = () => {
  const c = useContent();
  return (
    <section data-testid="instagram-section" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <Chapter num="05" label={c.label_instagram} />
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10 mt-3">
        <Reveal delay={0.1}>
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-paper leading-none">
            {c.instagram_heading}
          </h2>
          <p className="text-smoke mt-3 text-sm sm:text-base max-w-md">{c.instagram_text}</p>
        </Reveal>
        <Reveal delay={0.2}>
          <a
            href={BRAND.instagram}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="instagram-follow-button"
            className="btn-orange"
          >
            <Instagram size={15} /> {c.instagram_button}
          </a>
        </Reveal>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {THUMBS.map((src, i) => (
          <Reveal key={i} delay={i * 0.06} y={20}>
            <a
              href={BRAND.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`instagram-thumb-${i + 1}`}
              className="group relative block aspect-square overflow-hidden border border-line"
            >
              <img
                src={src}
                alt={`Instagram post preview ${i + 1} from Roaming From Rohru`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram size={20} className="text-saffron" />
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
