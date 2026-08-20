import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const DEFAULTS = {
  brand_wordmark: "ROAMING FROM ROHRU",
  nav_cta: "Plan a Trip",
  logo_badge: "/brand-badge.png",
  banner_url: "https://customer-assets-4nw71qhi.emergentagent.net/wingman/e7672571-b80f-42cc-8891-a0a14036e307/attachments/0c8932fab4bc4605b13dc6cda24c8289_ChatGPT Image Jul 5%2C 2026%2C 11_38_51 PM.png",
  preloader_title: "Roaming From Rohru",
  preloader_subtitle: "Off the beaten path",
  hero_kicker: "Rohru · Shimla District · Himachal Pradesh",
  hero_title_1: "Off The",
  hero_title_2: "Beaten Path",
  hero_tagline: "Discover Rohru — where the Himalayas are still untouched.",
  hero_winter_kicker: "Rohru · Shimla District · Snow Season",
  hero_winter_tagline: "Rohru under snow — frozen trails, white ridges and drives that bite back.",
  hero_cta_primary: "Explore Rohru",
  hero_cta_secondary: "Upcoming Events",
  marquee_items: "Off The Beaten Path, Chanshal Pass · 4520M, Chandar Nahan Lake, Kuppar Peak, Dodra Kwar, Rupin Pass · 4650M, Pabbar Valley, Kharapathar",
  marquee_items_winter: "Winter In Rohru, Snow Drives, Chanshal White-Out, Kharapathar Snowfields, Pabbar Frost, Siddu Season, Bonfire Nights, Off The Beaten Path",
  label_terrain: "The Terrain",
  label_intro: "Who We Are",
  label_explore: "Explore",
  label_events: "Expeditions & Camps",
  label_instagram: "On Instagram",
  terrain_heading_1: "Rohru Valley",
  terrain_heading_2: "Read The Lines",
  terrain_text: "Perched at roughly 1,550 m on the banks of the Pabbar, Rohru is the gateway to Chanshal Pass — at 4,520 m the highest peak in Shimla district. Apple orchards, cedar forests and glacier-fed streams fill everything in between.",
  intro_heading_1: "Born in Rohru.",
  intro_heading_2: "Built for the wild.",
  intro_para_1: "Roaming From Rohru is a crew of locals who grew up on these trails. Rohru sits on the Pabbar river in Shimla district — a working mountain town of apple orchards, deodar forests and villages that tourism forgot. That's exactly why it's worth your time.",
  intro_para_2: "We run off-road convoys to Chanshal Pass, riverside camps, winter snow drives, treks to glacial lakes and weekends inside real village homes. No package-tour script — just the valley as we live it.",
  banner_caption: "Field note 01 — somewhere above the Pabbar",
  explore_heading_1: "Places.",
  explore_heading_2: "Plates.",
  explore_heading_3: "People.",
  explore_all_link: "See everything",
  events_heading_1: "Upcoming",
  events_heading_2: "Events",
  events_all_link: "All events",
  instagram_heading: "@RoamingFromRohru",
  instagram_text: "Trail diaries, convoy footage and valley stories — straight from the field, almost every day.",
  instagram_button: "Follow Us",
  explore_place_heading: "Where the road ends",
  explore_place_blurb: "Scenic spots, high passes and hidden villages around Rohru.",
  explore_food_heading: "Eat like a local",
  explore_food_blurb: "Wood-fire Himachali cooking from the Pabbar valley.",
  explore_culture_heading: "Old ways, high places",
  explore_culture_blurb: "Festivals, folk music and the mountain way of life.",
  events_page_heading_1: "Upcoming",
  events_page_heading_2: "Events",
  events_page_intro: "Small groups, local crew, real terrain. Off-road convoys, riverside camps, snow drives, summit treks and village weekends. Tap a poster for the full plan.",
  events_bullet_1: "· 4x4 convoy support & recovery gear",
  events_bullet_2: "· Local meals & stay arranged",
  events_bullet_3: "· Experienced mountain marshals",
  contact_heading_1: "Talk to",
  contact_heading_2: "the crew",
  footer_tagline: "Off the beaten path",
  footer_text: "Raw Himalayan expeditions, riverside camps and village stories from Rohru — Shimla district's best-kept secret.",
  footer_copyright: "Roaming From Rohru · Rohru, Himachal Pradesh",
};

let cache = null;
let loading = false;
const listeners = new Set();

function fetchContent() {
  if (cache || loading) return;
  loading = true;
  api.get("/settings/content")
    .then((r) => {
      cache = { ...DEFAULTS, ...(r.data?.data || {}) };
    })
    .catch(() => {
      cache = { ...DEFAULTS };
    })
    .finally(() => {
      loading = false;
      listeners.forEach((fn) => fn(cache));
    });
}

export function refreshContent() {
  cache = null;
  loading = false;
  fetchContent();
}

export function useContent() {
  const [c, setC] = useState(cache || DEFAULTS);
  useEffect(() => {
    fetchContent();
    const fn = (nc) => setC(nc);
    listeners.add(fn);
    if (cache) setC(cache);
    return () => listeners.delete(fn);
  }, []);
  return c;
}

export const parseList = (text) =>
  (text || "").split(",").map((s) => s.trim()).filter(Boolean);
