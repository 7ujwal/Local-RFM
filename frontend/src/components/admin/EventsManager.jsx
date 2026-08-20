import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { api, imgUrl, INR } from "@/lib/api";

const EMPTY = {
  name: "", tag: "", date: "", location: "", description: "",
  total_spots: 20, available_spots: 20, price: 0,
  image_url: "", cover_url: "",
  itinerary_text: "", packing_text: "", gallery: [],
};

export const EventsManager = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/events").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing({}); };
  const openEdit = (item) => {
    setForm({
      name: item.name, tag: item.tag || "", date: item.date, location: item.location,
      description: item.description,
      total_spots: item.total_spots, available_spots: item.available_spots, price: item.price,
      image_url: item.image_url || "", cover_url: item.cover_url || "",
      itinerary_text: (item.itinerary || []).join("\n"),
      packing_text: (item.packing || []).join("\n"),
      gallery: item.gallery || [],
    });
    setEditing(item);
  };

  const lines = (text) => text.split("\n").map((s) => s.trim()).filter(Boolean);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name, tag: form.tag, date: form.date, location: form.location,
      description: form.description,
      total_spots: Number(form.total_spots),
      available_spots: Number(form.available_spots),
      price: Number(form.price),
      image_url: form.image_url, cover_url: form.cover_url,
      itinerary: lines(form.itinerary_text),
      packing: lines(form.packing_text),
      gallery: form.gallery.filter(Boolean),
    };
    try {
      if (editing?.id) {
        await api.put(`/admin/events/${editing.id}`, payload);
        toast.success("Event updated");
      } else {
        await api.post("/admin/events", payload);
        toast.success("Event added");
      }
      setEditing(null);
      load();
    } catch {
      toast.error("Save failed");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete event "${item.name}"?`)) return;
    await api.delete(`/admin/events/${item.id}`).catch(() => toast.error("Delete failed"));
    load();
  };

  const setGalleryItem = (i, url) => {
    const gallery = [...form.gallery];
    gallery[i] = url;
    setForm({ ...form, gallery });
  };
  const removeGalleryItem = (i) => {
    setForm({ ...form, gallery: form.gallery.filter((_, idx) => idx !== i) });
  };

  const num = (key, label, testid) => (
    <div>
      <label className="meta text-smoke block mb-1.5" htmlFor={testid}>{label}</label>
      <input id={testid} data-testid={testid} type="number" min="0" className="field" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
    </div>
  );

  return (
    <div data-testid="admin-events-manager">
      <div className="flex justify-end mb-6">
        <button onClick={openNew} data-testid="admin-event-add-button" className="btn-orange !px-4 !py-2">
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div className="border border-line divide-y divide-line" data-testid="admin-events-list">
        {items.length === 0 && <p className="p-6 text-smoke text-sm">No events yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4" data-testid={`admin-event-row-${item.id}`}>
            <img src={imgUrl(item.cover_url || item.image_url)} alt="" className="h-14 w-20 object-cover border border-line shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-paper text-sm font-medium truncate">{item.name}</p>
              <p className="meta text-smoke truncate">{item.date} · {INR(item.price)} · {item.available_spots}/{item.total_spots} spots</p>
            </div>
            <button onClick={() => openEdit(item)} data-testid={`admin-event-edit-${item.id}`} className="p-2 text-smoke hover:text-gold transition-colors" aria-label={`Edit ${item.name}`}>
              <Pencil size={16} />
            </button>
            <button onClick={() => remove(item)} data-testid={`admin-event-delete-${item.id}`} className="p-2 text-smoke hover:text-danger transition-colors" aria-label={`Delete ${item.name}`}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="bg-inkraised border-line text-paper max-w-lg max-h-[90vh] overflow-y-auto" data-testid="admin-event-editor">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">{editing?.id ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="event-name">Event Name</label>
              <input id="event-name" data-testid="admin-event-name-input" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="meta text-smoke block mb-1.5" htmlFor="event-tag">Type (e.g. Off-road)</label>
                <input id="event-tag" data-testid="admin-event-tag-input" className="field" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
              </div>
              <div>
                <label className="meta text-smoke block mb-1.5" htmlFor="event-date">Dates</label>
                <input id="event-date" data-testid="admin-event-date-input" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="14 – 16 Aug 2026" required />
              </div>
            </div>
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="event-location">Location</label>
              <input id="event-location" data-testid="admin-event-location-input" className="field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </div>
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="event-desc">Description</label>
              <textarea id="event-desc" data-testid="admin-event-description-input" rows={4} className="field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {num("price", "Price ₹/person", "admin-event-price-input")}
              {num("total_spots", "Total Spots", "admin-event-total-spots-input")}
              {num("available_spots", "Spots Left", "admin-event-available-spots-input")}
            </div>
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="event-itinerary">Itinerary — one step per line (event detail page)</label>
              <textarea id="event-itinerary" data-testid="admin-event-itinerary-input" rows={5} className="field resize-none" value={form.itinerary_text} onChange={(e) => setForm({ ...form, itinerary_text: e.target.value })} placeholder={"Day 1 — Meet at Rohru by noon, convoy briefing…\nDay 2 — Dawn run to the pass…"} />
            </div>
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="event-packing">What to Pack — one item per line</label>
              <textarea id="event-packing" data-testid="admin-event-packing-input" rows={4} className="field resize-none" value={form.packing_text} onChange={(e) => setForm({ ...form, packing_text: e.target.value })} placeholder={"Warm layers\nGloves\nSunglasses"} />
            </div>
            <div>
              <span className="meta text-smoke block mb-1.5">Poster / Cover Photo (wide — shown on the poster wall)</span>
              <ImageUpload testid="admin-event-cover" value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} />
            </div>
            <div>
              <span className="meta text-smoke block mb-1.5">Fallback Photo (used if no poster is set)</span>
              <ImageUpload testid="admin-event-image" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>
            <div>
              <span className="meta text-smoke block mb-1.5">Trail Gallery Photos (event detail page)</span>
              <div className="space-y-3">
                {form.gallery.map((url, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1">
                      <ImageUpload testid={`admin-event-gallery-${i}`} value={url} onChange={(u) => setGalleryItem(i, u)} />
                    </div>
                    <button type="button" onClick={() => removeGalleryItem(i)} data-testid={`admin-event-gallery-remove-${i}`} className="btn-ghost !px-3 !py-2 shrink-0" aria-label="Remove photo">
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {form.gallery.length < 6 && (
                  <button type="button" onClick={() => setForm({ ...form, gallery: [...form.gallery, ""] })} data-testid="admin-event-gallery-add" className="btn-ghost !px-4 !py-2">
                    <Plus size={13} /> Add Gallery Photo
                  </button>
                )}
              </div>
            </div>
            <button type="submit" data-testid="admin-event-save-button" className="btn-orange w-full">Save Event</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
