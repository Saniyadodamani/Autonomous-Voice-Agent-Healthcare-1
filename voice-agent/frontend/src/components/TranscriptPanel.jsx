import { useEffect, useRef } from "react";

export default function TranscriptPanel({ messages, transcript, callState }) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    try {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }, [messages, transcript, callState]);

  const isLive = ["active", "thinking", "speaking"].includes(callState);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold tracking-wide text-slate-700">
          Live Transcript
        </div>
        {isLive ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
            <span className="relative h-2 w-2 rounded-full bg-emerald-500">
              <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ping" />
            </span>
            LIVE
          </div>
        ) : (
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            REAL-TIME
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="mt-4 h-[360px] overflow-auto pr-1"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <div className="text-2xl">🎙️</div>
            <div className="mt-2 text-[13px]">Press Talk to Aria to begin</div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={`${m.timestamp}-${idx}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  style={{ animation: "fadeSlideUp 240ms ease-out both" }}
                >
                  <div
                    className={`max-w-[86%] px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                      isUser
                        ? "text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                    style={
                      isUser
                        ? {
                            background:
                              "linear-gradient(135deg, #0D9488, #0EA5E9)",
                            borderRadius: "18px 18px 4px 18px",
                          }
                        : { borderRadius: "18px 18px 18px 4px" }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {transcript ? (
          <div className="mt-3 flex justify-end">
            <div
              className="max-w-[86%] px-4 py-3 text-[13px] italic text-white/80"
              style={{
                background: "linear-gradient(135deg, #0D9488, #0EA5E9)",
                borderRadius: "18px 18px 4px 18px",
                opacity: 0.5,
              }}
            >
              {transcript}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

