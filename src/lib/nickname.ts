import { sanitizeDisplayName } from "./sanitize";

export const NICKNAME_KEY = "ta:nickname";

export function sanitizeNickname(value: string): string {
  const normalized = sanitizeDisplayName(value.normalize("NFC"), 24);
  return normalized.length >= 2 ? normalized : "";
}

export function getLocalNickname(): string | null {
  if (typeof window === "undefined") return null;
  const value = sanitizeNickname(localStorage.getItem(NICKNAME_KEY) ?? "");
  return value || null;
}

export function setLocalNickname(value: string): string {
  const nickname = sanitizeNickname(value);
  if (!nickname) throw new Error("Nickname must be 2–24 letters, numbers, spaces, or simple punctuation");
  try {
    localStorage.setItem(NICKNAME_KEY, nickname);
  } catch {
    // Shared actions can still proceed if local storage is unavailable.
  }
  return nickname;
}

export function clearLocalNickname(): void {
  if (typeof window !== "undefined") localStorage.removeItem(NICKNAME_KEY);
}
