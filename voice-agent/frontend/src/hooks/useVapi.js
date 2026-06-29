import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

function nowTs() {
  return new Date().toISOString();
}

function safeString(x) {
  if (typeof x === "string") return x;
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

export default function useVapi() {
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

  // ─────────────────────────────────────────
  // REFS — don't trigger re-renders
  // ─────────────────────────────────────────
  const vapiRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastUserSpokeAtRef = useRef(null);

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────
  const [callState, setCallState] = useState("idle");
  // idle | connecting | active | thinking | speaking | ended

  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [booking, setBooking] = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [error, setError] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // ─────────────────────────────────────────
  // STEP 1 — Initialize Vapi AFTER mount
  // useRef + useEffect avoids the React
  // "Should have a queue" crash from useMemo
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!publicKey) {
      console.error("❌ VITE_VAPI_PUBLIC_KEY is missing in .env");
      return;
    }
    try {
      vapiRef.current = new Vapi(publicKey);
      console.log(
        "✅ Vapi initialized with key:",
        publicKey.substring(0, 8) + "..."
      );
    } catch (e) {
      console.error("❌ Vapi init failed:", e);
    }

    // Cleanup on unmount
    return () => {
      try {
        if (vapiRef.current) vapiRef.current.stop();
      } catch {}
    };
  }, [publicKey]);

  // ─────────────────────────────────────────
  // STEP 2 — Register all event listeners
  // Runs once after Vapi is initialized
  // ─────────────────────────────────────────
  useEffect(() => {
    // Wait for next tick so vapiRef.current is ready
    const timeout = setTimeout(() => {
      const v = vapiRef.current;
      if (!v) return;

      // ── Call lifecycle ──────────────────────
      const onCallStart = () => {
        console.log("✅ Call started");
        setCallState("active");
        setError(null);
      };

      const onCallEnd = () => {
        console.log("📵 Call ended");
        setCallState("ended");
      };

      // ── Speech detection ────────────────────
      const onSpeechStart = () => {
        console.log("🔊 Aria speaking");
        setCallState("speaking");
      };

      const onSpeechEnd = () => {
        console.log("🔇 Aria done speaking");
        setCallState("active");
      };

      // ── Volume — keeps audio alive + waveform
      const onVolumeLevel = (level) => {
        setVolumeLevel(level); // 0 to 1
      };

      // ── Messages ────────────────────────────
      const onMessage = (message) => {
        try {
          if (!message || !message.type) return;

          console.log("📩 Message type:", message.type);

          // Transcripts
          if (message.type === "transcript") {
            const role = message.role || "user";

            if (message.transcriptType === "partial") {
              setTranscript(message.transcript || "");
            }

            if (message.transcriptType === "final") {
              setTranscript("");
              const text = message.transcript || "";

              if (text.trim()) {
                setMessages((prev) => [
                  ...prev,
                  { role, text, timestamp: nowTs() },
                ]);
              }

              if (role === "user") {
                lastUserSpokeAtRef.current = Date.now();
                setCallState("thinking");
              } else {
                setCallState("speaking");
              }
            }
          }

          // Tool call initiated
          if (message.type === "function-call") {
            console.log("🔧 Tool called:", message.functionCall?.name);
            console.log("📋 Params:", message.functionCall?.parameters);
          }

          // Tool call result — booking + urgency
          if (message.type === "function-call-result") {
            const result = message.result;
            console.log("🔧 Tool result:", result);

            // Handle result as object
            if (result && typeof result === "object") {
              if (result.booking) {
                console.log("📅 Booking received:", result.booking);
                setBooking(result.booking);
              }
              if (result.urgency) {
                console.log("🚨 Urgency:", result.urgency);
                setUrgency(result.urgency);
              }
            }

            // Handle result as JSON string
            if (typeof result === "string") {
              try {
                const parsed = JSON.parse(result);
                if (parsed.booking) setBooking(parsed.booking);
                if (parsed.urgency) setUrgency(parsed.urgency);
              } catch {
                // Plain string response — not JSON, ignore
              }
            }
          }

          // Conversation update
          if (message.type === "conversation-update") {
            console.log("💬 Conversation updated");
          }

        } catch (e) {
          console.error("❌ Message handler error:", e);
          setError(e?.message || "Failed to handle message");
        }
      };

      // ── Errors ──────────────────────────────
      const onError = (e) => {
        console.error("❌ Vapi error:", e);
        const msg = e?.message || safeString(e) || "Unknown Vapi error";
        setError(msg);
        setCallState("idle");
      };

      // Register all listeners
      v.on("call-start", onCallStart);
      v.on("call-end", onCallEnd);
      v.on("speech-start", onSpeechStart);
      v.on("speech-end", onSpeechEnd);
      v.on("volume-level", onVolumeLevel);
      v.on("message", onMessage);
      v.on("error", onError);

      // Cleanup
      return () => {
        try {
          v.off("call-start", onCallStart);
          v.off("call-end", onCallEnd);
          v.off("speech-start", onSpeechStart);
          v.off("speech-end", onSpeechEnd);
          v.off("volume-level", onVolumeLevel);
          v.off("message", onMessage);
          v.off("error", onError);
        } catch {}
      };
    }, 100); // small delay ensures vapiRef.current is set

    return () => clearTimeout(timeout);
  }, []); // runs once after mount

  // ─────────────────────────────────────────
  // RESET STATE
  // ─────────────────────────────────────────
  const reset = () => {
    setMessages([]);
    setTranscript("");
    setBooking(null);
    setUrgency(null);
    setError(null);
    setVolumeLevel(0);
    lastUserSpokeAtRef.current = null;
  };

  // ─────────────────────────────────────────
  // UNLOCK BROWSER AUDIO
  // Must be called inside a user gesture
  // ─────────────────────────────────────────
  const unlockAudio = async () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      console.log(
        "🔊 Audio context state:",
        audioContextRef.current.state
      );
    } catch (e) {
      console.warn("⚠️ Audio unlock warning (non-critical):", e);
    }
  };

  // ─────────────────────────────────────────
  // START CALL
  // ─────────────────────────────────────────
  const startCall = async () => {
    reset();
    setCallState("connecting");

    try {
      // Unlock browser audio on user click gesture
      await unlockAudio();

      // Validate
      if (!vapiRef.current) {
        throw new Error(
          "Vapi not initialized. Check VITE_VAPI_PUBLIC_KEY in .env"
        );
      }
      if (!assistantId) {
        throw new Error(
          "Missing VITE_VAPI_ASSISTANT_ID in frontend/.env"
        );
      }

      console.log(
        "📞 Starting call with assistant:",
        assistantId.substring(0, 8) + "..."
      );

      // Start the call
      await vapiRef.current.start(assistantId);

    } catch (e) {
      console.error("❌ Start call failed:", e);
      setError(e?.message || safeString(e));
      setCallState("idle");
    }
  };

  // ─────────────────────────────────────────
  // END CALL
  // ─────────────────────────────────────────
  const endCall = async () => {
    try {
      if (vapiRef.current) await vapiRef.current.stop();
      console.log("📵 Call stopped by user");
    } catch (e) {
      console.warn("⚠️ End call warning:", e);
    }
    setCallState("idle");
  };

  // ─────────────────────────────────────────
  // SEND TEXT (optional — programmatic messages)
  // ─────────────────────────────────────────
  const sendText = (text) => {
    try {
      if (vapiRef.current && text) {
        vapiRef.current.send({
          type: "add-message",
          message: { role: "user", content: text },
        });
      }
    } catch (e) {
      console.warn("⚠️ sendText error:", e);
    }
  };

  // ─────────────────────────────────────────
  // EXPORTS
  // ─────────────────────────────────────────
  return {
    callState,      // "idle"|"connecting"|"active"|"thinking"|"speaking"|"ended"
    messages,       // Array of {role, text, timestamp}
    transcript,     // Live partial text while user speaks
    booking,        // Populated after book_appointment tool call
    urgency,        // "normal"|"urgent"|"emergency"
    error,          // Error string or null
    volumeLevel,    // 0-1, drives waveform bar heights
    startCall,      // Call this on button click
    endCall,        // Call this to hang up
    sendText,       // Optional programmatic message
  };
}