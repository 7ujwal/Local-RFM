import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, BRAND } from "@/lib/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const sessionId = window.location.hash.split("session_id=")[1]?.split("&")[0];
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/admin");
      } catch (e) {
        const status = e.response?.status;
        toast.error(
          status === 403
            ? "This Google account is not the site owner"
            : "Sign-in failed. Please try again."
        );
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/admin");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-4" data-testid="auth-callback-screen">
      <img src={BRAND.badge} alt="Roaming From Rohru" className="h-16 w-16 animate-pulse" />
      <p className="meta text-smoke">Signing you in…</p>
    </div>
  );
}
