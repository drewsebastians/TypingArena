"use client";
// Shared-product backend adapter (Supabase/Postgres, see ADR-001).
//
// Architecture decision: static-export frontend + Supabase direct client
// operations guarded by Row Level Security. This preserves cheap static hosting
// while making leaderboards / daily boards / friend challenges genuinely
// multi-user. Server-side validation lives in the SQL migration (constraints +
// views + policies), because client-side checks alone are not security.
//
// Every function throws RemoteUnavailableError when the backend is not
// configured — callers MUST degrade honestly (show a setup notice, keep local
// practice working). No fake rows are ever substituted.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { IS_REMOTE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import type { IntegrityState, Language, Mode } from "./types";

export class RemoteUnavailableError extends Error {
  constructor() {
    super("Shared competition backend is not configured");
    this.name = "RemoteUnavailableError";
  }
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!IS_REMOTE_CONFIGURED) throw new RemoteUnavailableError();
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Types mirroring the SQL schema
// ---------------------------------------------------------------------------

export interface PublicLeaderboardRow {
  id: string;
  user_id: string;
  username: string | null;
  mode: Mode;
  language: Language;
  duration_sec: number;
  wpm: number;
  accuracy: number;
  scored_at: string;
}

export interface DailyBoardRow {
  id: string;
  user_id: string;
  username: string | null;
  wpm: number;
  accuracy: number;
  scored_at: string;
}

export interface FriendChallengeRecord {
  id: string;
  creator_name: string;
  challenge_version: string;
  payload: {
    exerciseId: string;
    language: Language;
    mode: Mode;
    durationSec: number;
    createdAt: number;
  };
  expires_at: string | null;
}

export interface FriendChallengeResultRow {
  id: string;
  challenge_id: string;
  display_name: string;
  wpm: number;
  accuracy: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function fetchLeaderboard(opts: {
  mode?: Mode;
  language?: Language;
  durationSec?: number;
  limit?: number;
}): Promise<PublicLeaderboardRow[]> {
  let query = getClient()
    .from("public_leaderboard")
    .select("id,user_id,username,mode,language,duration_sec,wpm,accuracy,scored_at")
    .order("wpm", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.mode) query = query.eq("mode", opts.mode);
  if (opts.language) query = query.eq("language", opts.language);
  if (opts.durationSec) query = query.eq("duration_sec", opts.durationSec);
  const { data, error } = await query;
  if (error) throw new Error(`Leaderboard query failed: ${error.message}`);
  return (data ?? []) as PublicLeaderboardRow[];
}

export async function fetchMyBestRank(): Promise<number | null> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) return null;
  // Rank of the user's best ranked WPM within sprint/30s/en as a canonical board.
  const { data, error } = await c.rpc("my_best_rank", { p_user: userData.user.id });
  if (error) throw new Error(`Rank query failed: ${error.message}`);
  return typeof data === "number" ? data : null;
}

// ---------------------------------------------------------------------------
// Daily Arena
// ---------------------------------------------------------------------------

