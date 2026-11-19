import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { api } from "@/lib/api";

export const MessagesTable = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.get("/admin/messages")
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelected(prev =>
      prev.length === rows.length && rows.length > 0 ? [] : rows.map(r => r.id)
    );
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} message(s)? This cannot be undone.`)) return;
    try {
      await api.delete("/admin/messages", { data: { ids: selected } });
      toast.success(`Deleted ${selected.length} message(s)`);
      setSelected([]);
      api.get("/admin/messages").then(r => setRows(r.data));
    } catch {
      toast.error("Delete failed");
    }
  };

  const deleteOne = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      toast.success("Message deleted");
      api.get("/admin/messages").then(r => setRows(r.data));
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div data-testid="admin-messages-table">
      <div className="flex items-center justify-between gap-4 mb-6">
        <p className="meta text-smoke">{rows.length} message{rows.length === 1 ? "" : "s"}</p>
        {selected.length > 0 && (
          <button onClick={bulkDelete} data-testid="admin-messages-bulk-delete" className="btn-ghost !px-4 !py-2 text-danger">
            <Trash2 size={13} /> Delete Selected ({selected.length})
          </button>
        )}
      </div>
      {loading ? (
        <p className="meta text-smoke">Loading messages…</p>
      ) : rows.length === 0 ? (
        <p className="text-smoke text-sm border border-line p-6" data-testid="admin-messages-empty">No enquiries yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={toggleSelectAll} data-testid="admin-messages-select-all" className="meta text-smoke hover:text-paper">
              {selected.length === rows.length && rows.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
            <span className="meta text-smoke">Select all</span>
          </div>
          {rows.map((m) => (
            <div
              key={m.id}
              className={`border border-line bg-inkraised p-5 ${selected.includes(m.id) ? "border-saffron/50" : ""}`}
              data-testid={`admin-message-row-${m.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSelect(m.id)} data-testid={`admin-messages-select-${m.id}`}>
                    {selected.includes(m.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                  <p className="text-paper text-sm font-medium">{m.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="meta text-smoke">{new Date(m.created_at).toLocaleString("en-IN")}</p>
                  <button onClick={() => deleteOne(m.id)} data-testid={`admin-messages-delete-${m.id}`} className="text-danger hover:text-danger/80">
                    <Trash2 size={14} />
                  </button>
                </div>
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