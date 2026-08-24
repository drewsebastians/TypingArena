// Daily Arena — deterministic shared daily challenge.
//
// Everyone completing the arena on the same product-date (Asia/Jakarta) gets
// the identical exercise pair. Selection is a pure function of
// (date, CHALLENGE_VERSION) — no randomness, no runtime generation.
//
// The challenge VERSION participates in the seed so changing the content pool
// changes every future selection deterministically instead of silently mixing.

import { ENGLISH_CORPUS } from "./content/english";
import { INDONESIAN_CORPUS } from "./content/indonesian";
import { DICTATION_CLIPS } from "./content/dictation";
import { CHALLENGE_VERSION } from "./types";
import type { CorpusItem, DictationItem } from "./types";
import { arenaDateString } from "./datetime";

/** FNV-1a 32-bit — deterministic across platforms. */
export function dailySeed(dateStr: string): number {
  const input = `${dateStr}|${CHALLENGE_VERSION}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const DAILY_TYPING_POOL = [...ENGLISH_CORPUS, ...INDONESIAN_CORPUS].filter(
  (item) => item.mode === "sprint" || item.mode === "copy-pro",
);

export interface DailyChallenge {
  iso: string;
  seed: number;
  typing: CorpusItem;
  dictation: DictationItem;
  /** Primary mode for the day; both are always available. */
  focus: "typing" | "dictation";
}

export function getDailyChallengeForDate(dateStr: string): DailyChallenge {
  const seed = dailySeed(dateStr);
  if (DAILY_TYPING_POOL.length === 0 || DICTATION_CLIPS.length === 0) {
    throw new Error("Daily challenge pools are empty");
  }
  const typing = DAILY_TYPING_POOL[seed % DAILY_TYPING_POOL.length];
  const dictation = DICTATION_CLIPS[Math.floor(seed / DAILY_TYPING_POOL.length) % DICTATION_CLIPS.length];
  return {
    iso: dateStr,
    seed,
    typing,
    dictation,
    focus: seed % 2 === 0 ? "typing" : "dictation",
  };
}

export function getDailyChallenge(now: Date | number = Date.now()): DailyChallenge {
  return getDailyChallengeForDate(arenaDateString(now));
}

export function formatDailyTitle(iso: string): string {
  // Displayed in both locales via Intl; date parsed as UTC noon to avoid TZ drift.
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
