# PRD — Roaming From Rohru

## Original Problem Statement
Promotional travel & events website for "Roaming From Rohru" — showcasing Rohru, a hidden mountain town in Shimla district, Himachal Pradesh. Audience: city-dwelling Indian adventure seekers. Brand: deep black, bold orange, gold highlights, rugged typography, supplied logo assets. Home (autoplay video hero, topo map, intro, quick links), Explore (Places/Food/Culture cards), Events (booking + Razorpay payments), Contact (details, enquiry form, Google Maps embed), Instagram promo section, and a Google-login-protected admin CMS (owner only: roamingfromrohru@gmail.com) managing content, events, bookings, messages, contact details. Fully mobile responsive.

## User Personas
- Adventure seeker (mobile-first, arrives via Instagram): feels the place, browses events, books, follows IG.
- Offbeat traveller: explores places/food/culture, sends enquiry.
- Site owner (non-technical): manages all content, events, bookings, messages from admin panel.

## Architecture
- FastAPI + Motor (MongoDB, DB_NAME env) — collections: explore, events, bookings, messages, settings, users, user_sessions
- React (CRA/craco) + Tailwind, shadcn ui primitives, sonner toasts
- Auth: Emergent-managed Google login; session_token httpOnly cookie (7 days); admin email allowlist (ADMIN_EMAIL env)
- Payments: Razorpay — server-side order creation, HMAC-SHA256 signature verification, spots decremented only after payment success; demo-mode fallback when keys absent
- Uploads: POST /api/admin/upload → /app/backend/uploads, served at /api/uploads/*
- Design source: /app/design_guidelines.json (Trail Ledger concept — Bebas Neue / IBM Plex Sans / Roboto Mono; ink #0D0E0C, orange #F05A28, gold #D6A84F)

## Implemented (2026-08-19, v10)
- Full CMS: settings.content doc (GET /api/settings/content public, PUT /api/admin/settings/content admin) drives ~50 editable fields — logo/banner images (upload), navbar wordmark + CTA, preloader lines, hero kicker/titles/tagline/CTAs (+ winter variants), marquee phrases (summer/winter), chapter labels, all section headings/paragraphs, explore page tab headings, events page intro/bullets, contact heading, footer texts
- Frontend content system: src/lib/content.js (defaults + module cache + refreshContent on publish); admin "Site Text & Images" tab with grouped fields and sticky Publish button — changes go live without reload; styling never touched (text-only binding)
- Owner passkey activated via `ADMIN_PASSKEY` in backend environment (never commit the value) — admin login is Google → passkey (2 layers; OTP dormant pending Resend key)

## Implemented (2026-08-19, v9)
- 3-layer admin security: Google sign-in → admin passkey (env ADMIN_PASSKEY, bcrypt-hashed at startup, 5 wrong tries end the session) → email OTP (6-digit, 5-min expiry, 5 attempts, 60s resend cooldown, via Resend to the owner). Layers auto-activate only when their secrets exist in backend/.env; /api/auth/me returns {user, security:{required, cleared}}; all admin endpoints enforce full clearance
- Verified: no-config mode unchanged; passkey mode blocks admin (403) until cleared, wrong key 401, UI gate tested end-to-end; OTP gate renders and rate-limits — email delivery NOT tested (needs the real Resend key)

## Implemented (2026-08-19, v8)
- Related Trips: "More Expeditions" section at the bottom of every event page — two cards (same trip type first), cover photo, tag, date, price, click-through navigation between events verified

## Implemented (2026-08-19, v7)
- Contact Details CMS expanded: phone, WhatsApp number, email, Instagram, YouTube, Facebook, address — all editable in admin Site & Contact tab and rendered live on the Contact page (wa.me / tel / mailto / social links auto-built from handles or full URLs; empty fields are hidden)

## Implemented (2026-08-19, v6)
- Event detail pages at /events/:id — cinematic cover hero, numbered itinerary ("The Plan"), what-to-pack checklist, trail photo gallery, sticky booking box; posters on the events page link through
- Sold-out waitlist: POST /api/waitlist + Join Waitlist dialog replaces Book Now at 0 spots; admin Bookings tab shows the waitlist under the bookings table
- WhatsApp share button on every event poster and detail page (wa.me prefilled with event + link)
- Events now carry itinerary/packing/gallery/cover_url fields end-to-end (DB enriched via /app/scripts/enrich_events.py, seeds in sync, admin editor has one-line-per-step itinerary/packing textareas and an add/remove gallery manager)

## Implemented (2026-08-19, v5.2)
- Hero badge clip fix: badge resized (96px mobile / 128px desktop) and hero content reserves navbar clearance (pt-28); verified FULLY VISIBLE with measured top clearance 90–322px across 1920x800, 1366x768, 1920x1000 and 390x844

## Implemented (2026-08-19, v5.1)
- Navbar logo fix: badge wrapped in a clipped 44px circle, vertically centered (measured 11/12px gaps inside the 65px bar, desktop + mobile), wordmark "ROAMING FROM ROHRU" now always visible beside it (previously hidden on mobile)

## Implemented (2026-08-19, v5)
- Events page is now a poster wall: wide 16:10 cover photos with tag/date chips and title overlay; new cover_url field on events (backfilled from image_url; dedicated "Poster / Cover Photo" slot in the event editor)
- Seasonal homepage: admin season toggle (Summer Trails / Winter Snow) in Site & Contact tab, stored in settings.site.season; winter = canvas snowfall over hero, cool tint, winter tagline + meta line, winter marquee, snow events sorted first on homepage strip
- Booking CSV export: GET /api/admin/bookings.csv (auth-guarded, 401 without session) + one-tap Export CSV button on the admin Bookings tab

## Implemented (2026-08-19, v4)
- Round badge logo processed (white background stripped via PIL → /app/frontend/public/brand-badge.png) and made the main hero logo + navbar/admin/preloader/footer mark
- Homepage marquee now rolls all place names (Chanshal, Chandar Nahan, Kuppar, Dodra Kwar, Rupin, Pabbar, Kharapathar)
- Explore places: 8 entries with altitude/distance + difficulty chips; Chandar Nahan merged into existing lake card (no duplicate); Kuppar Peak, Dodra Kwar, Rupin Pass added (script: /app/scripts/add_places.py)
- Admin: altitude/difficulty fields in the place editor; video upload support (mp4/webm/mov, 200MB) in /api/admin/upload; GET/PUT /settings/site; "Site & Contact" tab with Homepage Background Video manager (upload or URL, reset-to-default); hero reads hero_video setting live

## Implemented (2026-08-19, v3)
- Cinematic preloader: brand-stamp slam with shockwave ring, masked brand lines, progress bar, tap-to-skip, plays once per session (sessionStorage), hero reveal sequenced after exit
- All 15 explore entries rewritten with deeper field-journal copy (DB updated live via /app/scripts/enrich_content.py + server.py seeds kept in sync); badge images circle-cropped site-wide

## Implemented (2026-08-19, v2 motion overhaul)
- Award-level art direction pass: kinetic hero with masked line-by-line headline reveal + on-load logo moment; scroll-parallax + scale on hero video; mouse-tilt on hero content; slow editorial marquee (alternating solid/outline display type); ghost-numbered manifesto chapters 01–05; gold corner-frame treatments on key imagery; scroll progress bar; framer-motion scroll-reveals on every public page; Lenis momentum scrolling (skipped under prefers-reduced-motion); button micro-interactions; ScrollToTop on route change; data-lenis-prevent on dialogs
- Booking alert emails coded (Resend): owner emailed on new booking + payment success; silently skipped until RESEND_API_KEY is added to backend/.env

## Implemented (2026-08-19, v1)
- Home: Himalaya video hero (Wikimedia webm, poster = brand banner), logo overlay, tagline, CTAs; animated SVG topographic map (Chanshal, Kharapathar, Pabbar, pulsing Rohru marker); intro; explore preview; events strip; Instagram grid + follow; footer
- Explore page: Places/Food/Culture tabs, tetris grid cards (seeded: 5 places, 6 dishes, 4 culture entries)
- Events page: 5 seeded events with price/spots/dates; booking dialog (name/phone/pax → Razorpay or demo mode); success/failure states
- Contact page: owner-editable details, enquiry form, Google Maps embed of Rohru
- Admin panel (/admin): Google login gated to owner email; CMS for explore entries & events (photo upload or URL); bookings table; messages inbox; contact details editor
- All interactive elements carry data-testid; mobile responsive verified

## Verification Done
- curl: explore/events/settings/messages/bookings (demo), auth/me, admin CRUD cycle, upload serve, 401 without auth
- Screenshots: home, map, explore, events, booking success, contact, admin dashboard + bookings table, mobile views

## Backlog
- P2 (user declined for now): Razorpay live keys — payments intentionally stay in demo mode
- P2 (user declined for now): Resend API key — booking alert emails coded but dormant (skip-logged)
- P2 (user declined for now): Instagram/Meta access token — placeholder grid is the accepted state
- P1: Owner replaces placeholder photos/copy via admin CMS; replace hero video with own footage
- P2: Razorpay webhook for payment status reconciliation (only if payments go live)
- P2: Booking confirmation SMS/WhatsApp (Twilio), booking CSV export
