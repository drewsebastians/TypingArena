"use client";

// Web Speech API wrapper for dictation audio — no ASR, deterministic TTS. Fail gracefully if unsupported.
export function speak(text: string, lang: "en" | "id", rate: number, onEnd?: () => void, onStart?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return null as unknown as SpeechSynthesisUtterance;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "id" ? "id-ID" : "en-US";
  u.rate = rate; // 0.1-10, we use 0.8 slow, 1.0 medium, 1.25 fast
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return u;
}

export function stopSpeak() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function rateForSpeed(speed: "slow" | "medium" | "fast") {
  if (speed === "slow") return 0.8;
  if (speed === "fast") return 1.25;
  return 1.0;
}
