 
import useVapi from "../hooks/useVapi.js";
import BookingCard from "./BookingCard.jsx";
import ThinkingDots from "./ThinkingDots.jsx";
import TranscriptPanel from "./TranscriptPanel.jsx";
import UrgencyBadge from "./UrgencyBadge.jsx";
import WaveBar from "./WaveBar.jsx";

function StatusPill({ callState }) {
  const active = ["active", "thinking", "speaking"].includes(callState);
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[12px] font-semibold text-slate-600 shadow-sm">
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`}>
        {active ? (
          <span className="block h-2 w-2 rounded-full bg-emerald-500 opacity-60 animate-ping" />
        ) : null}
      </span>
      {active ? "AI Active" : "Standby"}
    </div>
  );
}

function fadeStyle(delay) {
  return { animation: `fadeSlideUp 420ms ease-out both`, animationDelay: delay };
}

export default function ClinicVoiceAgent() {
  const { callState, messages, transcript, booking, urgency, error, startCall, endCall } = useVapi();

  const active = ["active", "thinking", "speaking"].includes(callState);
  const isThinking = callState === "thinking";
  const isSpeaking = callState === "speaking";

  const statusText =
    callState === "connecting"
      ? "Connecting…"
      : isSpeaking
        ? "Speaking"
        : isThinking
          ? "Processing"
          : active
            ? "Listening"
            : callState === "ended"
              ? "Call ended"
              : "Ready to assist";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #0D9488, #0EA5E9)" }}
            >
              <span className="text-lg font-black">⚡</span>
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[18px]">CarePoint Clinic</div>
              <div className="text-[11px] font-semibold tracking-widest text-slate-400">
                HEALTHCARE INTELLIGENCE
              </div>
            </div>
          </div>

          <StatusPill callState={callState} />
        </div>

        <div className="relative mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="relative overflow-hidden rounded-3xl bg-white/40 p-8 backdrop-blur-sm">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(14,165,233,0.6), rgba(14,165,233,0) 60%)",
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(13,148,136,0.6), rgba(13,148,136,0) 60%)",
              }}
            />

            <div className="mx-auto max-w-2xl text-center">
              <div
                className="mx-auto inline-flex items-center rounded-full px-4 py-2 text-[12px] font-semibold text-sky-700"
                style={{ backgroundColor: "rgba(14,165,233,0.10)" }}
              >
                AI-Powered Reception
              </div>

              <h1
                className="mt-8 font-serif text-[56px] leading-[1.05] text-slate-900"
                style={fadeStyle("0s")}
              >
                Hello, I’m <span style={{ color: "#0EA5E9" }}>Aria</span>.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500" style={fadeStyle("0.1s")}>
                Your dedicated AI health assistant. I can help you book appointments, check symptoms,
                and manage your health records in real-time.
              </p>

              <div className="mt-10 flex justify-center" style={fadeStyle("0.2s")}>
                {callState === "idle" ? (
                  <button
                    onClick={startCall}
                    className="group relative inline-flex items-center gap-3 rounded-full px-8 py-4 text-[14px] font-semibold text-white shadow-[0_18px_40px_rgba(14,165,233,0.35)] transition-transform hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #0D9488, #0EA5E9)" }}
                  >
                    <span className="text-base">📞</span>
                    Talk to Aria
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_0_6px_rgba(14,165,233,0.15)]" />
                  </button>
                ) : null}

                {callState === "connecting" ? (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-white"
                      style={{
                        background: "linear-gradient(135deg, #0D9488, #0EA5E9)",
                        animation: "pulse-ring 1.2s ease-out infinite",
                      }}
                    >
                      📞
                    </div>
                    <div className="text-[13px] font-semibold text-slate-600">Connecting to Aria…</div>
                  </div>
                ) : null}

                {active ? (
                  <div className="w-full max-w-xl">
                    <div
                      className={`flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.10)] ${
                        isSpeaking ? "ring-2 ring-sky-300" : ""
                      }`}
                      style={fadeStyle("0s")}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                          style={{ background: "linear-gradient(135deg, #0D9488, #0EA5E9)" }}
                        >
                          🤖
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-800">Aria</div>
                            {urgency ? <UrgencyBadge level={urgency} /> : null}
                          </div>
                          <div className="text-[12px] font-semibold text-slate-400">{statusText}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isThinking ? (
                          <ThinkingDots />
                        ) : (
                          <div className="flex items-end gap-[6px]">
                            {Array.from({ length: 7 }).map((_, i) => (
                              <WaveBar key={i} delay={`${i * 0.08}s`} active={isSpeaking} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={endCall}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-6 py-3 text-[13px] font-semibold text-rose-600 shadow-sm hover:bg-rose-100"
                      >
                        🔴 End Call
                      </button>
                    </div>
                  </div>
                ) : null}

                {callState === "ended" ? (
                  <div className="flex flex-col items-center gap-3" style={fadeStyle("0s")}>
                    <div className="text-[13px] font-semibold text-emerald-700">
                      ✅ Call ended — Appointment booked!
                    </div>
                    <button
                      onClick={startCall}
                      className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Start New Call
                    </button>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-rose-50 p-4 text-left text-[13px] text-rose-700">
                  <div className="font-semibold">Error</div>
                  <div className="mt-1 opacity-90">{error}</div>
                  <button
                    className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white"
                    onClick={startCall}
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              <div className="mt-10 grid gap-3 md:grid-cols-3" style={fadeStyle("0.3s")}>
                {[
                  ["<1s", "Response Time"],
                  ["24/7", "Available"],
                  ["100%", "Agentic"],
                ].map(([v, k]) => (
                  <div key={k} className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur">
                    <div className="text-xl font-bold text-slate-900">{v}</div>
                    <div className="mt-1 text-[12px] font-semibold text-slate-400">{k}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-white/70 p-5 text-left shadow-sm backdrop-blur" style={fadeStyle("0.35s")}>
                <div className="text-[13px] font-semibold text-slate-700">How Aria Works</div>
                <div className="mt-4 grid gap-3 text-[13px] text-slate-600 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div>🎙️</div>
                    <div>Speak naturally about your symptoms</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>🧠</div>
                    <div>Aria assesses urgency instantly</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>📅</div>
                    <div>Finds the right slot for you</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>✅</div>
                    <div>Books and confirms in real-time</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 text-[12px] font-semibold text-slate-400">
                CarePoint Clinic · Powered by Aria Voice AI
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ background: "linear-gradient(135deg, #0D9488, #0EA5E9)" }}
                >
                  🖥️
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">Aria</div>
                  <div className="text-[12px] font-semibold text-slate-400">{statusText}</div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">
                STATUS: {urgency ? urgency.toUpperCase() : "NORMAL"}
              </div>
            </div>

            <TranscriptPanel messages={messages} transcript={transcript} callState={callState} />

            {booking ? (
              <>
                <BookingCard booking={booking} />
                <div className="rounded-2xl bg-emerald-50 p-4 text-[12px] font-semibold text-emerald-700">
                  ✓ Verifiable State Change
                  <div className="mt-1 text-[12px] font-medium text-emerald-700/80">
                    Row written to appointments table in Supabase
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-white p-4 text-[12px] font-semibold text-slate-400 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                PATIENT BIO
                <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[12px] font-medium text-slate-500">
                  No patient identified
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

