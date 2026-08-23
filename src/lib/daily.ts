import { ENGLISH_CORPUS } from "./content/english";
import { INDONESIAN_CORPUS } from "./content/indonesian";
import { DICTATION_EN, DICTATION_ID } from "./content/dictation";
import type { CorpusItem, DictationItem } from "./types";

// Daily Arena — deterministic daily challenge, same for all users. No server needed for MVP: hash(date)
export function dailySeed(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return h;
}

export function getDailyChallenge(date = new Date()) {
  const iso = date.toISOString().slice(0,10);
  const seed = dailySeed(iso);
  const allTyping = [...ENGLISH_CORPUS, ...INDONESIAN_CORPUS];
  const typing = allTyping[seed % allTyping.length];
  const dictPool = [...DICTATION_EN, ...DICTATION_ID];
  const dictation = dictPool[seed % dictPool.length];
  // alternate mode focus per day: even -> typing, odd -> dictation emphasis
  const focus = seed % 2 === 0 ? "typing" : "dictation";
  return { iso, seed, typing: typing as CorpusItem, dictation: dictation as DictationItem, focus };
}

export function formatDailyTitle(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
