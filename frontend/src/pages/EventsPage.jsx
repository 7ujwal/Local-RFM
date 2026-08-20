import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingDialog } from "@/components/BookingDialog";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Reveal, EASE } from "@/components/motion";
import { api, imgUrl, INR } from "@/lib/api";
import { useContent } from "@/lib/content";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [waitlistEvent, setWaitlistEvent] = useState(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const c = useContent();

  const load = useCallback(() => {
    api.get("/events")
      .then((r) => setEvents(r.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openBooking = (ev) => {
    setSelected(ev);
    setDialogOpen(true);
  };

  const openWaitlist = (ev) => {
    setWaitlistEvent(ev);
    setWaitlistOpen(true);
  };

  const shareEvent = (ev) => {
    const url = `${window.location.origin}/events/${ev.id}`;
    const text = `${ev.name} — ${ev.date} · ${ev.location}. ${INR(ev.price)}/person with Roaming From Rohru. ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-ink min-h-screen" data-testid="events-page">
      <Navbar />
      <div className="pt-28 pb-16 sm:pb-24 max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
          <Reveal y={16}><p className="meta text-gold">{c.label_events}</p></Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display text-5xl sm:text-6xl uppercase text-paper mt-3 leading-none">
              {c.events_page_heading_1}
              <br />
              <span className="text-saffron">{c.events_page_heading_2}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-smoke mt-5 text-sm sm:text-base">{c.events_page_intro}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <ul className="mt-6 space-y-2 meta text-smoke">
              <li>{c.events_bullet_1}</li>
              <li>{c.events_bullet_2}</li>
              <li>{c.events_bullet_3}</li>
            </ul>
          </Reveal>
        </aside>

        <div className="lg:col-span-9 grid sm:grid-cols-2 gap-6 items-start">
          {loading ? (
            <p className="meta text-smoke" data-testid="events-loading">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="text-smoke" data-testid="events-empty">No events announced yet — follow us on Instagram for drops.</p>
          ) : (
            events.map((ev, i) => {
              const soldOut = ev.available_spots <= 0;
              return (
                <motion.article
                  key={ev.id}
                  data-testid={`event-card-${ev.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.65, delay: (i % 2) * 0.08, ease: EASE }}
                  className="group border border-line bg-inkraised overflow-hidden hover:border-gold/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <Link to={`/events/${ev.id}`} data-testid={`event-link-${ev.id}`} className="block relative aspect-[16/10] overflow-hidden">
                    <img
                      src={imgUrl(ev.cover_url || ev.image_url)}
                      alt={ev.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inkraised via-inkraised/10 to-transparent" aria-hidden="true" />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {ev.tag && <span className="meta bg-ink/80 backdrop-blur px-3 py-1.5 text-saffron border border-line">{ev.tag}</span>}
                      <span className="meta bg-ink/80 backdrop-blur px-3 py-1.5 text-paper border border-line">{ev.date}</span>
                    </div>
                    <h2 className="absolute bottom-3 left-5 right-5 font-display text-3xl uppercase text-paper leading-none drop-shadow-lg">
                      {ev.name}
                    </h2>
                  </Link>
                  <div className="p-5 sm:p-6">
                    <p className="meta text-smoke inline-flex items-center gap-1.5">
                      <MapPin size={12} /> {ev.location}
                    </p>
                    <p className="text-smoke text-sm mt-3 leading-relaxed line-clamp-3">{ev.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-line">
                      <div>
                        <span className="font-mono text-gold text-sm block" data-testid={`event-price-${ev.id}`}>{INR(ev.price)}/person</span>
                        <span className="meta text-smoke inline-flex items-center gap-1.5 mt-1.5" data-testid={`event-spots-${ev.id}`}>
                          <Users size={12} /> {soldOut ? "Sold out" : `${ev.available_spots} spots left`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {soldOut ? (
                          <button
                            data-testid={`event-waitlist-button-${ev.id}`}
                            onClick={() => openWaitlist(ev)}
                            className="btn-orange !px-5 !py-2.5"
                          >
                            Join Waitlist
                          </button>
                        ) : (
                          <button
                            data-testid={`event-book-button-${ev.id}`}
                            onClick={() => openBooking(ev)}
                            className="btn-orange !px-5 !py-2.5"
                          >
                            Book Now
                          </button>
                        )}
                        <button
                          data-testid={`event-share-button-${ev.id}`}
                          onClick={() => shareEvent(ev)}
                          aria-label={`Share ${ev.name} on WhatsApp`}
                          className="btn-ghost !px-3.5 !py-2.5"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
      </div>
      <BookingDialog
        event={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onBooked={load}
      />
      <WaitlistDialog
        event={waitlistEvent}
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
      />
      <Footer />
    </div>
  );
}
