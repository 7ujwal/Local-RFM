import { Link } from "react-router-dom";
import { BRAND, imgUrl } from "@/lib/api";
import { useContent } from "@/lib/content";

export const Footer = () => {
  const c = useContent();
  return (
    <footer data-testid="site-footer" className="border-t border-line bg-inkraised">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <img src={imgUrl(c.logo_badge)} alt="Roaming From Rohru badge" className="h-16 w-16 rounded-full overflow-hidden" />
            <div>
              <p className="font-display text-2xl uppercase text-paper leading-none">{c.brand_wordmark}</p>
              <p className="meta text-gold mt-1">{c.footer_tagline}</p>
            </div>
          </div>
          <p className="text-smoke text-sm mt-5 max-w-sm">{c.footer_text}</p>
        </div>
        <div className="md:col-span-3">
          <p className="meta text-smoke mb-4">Navigate</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/explore" data-testid="footer-link-explore" className="text-paper/80 hover:text-saffron transition-colors">Explore Rohru</Link></li>
            <li><Link to="/events" data-testid="footer-link-events" className="text-paper/80 hover:text-saffron transition-colors">Upcoming Events</Link></li>
            <li><Link to="/contact" data-testid="footer-link-contact" className="text-paper/80 hover:text-saffron transition-colors">Contact Us</Link></li>
            <li><Link to="/admin" data-testid="footer-admin-link" className="text-smoke/70 hover:text-gold transition-colors">Owner Login</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="meta text-smoke mb-4">Follow the trail</p>
          <a
            href={BRAND.instagram}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-instagram-link"
            className="inline-flex items-center gap-2 text-gold hover:text-saffron transition-colors text-sm"
          >
            Instagram — @RoamingFromRohru
          </a>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center">
        <p className="meta text-smoke/60">© {new Date().getFullYear()} {c.footer_copyright}</p>
      </div>
    </footer>
  );
};
