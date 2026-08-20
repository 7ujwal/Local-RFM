import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, loadRazorpay, INR } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

export const BookingDialog = ({ event, open, onOpenChange, onBooked }) => {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ name: "", phone: "", pax: 1 });
  const [booking, setBooking] = useState(null);

  const close = (v) => {
    onOpenChange(v);
    if (!v) {
      setStep("form");
      setBooking(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || form.phone.trim().length < 8) {
      toast.error("Please enter your name and a valid phone number");
      return;
    }
    setStep("paying");
    try {
      const { data } = await api.post("/bookings", {
        event_id: event.id,
        name: form.name,
        phone: form.phone,
        pax: Number(form.pax),
      });
      setBooking(data);
      if (data.demo_mode) {
        setStep("success");
        onBooked?.();
        return;
      }
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error("sdk");
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: "INR",
        name: "Roaming From Rohru",
        description: event.name,
        order_id: data.order_id,
        prefill: { name: form.name, contact: form.phone },
        theme: { color: "#F05A28" },
        handler: async (resp) => {
          try {
            await api.post("/payments/verify", {
              booking_id: data.booking_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setStep("success");
            onBooked?.();
          } catch {
            setStep("error");
          }
        },
        modal: { ondismiss: () => setStep("form") },
      });
      rzp.on("payment.failed", () => setStep("error"));
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not start the booking. Please try again.");
      setStep("form");
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-inkraised border-line text-paper max-w-md" data-testid="booking-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide text-paper">
            Book — {event.name}
          </DialogTitle>
        </DialogHeader>

        {step === "success" ? (
          <div className="py-6 text-center" data-testid="booking-success">
            <CheckCircle2 className="mx-auto text-gold" size={44} />
            <p className="font-display text-2xl uppercase mt-4">You're on the list</p>
            <p className="text-smoke text-sm mt-2">
              Booking ref <span className="font-mono text-gold">{booking?.booking_id?.slice(0, 8).toUpperCase()}</span>
              {booking ? ` · ${INR(booking.amount_inr)} for ${form.pax} ${form.pax > 1 ? "people" : "person"}` : ""}
            </p>
            {booking?.demo_mode && (
              <p className="meta text-saffron mt-4" data-testid="booking-demo-note">
                Payment gateway in test mode — booking recorded without charge
              </p>
            )}
            <p className="text-smoke text-sm mt-3">We'll call you within 24 hours to confirm details.</p>
            <button onClick={() => close(false)} data-testid="booking-done-button" className="btn-orange mt-6 w-full">
              Done
            </button>
          </div>
        ) : step === "error" ? (
          <div className="py-6 text-center" data-testid="booking-error">
            <p className="font-display text-2xl uppercase text-danger">Payment failed</p>
            <p className="text-smoke text-sm mt-2">No money was captured. You can try paying again.</p>
            <button onClick={() => setStep("form")} data-testid="booking-retry-button" className="btn-orange mt-6 w-full">
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-1" data-testid="booking-form">
            <div className="border border-line p-3 flex justify-between items-center text-sm">
              <span className="text-smoke">{event.date} · {event.location}</span>
              <span className="font-mono text-gold" data-testid="booking-event-price">{INR(event.price)}/person</span>
            </div>
            <div>
              <label htmlFor="booking-name" className="meta text-smoke block mb-1.5">Full Name</label>
              <input
                id="booking-name"
                data-testid="booking-name-input"
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="booking-phone" className="meta text-smoke block mb-1.5">Phone Number</label>
              <input
                id="booking-phone"
                data-testid="booking-phone-input"
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 …"
                required
              />
            </div>
            <div>
              <label htmlFor="booking-pax" className="meta text-smoke block mb-1.5">Number of People</label>
              <input
                id="booking-pax"
                data-testid="booking-pax-input"
                type="number"
                min="1"
                max={Math.min(20, event.available_spots)}
                className="field"
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="meta text-smoke">Total</span>
              <span className="font-display text-2xl text-paper" data-testid="booking-total">
                {INR(event.price * Number(form.pax || 1))}
              </span>
            </div>
            <button
              type="submit"
              data-testid="booking-submit-button"
              disabled={step === "paying"}
              className="btn-orange w-full"
            >
              {step === "paying" ? "Opening payment…" : "Proceed to Pay"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
