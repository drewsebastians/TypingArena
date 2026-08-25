// supabase/functions/tournament-api/index.ts
// Deno Deploy (Supabase Edge Function) — Tournament API v1.
//
// Integration surface for external organizers:
//   POST /v1/tournaments            create a tournament (returns id)
//   GET  /v1/tournaments/:id        get tournament + standings
//   POST /v1/tournaments/:id/attach attach an accepted attempt by client_id
//
// AUTH: `Authorization: Bearer <api key>` — keys live hashed in public.api_keys.
// The plaintext key is shown once at creation (via SQL from a Supabase session)
// and never stored. Rate limiting is enforced per key in-process (per isolate).
// No private data (emails) is ever returned.
//
// Deploy:  supabase functions deploy tournament-api --no-verify-jwt=false
// Env:     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected by platform)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.224.0/hash/sha256.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= max;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!rateLimit("global", 600, 60_000)) return json({ error: "rate_limited" }, 429);

  const auth = req.headers.get("authorization") ?? "";
  const apiKey = auth.replace(/^Bearer\s+/i, "");
  if (!apiKey) return json({ error: "missing_api_key" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const keyHash = createHash("sha256").update(apiKey).toString("hex");
  const keyRow = await admin.from("api_keys").select("id,revoked").eq("key_hash", keyHash).maybeSingle();
  if (!keyRow.data || (keyRow.data as { revoked: boolean }).revoked) return json({ error: "invalid_api_key" }, 401);
  if (!rateLimit(`key:${keyRow.data.id}`, 60, 60_000)) return json({ error: "rate_limited" }, 429);

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // [v1, tournaments, ...]

  // POST /v1/tournaments
  if (req.method === "POST" && parts[0] === "v1" && parts[1] === "tournaments" && parts.length === 2) {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.slice(0, 80) : null;
    if (!name) return json({ error: "invalid_name" }, 400);
    const { data, error } = await admin
      .from("tournaments")
      .insert({ owner_key_id: keyRow.data.id, name })
      .select("id,name,created_at")
      .single();
    if (error) return json({ error: "db_error", detail: error.message }, 500);
    return json({ tournament: data }, 201);
  }

  // GET /v1/tournaments/:id
  if (req.method === "GET" && parts.length === 3) {
    const id = parts[2];
    const t = await admin.from("tournaments").select("id,name,created_at").eq("id", id).maybeSingle();
    if (!t.data) return json({ error: "not_found" }, 404);
    const standings = await admin
      .from("tournament_entries")
      .select("display_name,wpm,accuracy,created_at")
      .eq("tournament_id", id)
      .order("wpm", { ascending: false })
      .limit(100);
    return json({ tournament: t.data, standings: standings.data ?? [] });
  }

  // POST /v1/tournaments/:id/attach — attach a SERVER-ACCEPTED ranked attempt
  if (req.method === "POST" && parts.length === 4 && parts[3] === "attach") {
    const body = await req.json().catch(() => null);
    const clientId = String(body?.client_id ?? "").slice(0, 64);
    const displayName = String(body?.display_name ?? "player").slice(0, 24);
    if (!clientId) return json({ error: "invalid_client_id" }, 400);
    const attempt = await admin
      .from("attempts")
      .select("id,wpm,accuracy,integrity,ranked_accepted,user_id")
      .eq("client_id", clientId)
      .eq("ranked_accepted", true)
      .maybeSingle();
    if (!attempt.data) return json({ error: "accepted_ranked_attempt_not_found" }, 404);
    const a = attempt.data as { id: string; wpm: number; accuracy: number };
    const profile = await admin.from("profiles").select("username").eq("id", (attempt.data as { user_id: string }).user_id).maybeSingle();
    const { error } = await admin.from("tournament_entries").insert({
      tournament_id: parts[2],
      attempt_id: a.id,
      display_name: (profile.data as { username: string | null })?.username ?? displayName,
      wpm: a.wpm,
      accuracy: a.accuracy,
    });
    if (error?.message.includes("duplicate")) return json({ ok: true, duplicate: true });
    if (error) return json({ error: "db_error", detail: error.message }, 500);
    return json({ ok: true }, 201);
  }

  return json({ error: "not_found" }, 404);
});