export async function fetchDailyBoard(challengeDate: string): Promise<DailyBoardRow[]> {
  const { data, error } = await getClient()
    .from("public_daily_board")
    .select("id,user_id,username,wpm,accuracy,scored_at")
    .eq("challenge_date", challengeDate)
    .order("wpm", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Daily board query failed: ${error.message}`);
  return (data ?? []) as DailyBoardRow[];
}

export interface SubmitAttemptPayload {
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  normalizationVersion?: string;
  mode: Mode;
  language: Language;
  durationSec: number;
  elapsedMs: number;
  wpm: number;
  accuracy: number;
  integrity: IntegrityState;
  challengeDate?: string;
  challengeVersion?: string;
  typedChars: number;
  uncorrectedErrors: number;
}

/** Persist an attempt. Ranked visibility is enforced by DB views/policies —
 *  non-ranked rows never appear on public boards regardless of payload. */
export async function submitAttempt(p: SubmitAttemptPayload): Promise<void> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in to save attempts to the shared arena");
  const { error } = await c.from("attempts").insert({
    user_id: userData.user.id,
    exercise_id: p.exerciseId,
    exercise_version: p.exerciseVersion,
    scoring_version: p.scoringVersion,
    normalization_version: p.normalizationVersion ?? null,
    mode: p.mode,
    language: p.language,
    duration_sec: p.durationSec,
    elapsed_ms: Math.round(p.elapsedMs),
    typed_chars: p.typedChars,
    uncorrected_errors: p.uncorrectedErrors,
    wpm: p.wpm,
    accuracy: p.accuracy,
    integrity: p.integrity,
    challenge_date: p.challengeDate ?? null,
    challenge_version: p.challengeVersion ?? null,
  });
  if (error) throw new Error(`Attempt rejected: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Friend challenges
// ---------------------------------------------------------------------------

export async function createFriendChallenge(p: {
  creatorName: string;
  payload: FriendChallengeRecord["payload"];
}): Promise<string> {
  const id = generateChallengeId();
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const { error } = await getClient().from("friend_challenges").insert({
    id,
    creator_name: p.creatorName.slice(0, 24),
    challenge_version: p.payload.createdAt ? "v2" : "v2",
    payload: p.payload,
    expires_at: expiresAt,
  });
  if (error) throw new Error(`Challenge creation failed: ${error.message}`);
  return id;
}

export async function fetchFriendChallenge(id: string): Promise<FriendChallengeRecord> {
  const { data, error } = await getClient()
    .from("friend_challenges")
    .select("id,creator_name,challenge_version,payload,expires_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Challenge lookup failed: ${error.message}`);
  if (!data) throw new Error(`Challenge ${id} not found`);
  return data as unknown as FriendChallengeRecord;
}

export async function submitFriendResult(
  challengeId: string,
  p: { displayName: string; wpm: number; accuracy: number },
): Promise<void> {
  const { error } = await getClient().from("friend_challenge_results").insert({
    challenge_id: challengeId,
    display_name: p.displayName.slice(0, 24),
    wpm: p.wpm,
    accuracy: p.accuracy,
  });
  if (error) throw new Error(`Result submission failed: ${error.message}`);
}

export async function fetchFriendResults(challengeId: string): Promise<FriendChallengeResultRow[]> {
  const { data, error } = await getClient()
    .from("friend_challenge_results")
    .select("id,challenge_id,display_name,wpm,accuracy,created_at")
    .eq("challenge_id", challengeId)
    .order("wpm", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Results lookup failed: ${error.message}`);
  return (data ?? []) as FriendChallengeResultRow[];
}

/** UnGuessable-enough share ids: Crockford-ish base32, 10 chars (~1e15 space). */
function generateChallengeId(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// ---------------------------------------------------------------------------
// Auth (optional accounts — anonymous-first product)
// ---------------------------------------------------------------------------

export async function signInWithEmail(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await getClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw new Error(error.message);
}

export async function signOutUser(): Promise<void> {
  const { error } = await getClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export interface AccountUser {
  id: string;
  email: string | null;
  username: string | null;
}

export async function getCurrentUser(): Promise<AccountUser | null> {
  if (!IS_REMOTE_CONFIGURED || typeof window === "undefined") return null;
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await c.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, username: (profile as { username: string } | null)?.username ?? null };
}

export function onAuthChange(cb: (user: AccountUser | null) => void): () => void {
  if (!IS_REMOTE_CONFIGURED || typeof window === "undefined") return () => undefined;
  const c = getClient();
  void getCurrentUser().then(cb);
  const sub = c.auth.onAuthStateChange(() => {
    void getCurrentUser().then(cb);
  });
  return () => sub.data.subscription.unsubscribe();
}

export async function updateUsername(username: string): Promise<void> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { error } = await c
    .from("profiles")
    .upsert({ id: data.user.id, username: username.slice(0, 24) }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/** Push local anonymous history to the signed-in account (one-shot migration).
 *  Ranked entries become visible on public boards through the ranked view. */
export async function migrateLocalHistory(
  items: Array<SubmitAttemptPayload>,
): Promise<{ migrated: number }> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const rows = items.map((p) => ({
    user_id: data.user.id,
    exercise_id: p.exerciseId,
    exercise_version: p.exerciseVersion,
    scoring_version: p.scoringVersion,
    normalization_version: p.normalizationVersion ?? null,
    mode: p.mode,
    language: p.language,
    duration_sec: p.durationSec,
    elapsed_ms: Math.round(p.elapsedMs),
    typed_chars: p.typedChars,
    uncorrected_errors: p.uncorrectedErrors,
    wpm: p.wpm,
    accuracy: p.accuracy,
    integrity: p.integrity,
    challenge_date: p.challengeDate ?? null,
    challenge_version: p.challengeVersion ?? null,
  }));
  if (rows.length === 0) return { migrated: 0 };
  const { error } = await c.from("attempts").insert(rows);
  if (error) throw new Error(`Migration failed: ${error.message}`);
  return { migrated: rows.length };
}

/** Delete every product row owned by the caller (privacy control). */
export async function deleteMyRemoteData(): Promise<void> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { error } = await c.rpc("delete_my_data");
  if (error) throw new Error(error.message);
}
