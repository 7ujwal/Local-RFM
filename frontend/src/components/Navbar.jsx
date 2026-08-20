import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BRAND, imgUrl } from "@/lib/api";
import { useContent } from "@/lib/content";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const c = useContent();
  return (
    <header data-testid="site-navbar" className="fixed top-0 inset-x-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" data-testid="nav-logo-link" className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          <span className="h-11 w-11 rounded-full overflow-hidden shrink-0 border border-line" aria-hidden="true">
            <img src={imgUrl(c.logo_badge)} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="font-display text-base sm:text-xl tracking-wide text-paper leading-none truncate">
            {c.brand_wordmark}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`primary-nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `meta transition-colors ${isActive ? "text-saffron" : "text-smoke hover:text-paper"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/events" data-testid="nav-plan-trip-button" className="hidden md:inline-flex btn-orange !py-2.5">
            {c.nav_cta}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button data-testid="mobile-menu-button" className="md:hidden text-paper p-2" aria-label="Open menu">
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-inkraised border-line w-72 pt-14">
              <nav className="flex flex-col gap-6" aria-label="Mobile">
                {LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    data-testid={`mobile-nav-link-${l.label.toLowerCase()}`}
                    className={({ isActive }) =>
                      `font-display text-2xl uppercase tracking-wide ${isActive ? "text-saffron" : "text-paper"}`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <a
                  href={BRAND.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="mobile-nav-instagram"
                  className="meta text-gold"
                >
                  @RoamingFromRohru
                </a>
                <Link to="/events" onClick={() => setOpen(false)} data-testid="mobile-plan-trip-button" className="btn-orange mt-2">
                  {c.nav_cta}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
