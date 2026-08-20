import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, Instagram, MapPin, MessageCircle, Youtube, Facebook } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/motion";
import { api, BRAND } from "@/lib/api";
import { useContent } from "@/lib/content";

const socialUrl = (value, domain) => {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  return `https://${domain}/${value.replace(/^@/, "")}`;
};

export default function ContactPage() {
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const c = useContent();

  useEffect(() => {
    api.get("/settings/contact").then((r) => setSettings(r.data || {})).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, email and message");
      return;
    }
    setSending(true);
    try {
      await api.post("/messages", form);
      toast.success("Message sent — we'll get back to you soon");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const rows = [
    { icon: Phone, label: "Phone", value: settings.phone, href: settings.phone ? `tel:${settings.phone.replace(/\s/g, "")}` : null, testid: "contact-phone" },
    { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp, href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null, testid: "contact-whatsapp" },
    { icon: Mail, label: "Email", value: settings.email, href: settings.email ? `mailto:${settings.email}` : null, testid: "contact-email" },
    { icon: Instagram, label: "Instagram", value: settings.instagram || "@RoamingFromRohru", href: socialUrl(settings.instagram, "instagram.com") || BRAND.instagram, testid: "contact-instagram" },
    { icon: Youtube, label: "YouTube", value: settings.youtube, href: socialUrl(settings.youtube, "youtube.com"), testid: "contact-youtube" },
    { icon: Facebook, label: "Facebook", value: settings.facebook, href: socialUrl(settings.facebook, "facebook.com"), testid: "contact-facebook" },
    { icon: MapPin, label: "Basecamp", value: settings.address, href: null, testid: "contact-address" },
  ];

  return (
    <div className="bg-ink min-h-screen" data-testid="contact-page">
      <Navbar />
      <div className="pt-28 pb-16 sm:pb-24 max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal y={16}><p className="meta text-gold">Contact</p></Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-display text-5xl sm:text-6xl uppercase text-paper mt-3 leading-none">
            {c.contact_heading_1} <span className="text-saffron">{c.contact_heading_2}</span>
          </h1>
        </Reveal>

        <div className="grid lg:grid-cols-12 gap-10 mt-12">
          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="space-y-8">
              <div className="border border-line bg-inkraised divide-y divide-line">
                {rows.filter((r) => r.value).map((r) => (
                  <div key={r.label} className="flex items-center gap-4 p-5" data-testid={r.testid}>
                    <r.icon size={18} className="text-saffron shrink-0" />
                    <div>
                      <p className="meta text-smoke">{r.label}</p>
                      {r.href ? (
                        <a href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-paper hover:text-gold transition-colors text-sm">
                          {r.value}
                        </a>
                      ) : (
                        <p className="text-paper text-sm">{r.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-line overflow-hidden frame">
                <iframe
                  title="Map of Rohru town, Shimla district, Himachal Pradesh"
                  src="https://maps.google.com/maps?q=Rohru%2C%20Himachal%20Pradesh%20171207&t=&z=11&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-72 grayscale-[35%] contrast-[1.05]"
                  loading="lazy"
                  data-testid="contact-map"
                />
                <a
                  href="https://maps.google.com/?q=Rohru,+Himachal+Pradesh+171207"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-map-link"
                  className="block p-3 meta text-smoke hover:text-gold transition-colors bg-inkraised"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.25} className="lg:col-span-7">
            <form onSubmit={submit} className="border border-line bg-inkraised p-6 sm:p-8 space-y-5" data-testid="contact-form">
              <p className="font-display text-2xl uppercase text-paper">Send an enquiry</p>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="meta text-smoke block mb-1.5">Name</label>
                  <input id="contact-name" data-testid="contact-name-input" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
                </div>
                <div>
                  <label htmlFor="contact-email" className="meta text-smoke block mb-1.5">Email</label>
                  <input id="contact-email" data-testid="contact-email-input" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label htmlFor="contact-phone" className="meta text-smoke block mb-1.5">Phone (optional)</label>
                <input id="contact-phone" data-testid="contact-phone-input" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" />
              </div>
              <div>
                <label htmlFor="contact-message" className="meta text-smoke block mb-1.5">Message</label>
                <textarea id="contact-message" data-testid="contact-message-input" rows={5} className="field resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us when you're thinking of coming, how many of you, and what kind of trip you want…" required />
              </div>
              <button type="submit" data-testid="contact-submit-button" disabled={sending} className="btn-orange w-full sm:w-auto">
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}
