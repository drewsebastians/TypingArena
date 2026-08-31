// Client-safe helpers for resource-scoped management links. The secret stays
// in the URL fragment and is never included in analytics or public metadata.

export type ManagedResourceType = "team" | "custom" | "assessment";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,512}$/;

export function isManagedResourceType(value: string): value is ManagedResourceType {
  return value === "team" || value === "custom" || value === "assessment";
}

export function sanitizeManagementToken(value: string): string | null {
  const token = value.trim();
  return TOKEN_PATTERN.test(token) ? token : null;
}

export function parseManageFragment(hash: string): string | null {
  const raw = hash.replace(/^#/, "").split("&").find((part) => part.startsWith("manage="));
  if (!raw) return null;
  try {
    return sanitizeManagementToken(decodeURIComponent(raw.slice("manage=".length)));
  } catch {
    return null;
  }
}

export function stripManageFragment(hash: string): string {
  const parts = hash.replace(/^#/, "").split("&").filter((part) => part && !part.startsWith("manage="));
  return parts.length > 0 ? `#${parts.join("&")}` : "";
}

export function redactSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 10) return "••••";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function generateCapabilityToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("Secure randomness is required for management links");
  }
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
