// Product day-boundary helpers.
//
// DECISION (ADR-002): TypingArena defines a "product day" for the Daily Arena and
// streaks as the calendar date in Asia/Jakarta (UTC+7). Indonesia has no daylight
// saving time, so a fixed offset is deterministic forever. Client code and the
// database (see supabase/migrations) MUST both use this boundary so challenge
// dates always agree.

export const ARENA_TZ_OFFSET_MINUTES = 7 * 60; // Asia/Jakarta = UTC+7, no DST

/** "YYYY-MM-DD" for an instant, in the product timezone. */
export function arenaDateString(input: Date | number | string): string {
  const ms = typeof input === "string" ? Date.parse(input) : +input;
  if (Number.isNaN(ms)) throw new Error(`Invalid date input: ${String(input)}`);
  const shifted = new Date(ms + ARENA_TZ_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/** Instant range [startUtcMs, endUtcMs) covering a product-date string. */
export function arenaDayRange(dateStr: string): { startUtcMs: number; endUtcMs: number } {
  const startUtcMs = Date.parse(`${dateStr}T00:00:00Z`) - ARENA_TZ_OFFSET_MINUTES * 60_000;
  return { startUtcMs, endUtcMs: startUtcMs + 86_400_000 };
}

export function addArenaDays(dateStr: string, days: number): string {
  const { startUtcMs } = arenaDayRange(dateStr);
  return arenaDateString(startUtcMs + days * 86_400_000);
}

/** Days between two product-date strings (b - a). */
export function arenaDaysBetween(a: string, b: string): number {
  const diff = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(diff / 86_400_000);
}
