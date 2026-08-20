import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, Sun, Snowflake } from "lucide-react";
import { api, imgUrl } from "@/lib/api";

export const SiteSettings = () => {
  const [video, setVideo] = useState("");
  const [season, setSeason] = useState("summer");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings/site").then((r) => {
      setVideo(r.data?.hero_video || "");
      setSeason(r.data?.season === "winter" ? "winter" : "summer");
    }).catch(() => {});
  }, []);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    setBusy(true);
    try {
      const { data } = await api.post("/admin/upload", fd, { timeout: 300000 });
      setVideo(data.url);
      toast.success("Video uploaded — press Save to publish it");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings/site", { hero_video: video, season });
      toast.success("Site settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-10" data-testid="admin-site-settings">
      <div className="space-y-5">
        <div>
          <p className="font-display text-xl uppercase text-paper">Homepage Season</p>
          <p className="text-smoke text-sm mt-1">
            Winter mode adds falling snow to the hero, a colder tone, a winter marquee and pushes snow
            drives to the front of the homepage events strip.
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Homepage season">
          <button
            onClick={() => setSeason("summer")}
            data-testid="admin-season-summer"
            className={`meta px-5 py-3 border inline-flex items-center gap-2 transition-colors ${
              season === "summer" ? "bg-saffron text-ink border-saffron" : "border-line text-smoke hover:text-paper"
            }`}
          >
            <Sun size={14} /> Summer Trails
          </button>
          <button
            onClick={() => setSeason("winter")}
            data-testid="admin-season-winter"
            className={`meta px-5 py-3 border inline-flex items-center gap-2 transition-colors ${
              season === "winter" ? "bg-gold text-ink border-gold" : "border-line text-smoke hover:text-paper"
            }`}
          >
            <Snowflake size={14} /> Winter Snow
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="font-display text-xl uppercase text-paper">Homepage Background Video</p>
          <p className="text-smoke text-sm mt-1">
            Loops silently behind the hero. MP4 or WebM, up to 200 MB. Clear the field and save to return
            to the default mountain footage.
          </p>
        </div>
        {video && (
          <video
            key={video}
            src={imgUrl(video)}
            className="w-full border border-line"
            muted
            loop
            autoPlay
            playsInline
            data-testid="admin-video-preview"
          />
        )}
        <div className="flex gap-2">
          <label className="btn-ghost !px-4 !py-2 cursor-pointer shrink-0" data-testid="admin-video-upload-button">
            <Upload size={13} /> {busy ? "Uploading…" : "Upload Video"}
            <input type="file" accept="video/*" className="hidden" onChange={pick} disabled={busy} />
          </label>
          <input
            className="field"
            data-testid="admin-video-url-input"
            value={video}
            onChange={(e) => setVideo(e.target.value)}
            placeholder="…or paste a video URL"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || busy} data-testid="admin-settings-site-save-button" className="btn-orange">
            {saving ? "Saving…" : "Save Site Settings"}
          </button>
          {video && (
            <button onClick={() => setVideo("")} data-testid="admin-video-clear-button" className="btn-ghost">
              Reset Video to Default
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
