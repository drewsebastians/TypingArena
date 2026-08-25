// Sanitization for user-generated content (custom tests, titles, names).
// React escapes on render; these rules defend data integrity and layout abuse.

export function sanitizeCustomText(input: string, maxLen = 4000): string {
  let s = input.normalize("NFC");
  // Strip control characters except \n and tab.
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  // Cap consecutive blank lines to one.
  s = s.replace(/\n{3,}/g, "\n\n");
  // No line longer than 200 chars (layout abuse).
  s = s
    .split("\n")
    .map((l) => (l.length > 200 ? l.slice(0, 200) : l))
    .join("\n");
  s = s.trim();
  return s.slice(0, maxLen);
}

export function sanitizeTitle(input: string, maxLen = 80): string {
  return input
    .normalize("NFC")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeDisplayName(input: string, maxLen = 24): string {
  return input.replace(/[^\w\-. ]/g, "").trim().slice(0, maxLen);
}

/** Invite/challenge codes: unguessable-ish alphabet without ambiguous glyphs. */
export function isValidCode(code: string): boolean {
  return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,16}$/.test(code);
}
