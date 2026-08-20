import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const FIELDS = [
  { key: "phone", label: "Phone Number" },
  { key: "whatsapp", label: "WhatsApp Number (with country code, e.g. +91 98050…)" },
  { key: "email", label: "Email Address" },
  { key: "instagram", label: "Instagram Handle (e.g. @RoamingFromRohru)" },
  { key: "youtube", label: "YouTube Channel (handle or full URL)" },
  { key: "facebook", label: "Facebook Page (handle or full URL)" },
  { key: "address", label: "Address" },
];

const EMPTY = { phone: "", whatsapp: "", email: "", instagram: "", youtube: "", facebook: "", address: "" };

export const ContactSettings = () => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings/contact").then((r) => {
      const d = r.data || {};
      setForm(Object.fromEntries(FIELDS.map((f) => [f.key, d[f.key] || ""])));
    }).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/settings/contact", form);
      toast.success("Contact details updated — live on the Contact page");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="admin-contact-settings">
      <p className="font-display text-xl uppercase text-paper">Contact Details</p>
      <p className="text-smoke text-sm mt-1 mb-6">
        These show on the public Contact page the moment you save. Leave a field empty to hide it.
      </p>
      <form onSubmit={save} className="max-w-lg space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="meta text-smoke block mb-1.5" htmlFor={`settings-${f.key}`}>{f.label}</label>
            <input
              id={`settings-${f.key}`}
              data-testid={`admin-settings-${f.key}-input`}
              className="field"
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <button type="submit" data-testid="admin-settings-save-button" disabled={saving} className="btn-orange">
          {saving ? "Saving…" : "Save Details"}
        </button>
      </form>
    </div>
  );
};
