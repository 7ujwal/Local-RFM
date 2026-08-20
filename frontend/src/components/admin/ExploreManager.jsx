import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { api, imgUrl } from "@/lib/api";

const TYPES = [
  { key: "place", label: "Places", tagLabel: "Best time to visit" },
  { key: "food", label: "Food", tagLabel: "Short note (e.g. Winter staple)" },
  { key: "culture", label: "Culture", tagLabel: "Category (e.g. Festivals)" },
];

const EMPTY = { title: "", tag: "", altitude: "", difficulty: "", description: "", image_url: "" };

export const ExploreManager = () => {
  const [type, setType] = useState("place");
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get(`/explore?type=${type}`).then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, [type]);

  const openNew = () => { setForm(EMPTY); setEditing({}); };
  const openEdit = (item) => {
    setForm({
      title: item.title,
      tag: item.tag || "",
      altitude: item.altitude || "",
      difficulty: item.difficulty || "",
      description: item.description,
      image_url: item.image_url,
    });
    setEditing(item);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing?.id) {
        await api.put(`/admin/explore/${editing.id}`, { ...form, type });
        toast.success("Updated");
      } else {
        await api.post("/admin/explore", { ...form, type });
        toast.success("Added");
      }
      setEditing(null);
      load();
    } catch {
      toast.error("Save failed");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await api.delete(`/admin/explore/${item.id}`).catch(() => toast.error("Delete failed"));
    load();
  };

  const tagLabel = TYPES.find((t) => t.key === type)?.tagLabel;

  return (
    <div data-testid="admin-explore-manager">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              data-testid={`admin-explore-tab-${t.key}`}
              onClick={() => setType(t.key)}
              className={`meta px-4 py-2 border transition-colors ${type === t.key ? "bg-saffron text-ink border-saffron" : "border-line text-smoke hover:text-paper"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={openNew} data-testid="admin-explore-add-button" className="btn-orange !px-4 !py-2">
          <Plus size={14} /> Add Entry
        </button>
      </div>

      <div className="border border-line divide-y divide-line" data-testid="admin-explore-list">
        {items.length === 0 && <p className="p-6 text-smoke text-sm">No entries yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4" data-testid={`admin-explore-row-${item.id}`}>
            <img src={imgUrl(item.image_url)} alt="" className="h-14 w-20 object-cover border border-line shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-paper text-sm font-medium truncate">{item.title}</p>
              <p className="meta text-smoke truncate">{[item.tag, item.altitude, item.difficulty].filter(Boolean).join(" · ")}</p>
            </div>
            <button onClick={() => openEdit(item)} data-testid={`admin-explore-edit-${item.id}`} className="p-2 text-smoke hover:text-gold transition-colors" aria-label={`Edit ${item.title}`}>
              <Pencil size={16} />
            </button>
            <button onClick={() => remove(item)} data-testid={`admin-explore-delete-${item.id}`} className="p-2 text-smoke hover:text-danger transition-colors" aria-label={`Delete ${item.title}`}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="bg-inkraised border-line text-paper max-w-lg max-h-[90vh] overflow-y-auto" data-testid="admin-explore-editor">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">{editing?.id ? "Edit Entry" : "New Entry"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="explore-title">Title</label>
              <input id="explore-title" data-testid="admin-explore-title-input" className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="explore-tag">{tagLabel}</label>
              <input id="explore-tag" data-testid="admin-explore-tag-input" className="field" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
            </div>
            {type === "place" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="meta text-smoke block mb-1.5" htmlFor="explore-altitude">Altitude / Distance</label>
                  <input id="explore-altitude" data-testid="admin-explore-altitude-input" className="field" value={form.altitude} onChange={(e) => setForm({ ...form, altitude: e.target.value })} placeholder="≈ 3,800 m · 40 km from Rohru" />
                </div>
                <div>
                  <label className="meta text-smoke block mb-1.5" htmlFor="explore-difficulty">Difficulty</label>
                  <input id="explore-difficulty" data-testid="admin-explore-difficulty-input" className="field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} placeholder="Easy / Moderate / Difficult" />
                </div>
              </div>
            )}
            <div>
              <label className="meta text-smoke block mb-1.5" htmlFor="explore-desc">Description</label>
              <textarea id="explore-desc" data-testid="admin-explore-description-input" rows={4} className="field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <span className="meta text-smoke block mb-1.5">Photo</span>
              <ImageUpload testid="admin-explore-image" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>
            <button type="submit" data-testid="admin-resource-save-button" className="btn-orange w-full">Save</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
