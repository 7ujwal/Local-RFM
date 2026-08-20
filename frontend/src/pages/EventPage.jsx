import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Users, Share2, Check, CalendarDays } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingDialog } from "@/components/BookingDialog";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Reveal, EASE } from "@/components/motion";
import { api, imgUrl, INR } from "@/lib/api";

export default function EventPage() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const load = () =>
    api.get(`/events/${id}`)
      .then((r) => setEv(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setEv(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    api.get("/events").then((r) => setAllEvents(r.data)).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="bg-ink min-h-screen">
        <Navbar />
        <p className="meta text-smoke pt-44 text-center" data-testid="event-detail-loading">Loading expedition…</p>
      </div>
    );
  }

  if (notFound || !ev) {
    return (
      <div className="bg-ink min-h-screen" data-testid="event-not-found">
        <Navbar />
        <div className="pt-44 pb-24 text-center px-5">
          <p className="font-display text-4xl uppercase text-paper">Trail not found</p>
          <Link to="/events" data-testid="event-not-found-back" className="btn-orange mt-8 inline-flex">Back to Events</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const soldOut = ev.available_spots <= 0;
  const itinerary = ev.itinerary || [];
  const packing = ev.packing || [];
  const gallery = ev.gallery || [];
  const related = allEvents
    .filter((e) => e.id !== ev.id)
    .sort((a, b) => Number(b.tag === ev.tag) - Number(a.tag === ev.tag))
    .slice(0, 2);

  const share = () => {
    const text = `${ev.name} — ${ev.date} · ${ev.location}. ${INR(ev.price)}/person with Roaming From Rohru. ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-ink min-h-screen" data-testid="event-detail-page">
      <Navbar />

      <div className="relative h-[62vh] min-h-[440px] overflow-hidden">
        <motion.img
          src={imgUrl(ev.cover_url || ev.image_url)}
          alt={ev.name}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/30" aria-hidden="true" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-end pb-10">
          <Reveal y={12}>
            <Link to="/events" data-testid="event-back-link" className="meta text-smoke hover:text-paper transition-colors inline-flex items-center gap-2 mb-6">
              <ArrowLeft size={14} /> All Events
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex flex-wrap gap-2 mb-4">
              {ev.tag && <span className="meta bg-ink/80 backdrop-blur px-3 py-1.5 text-saffron border border-line">{ev.tag}</span>}
              <span className="meta bg-ink/80 backdrop-blur px-3 py-1.5 text-paper border border-line inline-flex items-center gap-1.5">
                <CalendarDays size={12} /> {ev.date}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl uppercase text-paper leading-[0.9]">
              {ev.name}
            </h1>
          </Reveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-12">
          <Reveal>
            <p className="meta text-smoke inline-flex items-center gap-1.5">
              <MapPin size={13} /> {ev.location}
            </p>
            <p className="text-paper/90 text-base leading-relaxed mt-4">{ev.description}</p>
          </Reveal>

          {itinerary.length > 0 && (
            <Reveal>
              <section data-testid="event-itinerary">
                <h2 className="font-display text-3xl uppercase text-paper mb-7">
                  The <span className="text-saffron">Plan</span>
                </h2>
                <ol className="border-l border-line ml-2">
                  {itinerary.map((step, i) => (
                    <li key={i} className="relative pl-9 pb-7 last:pb-0" data-testid={`itinerary-step-${i + 1}`}>
                      <span className="absolute -left-[15px] top-0 font-mono text-[0.7rem] text-saffron border border-line bg-ink px-1.5 py-1">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-smoke text-sm leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </Reveal>
          )}

          {gallery.length > 0 && (
            <Reveal>
              <section data-testid="event-gallery">
                <h2 className="font-display text-3xl uppercase text-paper mb-7">
                  From The <span className="text-gold">Trail</span>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {gallery.map((g, i) => (
                    <div key={i} className="group relative aspect-[4/3] overflow-hidden border border-line frame">
                      <img
                        src={imgUrl(g)}
                        alt={`${ev.name} trail photo ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="lg:col-span-5">
          <Reveal delay={0.1}>
            <div className="border border-line bg-inkraised p-6 lg:sticky lg:top-24 space-y-6" data-testid="event-booking-box">
              <div className="flex items-end justify-between">
                <div>
                  <p className="meta text-smoke">Per Person</p>
                  <p className="font-display text-4xl text-paper leading-none mt-1" data-testid="event-detail-price">{INR(ev.price)}</p>
                </div>
                <span className="meta text-smoke inline-flex items-center gap-1.5" data-testid="event-detail-spots">
                  <Users size={12} /> {soldOut ? "Sold out" : `${ev.available_spots} of ${ev.total_spots} spots left`}
                </span>
              </div>

              {packing.length > 0 && (
                <div data-testid="event-packing-list">
                  <p className="meta text-gold mb-3">What to pack</p>
                  <ul className="space-y-2">
                    {packing.map((item, i) => (
                      <li key={i} className="text-smoke text-sm flex items-start gap-2.5">
                        <Check size={14} className="text-saffron mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {soldOut ? (
                  <button onClick={() => setWaitlistOpen(true)} data-testid="event-detail-waitlist-button" className="btn-orange w-full">
                    Join the Waitlist
                  </button>
                ) : (
                  <button onClick={() => setBookingOpen(true)} data-testid="event-detail-book-button" className="btn-orange w-full">
                    Book Now
                  </button>
                )}
                <button onClick={share} data-testid="event-share-whatsapp-button" className="btn-ghost w-full">
                  <Share2 size={14} /> Share on WhatsApp
                </button>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24" data-testid="related-trips">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl uppercase text-paper mb-8">
              More <span className="text-saffron">Expeditions</span>
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-6">
            {related.map((rel, i) => (
              <Reveal key={rel.id} delay={i * 0.08}>
                <Link
                  to={`/events/${rel.id}`}
                  data-testid={`related-trip-${rel.id}`}
                  className="group block border border-line bg-inkraised overflow-hidden hover:border-gold/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={imgUrl(rel.cover_url || rel.image_url)}
                      alt={rel.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inkraised via-transparent to-transparent" aria-hidden="true" />
                    {rel.tag && (
                      <span className="absolute top-4 left-4 meta bg-ink/80 backdrop-blur px-3 py-1.5 text-saffron border border-line">{rel.tag}</span>
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl uppercase text-paper leading-none truncate">{rel.name}</h3>
                      <p className="meta text-smoke mt-2">{rel.date}</p>
                    </div>
                    <span className="font-mono text-gold text-sm shrink-0">{INR(rel.price)}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <BookingDialog event={ev} open={bookingOpen} onOpenChange={setBookingOpen} onBooked={load} />
      <WaitlistDialog event={ev} open={waitlistOpen} onOpenChange={setWaitlistOpen} />
      <Footer />
    </div>
  );
}
