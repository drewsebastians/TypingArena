import { arenaDateString, arenaDaysBetween } from "./datetime";

// Ranked seasons — deterministic monthly buckets over the product day
// (Asia/Jakarta). No mutable season table: season identity is pure math, so
// history can never be rewritten and archives are stable forever.

export interface Season {
  id: string; // "2026-08"
  label: string;
  startDay: string; // product-date inclusive
  endDay: string; // inclusive
}

function daysInMonth(year: number, month1based: number): number {
  return new Date(Date.UTC(year, month1based, 0)).getUTCDate();
}

export function seasonForDay(day: string): Season {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const last = String(daysInMonth(year, month)).padStart(2, "0");
  return {
    id: `${year}-${String(month).padStart(2, "0")}`,
    label: new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    startDay: `${year}-${String(month).padStart(2, "0")}-01`,
    endDay: `${year}-${String(month).padStart(2, "0")}-${last}`,
  };
}

export function currentSeason(now: number = Date.now()): Season {
  return seasonForDay(arenaDateString(now));
}

/** The most recent `count` seasons ending with the current one. */
export function recentSeasons(count = 6, now: number = Date.now()): Season[] {
  const out: Season[] = [];
  const today = arenaDateString(now);
  // Walk back month-by-month from the first of the current month.
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7));
  for (let i = 0; i < count; i++) {
    out.push(seasonForDay(`${y}-${String(m).padStart(2, "0")}-15`));
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

export function seasonContains(season: Season, scoredAtMs: number): boolean {
  const day = arenaDateString(scoredAtMs);
  return arenaDaysBetween(season.startDay, day) >= 0 && arenaDaysBetween(day, season.endDay) >= 0;
}
