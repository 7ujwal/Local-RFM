import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { api, INR } from "@/lib/api";

const STATUS_STYLE = {
  paid: "text-gold border-gold/50",
  demo_confirmed: "text-saffron border-saffron/50",
  pending: "text-smoke border-line",
  failed: "text-danger border-danger/50",
};

export const BookingsTable = () => {
  const [rows, setRows] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/admin/bookings").then((r) => setRows(r.data)).catch(() => {}),
      api.get("/admin/waitlist").then((r) => setWaitlist(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get("/admin/bookings.csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rohru-bookings.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Bookings CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div data-testid="admin-bookings-table">
      <div className="flex items-center justify-between gap-4 mb-6">
        <p className="meta text-smoke">{rows.length} booking{rows.length === 1 ? "" : "s"}</p>
        <button onClick={exportCsv} disabled={exporting} data-testid="admin-bookings-export-button" className="btn-ghost !px-4 !py-2">
          <Download size={13} /> {exporting ? "Preparing…" : "Export CSV"}
        </button>
      </div>
      {loading ? (
        <p className="meta text-smoke">Loading bookings…</p>
      ) : rows.length === 0 ? (
        <p className="text-smoke text-sm border border-line p-6" data-testid="admin-bookings-empty">No bookings received yet.</p>
      ) : (
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Event", "Name", "Phone", "People", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="meta text-smoke font-normal p-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((b) => (
                <tr key={b.id} data-testid={`admin-booking-row-${b.id}`}>
                  <td className="p-4 text-paper">{b.event_name}</td>
                  <td className="p-4 text-paper">{b.name}</td>
                  <td className="p-4 text-smoke font-mono text-xs">{b.phone}</td>
                  <td className="p-4 text-paper">{b.pax}</td>
                  <td className="p-4 text-gold font-mono text-xs">{INR(b.amount)}</td>
                  <td className="p-4">
                    <span className={`meta border px-2 py-1 ${STATUS_STYLE[b.payment_status] || STATUS_STYLE.pending}`} data-testid={`admin-booking-status-${b.id}`}>
                      {b.payment_status === "demo_confirmed" ? "demo" : b.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-smoke font-mono text-xs">{new Date(b.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="font-display text-2xl uppercase text-paper mt-12 mb-4">
        Waitlist <span className="text-smoke text-lg">({waitlist.length})</span>
      </h3>
      {waitlist.length === 0 ? (
        <p className="text-smoke text-sm border border-line p-6" data-testid="admin-waitlist-empty">
          No one waiting yet. When an event sells out, visitors can leave their name and number here.
        </p>
      ) : (
        <div className="border border-line divide-y divide-line" data-testid="admin-waitlist-table">
          {waitlist.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4" data-testid={`admin-waitlist-row-${w.id}`}>
              <p className="text-paper text-sm font-medium">{w.name}</p>
              <p className="text-smoke font-mono text-xs">{w.phone}</p>
              <p className="meta text-gold">{w.event_name}</p>
              <p className="meta text-smoke ml-auto">{new Date(w.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
