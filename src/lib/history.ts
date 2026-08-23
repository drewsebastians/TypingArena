"use client";
import type { TypingResult, DictationResult } from "./types";

const KEYS = {
  typing: "ta:typing_history",
  dictation: "ta:dictation_history",
  xp: "ta:xp",
  streak: "ta:streak",
  lastVisit: "ta:last_visit",
  username: "ta:username",
  consent: "ta:consent",
};

export function loadTypingHistory(): TypingResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.typing);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export function saveTypingResult(r: TypingResult) {
  const arr = loadTypingHistory();
  arr.unshift(r);
  localStorage.setItem(KEYS.typing, JSON.stringify(arr.slice(0, 200)));
  updateStreak();
}
export function loadDictationHistory(): DictationResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.dictation);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export function saveDictationResult(r: DictationResult) {
  const arr = loadDictationHistory();
  arr.unshift(r);
  localStorage.setItem(KEYS.dictation, JSON.stringify(arr.slice(0, 200)));
  updateStreak();
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.username);
}
export function setUsername(name: string) {
  localStorage.setItem(KEYS.username, name);
}

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEYS.streak) || "0", 10);
}
function updateStreak() {
  const today = new Date().toISOString().slice(0,10);
  const last = localStorage.getItem(KEYS.lastVisit);
  if (last === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  let streak = parseInt(localStorage.getItem(KEYS.streak) || "0", 10);
  if (last === yesterday) streak += 1;
  else if (last !== today) streak = last ? 1 : 1; // first or break
  // if no last, start 1
  if (!last) streak = 1;
  localStorage.setItem(KEYS.streak, String(streak));
  localStorage.setItem(KEYS.lastVisit, today);
}

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  // XP = sum WPM weighted
  const hist = loadTypingHistory();
  return hist.reduce((sum, r) => sum + Math.round(r.wpm * (r.accuracy/100) * 2), 0);
}

export function clearHistory() {
  localStorage.removeItem(KEYS.typing);
  localStorage.removeItem(KEYS.dictation);
  localStorage.removeItem(KEYS.streak);
  localStorage.removeItem(KEYS.lastVisit);
}
