import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";

export const WaitlistDialog = ({ event, open, onOpenChange }) => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const close = (v) => {
    onOpenChange(v);
    if (!v) setDone(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || form.phone.trim().length < 8) {
      toast.error("Please enter your name and a valid phone number");
      return;
    }
    setBusy(true);
    try {
      await api.post("/waitlist", { event_id: event.id, ...form });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not join the waitlist. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-inkraised border-line text-paper max-w-md" data-testid="waitlist-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide text-paper">
            Waitlist — {event.name}
          </DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="py-6 text-center" data-testid="waitlist-success">
            <CheckCircle2 className="mx-auto text-gold" size={44} />
            <p className="font-display text-2xl uppercase mt-4">You're in the queue</p>
            <p className="text-smoke text-sm mt-2">
              If a spot opens for {event.date}, you're getting the first call.
            </p>
            <button onClick={() => close(false)} data-testid="waitlist-done-button" className="btn-orange mt-6 w-full">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-1" data-testid="waitlist-form">
            <p className="text-smoke text-sm">
              This one is full. Leave your details and we'll call you before anyone else when a spot opens
              or a new batch drops.
            </p>
            <div>
              <label htmlFor="waitlist-name" className="meta text-smoke block mb-1.5">Full Name</label>
              <input
                id="waitlist-name"
                data-testid="waitlist-name-input"
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="waitlist-phone" className="meta text-smoke block mb-1.5">Phone Number</label>
              <input
                id="waitlist-phone"
                data-testid="waitlist-phone-input"
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 …"
                required
              />
            </div>
            <button type="submit" data-testid="waitlist-submit-button" disabled={busy} className="btn-orange w-full">
              {busy ? "Joining…" : "Join the Waitlist"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
