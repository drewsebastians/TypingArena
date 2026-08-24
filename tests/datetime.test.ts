import { describe, expect, it } from "vitest";
import { addArenaDays, arenaDateString, arenaDayRange, arenaDaysBetween } from "@/lib/datetime";

describe("product-day boundary (Asia/Jakarta UTC+7)", () => {
  it("maps 16:59 UTC (23:59 WIB) to same product day", () => {
    // 2026-08-24T16:59Z is 2026-08-24 23:59 WIB
    expect(arenaDateString("2026-08-24T16:59:00Z")).toBe("2026-08-24");
  });

  it("rolls over at 17:00 UTC (midnight WIB)", () => {
    expect(arenaDateString("2026-08-24T17:00:00Z")).toBe("2026-08-25");
  });

  it("UTC midnight is next product day", () => {
    expect(arenaDateString("2026-08-24T00:00:00Z")).toBe("2026-08-24");
    expect(arenaDateString("2026-08-24T00:30:00Z")).toBe("2026-08-24"); // 07:30 WIB
  });

  it("month and year rollovers are correct", () => {
    expect(arenaDateString("2025-12-31T17:00:00Z")).toBe("2026-01-01");
    expect(arenaDateString("2026-02-28T17:00:00Z")).toBe("2026-03-01"); // 2026 not a leap year
  });

  it("day range covers exactly the WIB calendar day", () => {
    const { startUtcMs, endUtcMs } = arenaDayRange("2026-08-24");
    expect(new Date(startUtcMs).toISOString()).toBe("2026-08-23T17:00:00.000Z");
    expect(endUtcMs - startUtcMs).toBe(86_400_000);
  });

  it("addArenaDays and daysBetween are consistent", () => {
    expect(addArenaDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addArenaDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(arenaDaysBetween("2026-08-24", "2026-08-25")).toBe(1);
    expect(arenaDaysBetween("2026-08-25", "2026-08-24")).toBe(-1);
  });

  it("rejects invalid input", () => {
    expect(() => arenaDateString("not-a-date")).toThrow();
  });
});
