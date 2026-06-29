export default function WaveBar({ delay = "0s", active = false }) {
  return (
    <div
      className="w-[4px] rounded-[4px]"
      style={{
        height: active ? "6px" : "6px",
        background: "linear-gradient(to top, #0EA5E9, #38BDF8)",
        animation: active ? `wave 0.9s ease-in-out ${delay} infinite` : "none",
      }}
    />
  );
}

