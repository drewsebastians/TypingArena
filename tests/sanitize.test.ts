import { describe, expect, it } from "vitest";
import { sanitizeCustomText, sanitizeTitle, sanitizeDisplayName, isValidCode } from "@/lib/sanitize";

describe("user content sanitization", () => {
  it("strips control characters but keeps newlines/tabs", () => {
    expect(sanitizeCustomText("a\u0000b\u0007c\nd")).toBe("abc\nd");
  });
  it("caps consecutive blank lines and line length", () => {
    const out = sanitizeCustomText("a\n\n\n\n\nb" + "x".repeat(300));
    expect(out).not.toMatch(/\n{3,}/);
    for (const line of out.split("\n")) expect(line.length).toBeLessThanOrEqual(200);
  });
  it("enforces max length across multi-line input", () => {
    const input = ("x".repeat(190) + "\n").repeat(25); // ~4775 chars
    expect(sanitizeCustomText(input).length).toBeLessThanOrEqual(4000);
    const single = sanitizeCustomText("y".repeat(5000));
    expect(single.length).toBeLessThanOrEqual(200); // single line also capped per-line
  });
  it("titles drop angle brackets and collapse whitespace", () => {
    expect(sanitizeTitle("  <script>alert(1)</script>  Drill ")).toBe("scriptalert(1)/script Drill");
  });
  it("display names allow only safe characters", () => {
    expect(sanitizeDisplayName('Budi "setiawan" 🚀@x')).toBe("Budi setiawan x");
  });
  it("code validation rejects ambiguous/short codes", () => {
    expect(isValidCode("AB23CD")).toBe(true);
    expect(isValidCode("O0I1")).toBe(false); // ambiguous glyphs excluded from alphabet
    expect(isValidCode("ab!!")).toBe(false);
    expect(isValidCode("TOOLONGCODE16X")).toBe(false);
  });
});
