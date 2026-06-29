export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-[5px]">
      {["0s", "0.2s", "0.4s"].map((d) => (
        <div
          key={d}
          className="h-[7px] w-[7px] rounded-full"
          style={{
            backgroundColor: "#0EA5E9",
            animation: `thinking-dot 1s ease-in-out ${d} infinite`,
          }}
        />
      ))}
    </div>
  );
}

