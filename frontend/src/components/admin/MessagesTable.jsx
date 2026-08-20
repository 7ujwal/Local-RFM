import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const MessagesTable = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/messages")
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="admin-messages-table">
      {loading ? (
        <p className="meta text-smoke">Loading messages…</p>
      ) : rows.length === 0 ? (
        <p className="text-smoke text-sm border border-line p-6" data-testid="admin-messages-empty">No enquiries yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((m) => (
            <div key={m.id} className="border border-line bg-inkraised p-5" data-testid={`admin-message-row-${m.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-paper text-sm font-medium">{m.name}</p>
                <p className="meta text-smoke">{new Date(m.created_at).toLocaleString("en-IN")}</p>
              </div>
              <p className="meta text-gold">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
              <p className="text-smoke text-sm mt-3 leading-relaxed">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
