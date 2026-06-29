export default function BookingCard({ booking }) {
  if (!booking) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl"
      style={{
        background: "linear-gradient(135deg, #0D9488, #0EA5E9)",
        animation: "cardReveal 420ms ease-out both",
      }}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -top-14 h-20 w-20 rounded-full bg-white/10" />

      <div className="mb-3 text-[12px] font-semibold tracking-wide text-white/90">
        ✓ Appointment Confirmed
      </div>

      <div className="font-serif text-2xl leading-tight">{booking.patient_name}</div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        {[
          ["Date", booking.date],
          ["Time", booking.time],
          ["Doctor", booking.doctor],
          ["Urgency", booking.urgency],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/12 p-3 backdrop-blur">
            <div className="text-[11px] text-white/80">{k}</div>
            <div className="mt-1 font-semibold">{v || "-"}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[12px] text-white/90">
        Booking ID: <span className="font-semibold">{booking.booking_id}</span>
      </div>
    </div>
  );
}

