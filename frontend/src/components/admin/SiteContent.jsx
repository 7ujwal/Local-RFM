import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DEFAULTS, refreshContent } from "@/lib/content";
import { ImageUpload } from "@/components/admin/ImageUpload";

const SECTIONS = [
  {
    title: "Logo & Brand",
    fields: [
      { key: "logo_badge", label: "Main Round Logo (navbar · hero · footer · intro)", type: "image" },
      { key: "banner_url", label: "Banner Artwork (intro section image)", type: "image" },
      { key: "brand_wordmark", label: "Navbar Brand Name" },
      { key: "nav_cta", label: "Navbar Button Label" },
    ],
  },
  {
    title: "Opening Stamp (Preloader)",
    fields: [
      { key: "preloader_title", label: "Title Line" },
      { key: "preloader_subtitle", label: "Subtitle Line" },
    ],
  },
  {
    title: "Hero (Main Screen)",
    fields: [
      { key: "hero_kicker", label: "Small Line Above Title" },
      { key: "hero_title_1", label: "Big Title — Line 1 (cream)" },
      { key: "hero_title_2", label: "Big Title — Line 2 (orange)" },
      { key: "hero_tagline", label: "Tagline Under Title" },
      { key: "hero_cta_primary", label: "Orange Button Label" },
      { key: "hero_cta_secondary", label: "Outline Button Label" },
      { key: "hero_winter_kicker", label: "Winter Mode — Small Line" },
      { key: "hero_winter_tagline", label: "Winter Mode — Tagline" },
    ],
  },
  {
    title: "Scrolling Marquee Strip",
    fields: [
      { key: "marquee_items", label: "Phrases — comma separated" },
      { key: "marquee_items_winter", label: "Winter Phrases — comma separated" },
    ],
  },
  {
    title: "Section Labels (01–05)",
    fields: [
      { key: "label_terrain", label: "01 Label" },
      { key: "label_intro", label: "02 Label" },
      { key: "label_explore", label: "03 Label" },
      { key: "label_events", label: "04 Label" },
      { key: "label_instagram", label: "05 Label" },
    ],
  },
  {
    title: "Terrain Map Section",
    fields: [
      { key: "terrain_heading_1", label: "Heading — Line 1 (cream)" },
      { key: "terrain_heading_2", label: "Heading — Line 2 (orange)" },
      { key: "terrain_text", label: "Paragraph", type: "textarea" },
    ],
  },
  {
    title: "Intro Section (Who We Are)",
    fields: [
      { key: "intro_heading_1", label: "Heading — Line 1 (cream)" },
      { key: "intro_heading_2", label: "Heading — Line 2 (orange)" },
      { key: "intro_para_1", label: "Paragraph 1", type: "textarea" },
      { key: "intro_para_2", label: "Paragraph 2", type: "textarea" },
      { key: "banner_caption", label: "Banner Caption" },
    ],
  },
  {
    title: "Homepage Explore Strip",
    fields: [
      { key: "explore_heading_1", label: "Heading Word 1 (cream)" },
      { key: "explore_heading_2", label: "Heading Word 2 (gold)" },
      { key: "explore_heading_3", label: "Heading Word 3 (orange)" },
      { key: "explore_all_link", label: "Link Label" },
    ],
  },
  {
    title: "Homepage Events Strip",
    fields: [
      { key: "events_heading_1", label: "Heading — Word 1 (cream)" },
      { key: "events_heading_2", label: "Heading — Word 2 (orange)" },
      { key: "events_all_link", label: "Link Label" },
    ],
  },
  {
    title: "Instagram Section",
    fields: [
      { key: "instagram_heading", label: "Heading" },
      { key: "instagram_text", label: "Text", type: "textarea" },
      { key: "instagram_button", label: "Button Label" },
    ],
  },
  {
    title: "Explore Page",
    fields: [
      { key: "explore_place_heading", label: "Places — Heading" },
      { key: "explore_place_blurb", label: "Places — Subtext" },
      { key: "explore_food_heading", label: "Food — Heading" },
      { key: "explore_food_blurb", label: "Food — Subtext" },
      { key: "explore_culture_heading", label: "Culture — Heading" },
      { key: "explore_culture_blurb", label: "Culture — Subtext" },
    ],
  },
  {
    title: "Events Page",
    fields: [
      { key: "events_page_heading_1", label: "Heading — Line 1 (cream)" },
      { key: "events_page_heading_2", label: "Heading — Line 2 (orange)" },
      { key: "events_page_intro", label: "Intro Paragraph", type: "textarea" },
      { key: "events_bullet_1", label: "Bullet 1" },
      { key: "events_bullet_2", label: "Bullet 2" },
      { key: "events_bullet_3", label: "Bullet 3" },
    ],
  },
  {
    title: "Contact Page",
    fields: [
      { key: "contact_heading_1", label: "Heading — Part 1 (cream)" },
      { key: "contact_heading_2", label: "Heading — Part 2 (orange)" },
    ],
  },
  {
    title: "Footer",
    fields: [
      { key: "footer_tagline", label: "Tagline Under Logo" },
      { key: "footer_text", label: "About Paragraph", type: "textarea" },
      { key: "footer_copyright", label: "Copyright Line" },
    ],
  },
];

export const SiteContent = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings/content")
      .then((r) => setForm({ ...DEFAULTS, ...(r.data?.data || {}) }))
      .catch(() => setForm({ ...DEFAULTS }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings/content", { data: form });
      refreshContent();
      toast.success("Published — live on the website now");
    } catch {
      toast.error("Publish failed");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="meta text-smoke">Loading content…</p>;

  return (
    <div className="space-y-10 max-w-2xl" data-testid="admin-site-content">
      <div>
        <p className="font-display text-xl uppercase text-paper">Site Text & Images</p>
        <p className="text-smoke text-sm mt-1">
          Every word and image below goes live the moment you press Publish. Fonts, sizes and colours never
          change — only the content does.
        </p>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.title} className="border border-line" data-testid={`content-section-${s.title.replace(/\W+/g, "-").toLowerCase()}`}>
          <p className="meta text-gold px-4 py-3 border-b border-line bg-inkraised">{s.title}</p>
          <div className="p-4 space-y-4">
            {s.fields.map((f) =>
              f.type === "image" ? (
                <div key={f.key}>
                  <span className="meta text-smoke block mb-1.5">{f.label}</span>
                  <ImageUpload testid={`content-${f.key}`} value={form[f.key] || ""} onChange={(u) => setForm({ ...form, [f.key]: u })} />
                </div>
              ) : f.type === "textarea" ? (
                <div key={f.key}>
                  <label className="meta text-smoke block mb-1.5" htmlFor={`c-${f.key}`}>{f.label}</label>
                  <textarea
                    id={`c-${f.key}`}
                    rows={3}
                    className="field resize-none"
                    data-testid={`content-${f.key}`}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="meta text-smoke block mb-1.5" htmlFor={`c-${f.key}`}>{f.label}</label>
                  <input
                    id={`c-${f.key}`}
                    className="field"
                    data-testid={`content-${f.key}`}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              )
            )}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 z-10">
        <button onClick={save} disabled={saving} data-testid="content-publish-button" className="btn-orange w-full shadow-2xl">
          {saving ? "Publishing…" : "Publish Changes"}
        </button>
      </div>
    </div>
  );
};
