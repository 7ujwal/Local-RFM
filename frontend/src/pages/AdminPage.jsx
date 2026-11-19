import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Mountain, CalendarDays, NotebookText, MessageSquare, Settings, Type, Video } from "lucide-react";
import { api, BRAND } from "@/lib/api";
import { ExploreManager } from "@/components/admin/ExploreManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { MessagesTable } from "@/components/admin/MessagesTable";
import { ContactSettings } from "@/components/admin/ContactSettings";
import { SiteSettings } from "@/components/admin/SiteSettings";
import { SiteContent } from "@/components/admin/SiteContent";

const TABS = [
  { key: "content", label: "Explore Content", icon: Mountain },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "bookings", label: "Bookings", icon: NotebookText },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "sitetext", label: "Site Text & Images", icon: Type },
  { key: "settings", label: "Site & Contact", icon: Settings },
];

const AdminLogin = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/admin";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const saveVideo = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setSaving(true);
    try {
      await api.put("/admin/settings/site", { hero_video: videoUrl.trim(), season: "summer" });
      toast.success("Background video updated — refresh the homepage to see changes");
    } catch {
      toast.error("Failed to update video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-5" data-testid="admin-login-screen">
      <img src={BRAND.badge} alt="Roaming From Rohru badge" className="h-24 w-24 mb-8 rounded-full overflow-hidden" />
      <p className="meta text-gold">Restricted Area</p>
      <h1 className="font-display text-4xl sm:text-5xl uppercase text-paper mt-3 text-center leading-none">
        Owner <span className="text-saffron">Control Room</span>
      </h1>
      <p className="text-smoke text-sm mt-4 max-w-sm text-center">
        This dashboard is for the site owner only. Sign in with the registered Google account, then clear the
        passkey and one-time code checks.
      </p>

      <div className="w-full max-w-sm mt-6">
        <label className="meta text-smoke block mb-2">Homepage Background Video URL</label>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://...mp4 or .webm"
          className="field"
          data-testid="admin-login-video-input"
        />
        <button
          onClick={saveVideo}
          disabled={saving || !videoUrl.trim()}
          className="btn-orange w-full mt-2"
          data-testid="admin-login-video-save-button"
        >
          {saving ? "Saving…" : "Update Background Video"}
        </button>
      </div>

      <button onClick={login} data-testid="admin-login-button" className="btn-orange mt-8">
        Sign in with Google
      </button>
    </div>
  );
};

const GateShell = ({ title, sub, testid, children }) => (
  <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-5" data-testid={testid}>
    <img src={BRAND.badge} alt="" className="h-20 w-20 rounded-full mb-8" />
    <p className="meta text-gold">Security Check</p>
    <h1 className="font-display text-4xl uppercase text-paper mt-3 text-center leading-none">{title}</h1>
    <p className="text-smoke text-sm mt-3 max-w-sm text-center">{sub}</p>
    <div className="mt-8 w-full max-w-xs">{children}</div>
  </div>
);

const PasskeyGate = ({ onDone }) => {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/passkey", { passkey: val });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Incorrect passkey");
      setVal("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GateShell title="Enter Passkey" sub="Second lock. Your secret admin passkey — not your Google password. Five wrong tries ends the session." testid="passkey-screen">
      <form onSubmit={submit} className="space-y-4" data-testid="passkey-form">
        <input
          type="password"
          data-testid="passkey-input"
          className="field text-center tracking-[0.3em]"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="••••••••"
          autoFocus
          required
        />
        <button type="submit" data-testid="passkey-submit-button" disabled={busy || !val} className="btn-orange w-full">
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </GateShell>
  );
};

const OtpGate = ({ onDone }) => {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const requested = useRef(false);

  const request = async () => {
    try {
      await api.post("/auth/otp/request");
      toast.success("Code sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send the code");
    }
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/otp/verify", { code });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Incorrect code");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GateShell title="Email Code" sub="Final lock. A 6-digit code was sent to roamingfromrohru@gmail.com — valid for 5 minutes." testid="otp-screen">
      <form onSubmit={verify} className="space-y-4" data-testid="otp-form">
        <input
          data-testid="otp-input"
          className="field text-center tracking-[0.5em] font-mono text-lg"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="––––––"
          inputMode="numeric"
          autoFocus
          required
        />
        <button type="submit" data-testid="otp-verify-button" disabled={busy || code.length !== 6} className="btn-orange w-full">
          {busy ? "Verifying…" : "Verify Code"}
        </button>
        <button type="button" onClick={request} data-testid="otp-resend-button" className="btn-ghost w-full">
          Resend Code
        </button>
      </form>
    </GateShell>
  );
};

const AdminShell = ({ user, onLogout }) => {
  const [tab, setTab] = useState("content");
  return (
    <div className="min-h-screen bg-ink" data-testid="admin-dashboard">
      <header className="border-b border-line bg-inkraised sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={BRAND.badge} alt="Roaming From Rohru" className="h-9 w-9 rounded-full" />
            <div className="min-w-0">
              <p className="font-display text-lg uppercase text-paper leading-none pt-0.5">Control Room</p>
              <p className="meta text-smoke truncate" data-testid="admin-user-email">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} data-testid="admin-logout-button" className="btn-ghost !px-4 !py-2">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-12 gap-8">
        <nav className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`admin-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-4 py-3 border whitespace-nowrap transition-colors meta ${
                tab === t.key ? "border-saffron text-saffron bg-saffron/5" : "border-line text-smoke hover:text-paper"
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>
        <main className="lg:col-span-9">
          {tab === "content" && <ExploreManager />}
          {tab === "events" && <EventsManager />}
          {tab === "bookings" && <BookingsTable />}
          {tab === "messages" && <MessagesTable />}
          {tab === "sitetext" && <SiteContent />}
          {tab === "settings" && (
            <div className="space-y-14">
              <SiteSettings />
              <ContactSettings />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const [auth, setAuth] = useState(null);

  const load = () =>
    api.get("/auth/me")
      .then((r) => setAuth(r.data))
      .catch(() => setAuth(false));

  useEffect(() => { load(); }, []);

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    toast.success("Logged out");
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center" data-testid="admin-loading-screen">
        <p className="meta text-smoke">Checking access…</p>
      </div>
    );
  }
  if (auth === false) return <AdminLogin />;

  const required = auth.security?.required || ["google"];
  const cleared = auth.security?.cleared || ["google"];
  const nextGate = required.find((l) => !cleared.includes(l));
  if (nextGate === "passkey") return <PasskeyGate onDone={load} />;
  if (nextGate === "otp") return <OtpGate onDone={load} />;

  return <AdminShell user={auth.user} onLogout={logout} />;
}
