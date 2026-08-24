"use client";
// DEVELOPMENT-ONLY speech-synthesis fallback.
//
// This module exists solely for local development when static audio assets
// have not been generated. It is dynamically imported behind a
// `process.env.NODE_ENV === "production"` guard in DictationEngine /
// TranscriptionEngine, so Next.js strips it from production bundles entirely
// (verified in CI by scanning the build output for `speechSynthesis`).
//
// PRODUCTION NEVER USES THIS. Production dictation/transcription always plays
// pre-generated static audio files.

export function speakOnce(text: string, lang: "en" | "id", rate: number, onEnd?: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "id" ? "id-ID" : "en-US";
  u.rate = rate;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
