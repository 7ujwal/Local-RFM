import { useState } from "react";
import { toast } from "sonner";
import { api, imgUrl } from "@/lib/api";
import { Upload } from "lucide-react";

export const ImageUpload = ({ value, onChange, testid }) => {
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    setBusy(true);
    try {
      const { data } = await api.post("/admin/upload", fd);
      onChange(data.url);
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed — try a smaller image");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2" data-testid={testid}>
      {value && (
        <img src={imgUrl(value)} alt="Preview" className="h-28 w-full object-cover border border-line" />
      )}
      <div className="flex gap-2">
        <label className="btn-ghost !px-4 !py-2 cursor-pointer shrink-0" data-testid={`${testid}-upload-button`}>
          <Upload size={13} /> {busy ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
        </label>
        <input
          className="field"
          data-testid={`${testid}-url-input`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
        />
      </div>
    </div>
  );
};
