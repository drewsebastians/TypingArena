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

export function getClient(): SupabaseClient {
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
  clientId: string;
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  normalizationVersion?: string;
  mode: Mode;
  language: Language;
  durationSec: number;
  elapsedMs: number;
  typedChars: number;
  correctChars?: number;
  uncorrectedErrors?: number;
  focusLostCount?: number;
  pasteFlag?: boolean;
  burstFlag?: boolean;
  claimedWpm?: number;
  claimedAccuracy?: number;
  integrity: IntegrityState;
  challengeDate?: string;
  challengeVersion?: string;
  metrics?: Record<string, unknown>;
}

export interface SubmitResponse {
  accepted?: boolean;
  integrity?: string;
  /** Server-confirmed idempotent duplicate of a previously persisted attempt. */
  duplicate?: boolean;
  wpm?: number;
  accuracy?: number;
  reason?: string;
  reasons?: string[];
}

/** Persist an attempt THROUGH THE SERVER-AUTHORITATIVE RPC.
 *  The database recomputes wpm/accuracy from evidence and decides
 *  integrity/ranked itself; the client's claim is advisory only. */
export async function submitAttempt(p: SubmitAttemptPayload): Promise<SubmitResponse> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in to save attempts to the shared arena");
  const { data, error } = await c.rpc("submit_attempt", { p: p as unknown as Record<string, unknown> });
  if (error) throw new Error(`Attempt rejected: ${error.message}`);
  return (data ?? {}) as SubmitResponse;
}

/** Fetch the signed-in user's complete attempt history (any integrity),
 *  newest first, auto-paginated. Used for cross-device hydration. */
export async function fetchMyAttempts(pageSize = 200): Promise<Array<Record<string, unknown>>> {
  const c = getClient();
  const all: Array<Record<string, unknown>> = [];
  let from = 0;
  for (;;) {
    const { data, error } = await c
      .from("attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`History fetch failed: ${error.message}`);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/** Complete account deletion: product data AND the auth user itself. */
export async function deleteMyAccount(): Promise<void> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { error } = await c.rpc("delete_my_account");
  if (error) throw new Error(error.message);
  await signOutUser();
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

/**
 * Submit a friend-challenge result through the validating RPC. Evidence
 * counts (when available) are derived server-side; casual claimed values are
 * clamped. Challenge existence/expiry and rate limits are enforced remotely.
 */
export async function submitFriendResult(
  challengeId: string,
  p: { displayName: string; wpm: number; accuracy: number; typedChars?: number; correctChars?: number; elapsedMs?: number },
): Promise<void> {
  const { error } = await getClient().rpc("submit_friend_result", {
    p_challenge_id: challengeId.trim().toUpperCase(),
    p: {
      display_name: p.displayName.slice(0, 24),
      ...(p.typedChars !== undefined && p.correctChars !== undefined && p.elapsedMs !== undefined
        ? { typed_chars: Math.round(p.typedChars), correct_chars: Math.round(p.correctChars), elapsed_ms: Math.round(p.elapsedMs) }
        : { claimed_wpm: p.wpm, claimed_accuracy: p.accuracy }),
    },
  });
  if (error) {
    const msg = error.message.includes("challenge_not_found_or_expired")
      ? "This challenge no longer exists or has expired"
      : error.message.includes("implausible_result")
        ? "Result rejected as implausible"
        : error.message.includes("rate_limited")
          ? "Too many submissions — try again later"
          : error.message;
    throw new Error(msg);
  }
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
 *  Runs through the controlled SECURITY DEFINER RPC: the server recomputes
 *  metrics, forces imported rows to practice/flagged (never ranked), and
 *  dedupes idempotently on (user_id, client_id). Direct client inserts into
 *  attempts are no longer possible by design. */
export async function migrateLocalHistory(
  items: Array<SubmitAttemptPayload>,
): Promise<{ migrated: number }> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  let migrated = 0;
  for (let i = 0; i < items.length; i += 200) {
    const chunk = items.slice(i, i + 200).map((p) => ({
      client_id: p.clientId,
      exercise_id: p.exerciseId,
      exercise_version: p.exerciseVersion,
      scoring_version: p.scoringVersion,
      normalization_version: p.normalizationVersion ?? null,
      mode: p.mode,
      language: p.language,
      duration_sec: p.durationSec,
      elapsed_ms: Math.round(p.elapsedMs),
      typed_chars: Math.max(0, Math.min(20000, p.typedChars ?? 0)),
      correct_chars: Math.max(0, Math.min(20000, p.correctChars ?? 0)),
      uncorrected_errors: Math.max(0, p.uncorrectedErrors ?? 0),
      paste_flag: p.pasteFlag ?? false,
      burst_flag: p.burstFlag ?? false,
      metrics: (p.metrics ?? {}) as Record<string, unknown>,
    }));
    const { data: inserted, error } = await c.rpc("migrate_local_history", {
      p_items: chunk,
    });
    if (error) {
      const msg = error.message.includes("rate_limited")
        ? "Import rate limit reached — try again later"
        : error.message;
      throw new Error(`Migration failed after ${migrated} items: ${msg}`);
    }
    migrated += typeof inserted === "number" ? inserted : 0;
  }
  return { migrated };
}

// ---------------------------------------------------------------------------
// Teams / classrooms
// ---------------------------------------------------------------------------

export interface TeamRecord {
  id: string;
  name: string;
  join_code: string;
  owner_id: string;
}

export async function createTeam(name: string): Promise<TeamRecord> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  // Atomic SECURITY DEFINER RPC: creates the team AND its owner membership.
  // Direct client inserts into teams/team_members are no longer permitted —
  // membership exists only through authorized paths (create/join-by-code).
  const { data, error } = await c.rpc("create_team", { p_name: name.trim().slice(0, 60) });
  if (error) {
    const msg = error.message.includes("rate_limited")
      ? "Too many teams created — try again later"
      : error.message;
    throw new Error(msg);
  }
  return data as unknown as TeamRecord;
}

export async function joinTeamByCode(code: string): Promise<string> {
  const { data, error } = await getClient().rpc("join_team", { p_code: code.trim().toUpperCase() });
  if (error) {
    const msg = error.message.includes("team_not_found")
      ? "Team code not found"
      : error.message.includes("rate_limited")
        ? "Too many join attempts — try again in an hour"
        : error.message;
    throw new Error(msg);
  }
  return String(data);
}

export async function fetchMyTeams(): Promise<Array<TeamRecord & { role: string }>> {
  const c = getClient();
  const memberships = await c.from("team_members").select("team_id,role");
  if (memberships.error) throw new Error(memberships.error.message);
  const rows = ((memberships.data ?? []) as Array<{ team_id: string; role: string }>);
  if (rows.length === 0) return [];
  const ids = rows.map((m) => m.team_id);
  const teams = await c.from("teams").select("id,name,join_code,owner_id").in("id", ids);
  if (teams.error) throw new Error(teams.error.message);
  const roleById = new Map(rows.map((m) => [m.team_id, m.role]));
  return ((teams.data ?? []) as TeamRecord[]).map((t) => ({ ...t, role: roleById.get(t.id) ?? "member" }));
}

export async function leaveTeam(teamId: string): Promise<void> {
  const { error } = await getClient().from("team_members").delete().eq("team_id", teamId);
  if (error) throw new Error(error.message);
}

export interface TeamMemberRow {
  user_id: string;
  role: string;
  username: string | null;
}

/** Membership roster for a team the caller belongs to (usernames only —
 *  emails are never exposed anywhere in the product). */
export async function fetchTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  const c = getClient();
  const { data, error } = await c
    .from("team_members")
    .select("user_id,role")
    .eq("team_id", teamId)
    .limit(500);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ user_id: string; role: string }>;
  if (rows.length === 0) return [];
  const prof = await c.from("public_profiles").select("id,username").in("id", rows.map((r) => r.user_id));
  const names = new Map(((prof.data ?? []) as Array<{ id: string; username: string | null }>).map((p) => [p.id, p.username]));
  return rows.map((r) => ({ ...r, username: names.get(r.user_id) ?? null }));
}

export async function deleteTeamAsOwner(teamId: string): Promise<void> {
  const { error } = await getClient().from("teams").delete().eq("id", teamId);
  if (error) throw new Error(error.message);
}

export interface AssignmentDefinition {
  /** Corpus mode for typing kinds, or the exact clip id for audio kinds. */
  ref: string;
  language: Language;
  durationSec: number;
  version: string;
}

export interface AssignmentRecord {
  id: string;
  title: string;
  kind: string;
  payload: Partial<AssignmentDefinition> & Record<string, unknown>;
  due_at: string | null;
}

export async function createAssignment(
  teamId: string,
  p: { title: string; kind: string; definition?: AssignmentDefinition; dueAt?: string },
): Promise<void> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { error } = await c.from("assignments").insert({
    team_id: teamId,
    title: p.title.slice(0, 80),
    kind: p.kind,
    payload: (p.definition ?? {}) as Record<string, unknown>,
    due_at: p.dueAt ?? null,
    created_by: userData.user.id,
  });
  if (error) throw new Error(error.message);
}

export async function fetchAssignments(teamId: string): Promise<AssignmentRecord[]> {
  const { data, error } = await getClient()
    .from("assignments")
    .select("id,title,kind,payload,due_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as AssignmentRecord[];
}

/**
 * Bind a completion to a REAL persisted attempt. The server validates that
 * the attempt belongs to the caller, matches the assignment's mode/exercise
 * definition, clears an effort floor, and computes the score itself — the
 * client never submits a score.
 */
export async function completeAssignment(assignmentId: string, attemptClientId: string): Promise<{ score: number; wpm: number; accuracy: number }> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { data, error } = await c.rpc("complete_assignment", {
    p_assignment_id: assignmentId,
    p_client_id: attemptClientId,
  });
  if (error) {
    const msg = error.message.includes("attempt_not_found")
      ? "Finish the exercise first — no result found for this assignment"
      : error.message.includes("attempt_mismatch")
        ? "This result does not match the assigned exercise"
        : error.message.includes("attempt_too_short")
          ? "The attempt was too short to count — run the full exercise"
          : error.message.includes("not_a_member")
            ? "Join this team before completing assignments"
            : error.message;
    throw new Error(msg);
  }
  return (data ?? {}) as { score: number; wpm: number; accuracy: number };
}

export interface TeamCompletionRow {
  assignment_id: string;
  user_id: string;
  username: string | null;
  score: number;
  wpm: number | null;
  accuracy: number | null;
  completed_at: string;
}

/** Aggregate completion rows for a team's assignments (dashboard view). */
export async function fetchTeamCompletions(teamId: string): Promise<TeamCompletionRow[]> {
  const c = getClient();
  const assignments = await fetchAssignments(teamId);
  if (assignments.length === 0) return [];
  const ids = assignments.map((a) => a.id);
  const { data, error } = await c
    .from("assignment_completions")
    .select("assignment_id,user_id,score,wpm,accuracy,completed_at")
    .in("assignment_id", ids)
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ assignment_id: string; user_id: string; score: number; wpm: number | null; accuracy: number | null; completed_at: string }>;
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  let names = new Map<string, string>();
  if (userIds.length > 0) {
    const prof = await c.from("public_profiles").select("id,username").in("id", userIds);
    if (!prof.error) names = new Map(((prof.data ?? []) as Array<{ id: string; username: string | null }>).map((p) => [p.id, p.username ?? "member"]));
  }
  return rows.map((r) => ({ ...r, username: names.get(r.user_id) ?? "member" }));
}

// ---------------------------------------------------------------------------
// Custom tests
// ---------------------------------------------------------------------------

export interface CustomTestRecord {
  id: string;
  owner_id: string | null;
  title: string;
  language: Language;
  body: string;
  visibility: "private" | "unlisted";
}

export async function createCustomTest(p: { title: string; language: Language; body: string; visibility: "private" | "unlisted" }): Promise<string> {
  const { data, error } = await getClient().rpc("create_custom_test", { p: p as unknown as Record<string, unknown> });
  if (error) throw new Error(error.message.includes("sign_in") ? "Sign in to create custom tests" : error.message);
  return String(data);
}

export async function fetchCustomTest(id: string): Promise<CustomTestRecord> {
  const { data, error } = await getClient()
    .from("custom_tests")
    .select("id,owner_id,title,language,body,visibility")
    .eq("id", id.toUpperCase())
    .maybeSingle();
  if (error || !data) throw new Error("Custom test not found or expired");
  return data as CustomTestRecord;
}

export async function fetchMyCustomTests(): Promise<CustomTestRecord[]> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  // Ownership must be enforced here as well as in RLS: the unlisted
  // world-read policy means a bare select also returns OTHER users' unlisted
  // tests, which would pollute the "my tests" surface.
  const { data, error } = await c
    .from("custom_tests")
    .select("id,owner_id,title,language,body,visibility")
    .eq("owner_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return ((data ?? []) as CustomTestRecord[]).filter((r) => r.owner_id === userData.user!.id);
}

// ---------------------------------------------------------------------------
// Multiplayer rooms
// ---------------------------------------------------------------------------

export interface RoomRecord {
  code: string;
  host_name: string;
  state: "lobby" | "running" | "finished";
  exercise_kind: string;
  language: Language;
  duration_sec: number;
  stream_seed: string;
  ends_at: string | null;
}

export interface CreatedRoom {
  code: string;
  /** Secret returned ONLY to the room creator; authorizes start/rematch. */
  hostToken: string;
}

export async function createRoom(p: { hostName: string; language: Language; durationSec: number }): Promise<CreatedRoom> {
  const { data, error } = await getClient().rpc("create_room", {
    p: { host_name: p.hostName, language: p.language, duration_sec: p.durationSec },
  });
  if (error) throw new Error(error.message.includes("rate_limited") ? "Too many rooms created — try later" : error.message);
  const r = (data ?? {}) as { code?: string; host_token?: string };
  if (!r.code || !r.host_token) throw new Error("Room creation failed");
  return { code: String(r.code), hostToken: String(r.host_token) };
}

export async function fetchRoom(code: string): Promise<RoomRecord> {
  const { data, error } = await getClient().from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error || !data) throw new Error("Room not found or expired");
  return data as RoomRecord;
}

/** Host-authoritative start: only the creator's secret token is accepted. */
export async function startRoom(code: string, hostToken: string): Promise<void> {
  const { error } = await getClient().rpc("start_room", { p_code: code.toUpperCase(), p_host_token: hostToken });
  if (error) {
    const msg = error.message.includes("already_started")
      ? "Race already started"
      : error.message.includes("not_host")
        ? "Only the host can start the race"
        : error.message.includes("room_expired")
          ? "This room has expired"
          : error.message;
    throw new Error(msg);
  }
}

/** Host-only rematch: same room code, fresh seed, cleared results. */
export async function restartRoom(code: string, hostToken: string): Promise<void> {
  const { error } = await getClient().rpc("restart_room", { p_code: code.toUpperCase(), p_host_token: hostToken });
  if (error) {
    const msg = error.message.includes("not_host") ? "Only the host can restart the race" : error.message;
    throw new Error(msg);
  }
}

/** Submit race evidence — the server recomputes wpm/accuracy from counts
 *  inside the validated race window and dedupes per player. */
export async function finishRoom(
  code: string,
  playerKey: string,
  p: {
    displayName: string;
    typedChars: number;
    correctChars: number;
    elapsedMs: number;
  },
): Promise<{ accepted: boolean; duplicate?: boolean; wpm?: number; accuracy?: number }> {
  const { data, error } = await getClient().rpc("finish_room", {
    p_code: code.toUpperCase(),
    p_player_key: playerKey,
    p: {
      display_name: p.displayName,
      typed_chars: Math.round(p.typedChars),
      correct_chars: Math.round(p.correctChars),
      elapsed_ms: Math.round(p.elapsedMs),
    },
  });
  if (error) {
    const msg = error.message.includes("implausible_result")
      ? "Result rejected as implausible"
      : error.message.includes("race_window_closed")
        ? "The race window already closed"
        : error.message.includes("race_not_running")
          ? "Race is not running"
          : error.message;
    throw new Error(msg);
  }
  return (data ?? { accepted: true }) as { accepted: boolean; duplicate?: boolean; wpm?: number; accuracy?: number };
}

export interface RoomResultRow {
  player_key: string;
  display_name: string;
  wpm: number;
  accuracy: number;
}

export async function fetchRoomResults(code: string): Promise<RoomResultRow[]> {
  const { data, error } = await getClient()
    .from("room_results")
    .select("player_key,display_name,wpm,accuracy")
    .eq("room_code", code.toUpperCase())
    .order("wpm", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoomResultRow[];
}

// ---------------------------------------------------------------------------
// Employer assessments
// ---------------------------------------------------------------------------

export interface AssessmentRecord {
  id: string;
  title: string;
  modules: Array<{ kind: string; ref: string; durationSec?: number; label: string }>;
  invite_code: string;
  window_hours: number;
  revoked?: boolean;
  opens_at?: string | null;
}

export async function createAssessment(p: { title: string; modules: AssessmentRecord["modules"]; windowHours?: number }): Promise<AssessmentRecord> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { data, error } = await c
    .from("assessments")
    .insert({ owner_id: userData.user.id, title: p.title.slice(0, 80), modules: p.modules, window_hours: p.windowHours ?? 72 })
    .select("id,title,modules,invite_code,window_hours")
    .single();
  if (error) throw new Error(error.message);
  return data as AssessmentRecord;
}

export type InviteState = "invalid" | "expired" | "revoked" | "not_open";

export class InviteInvalidError extends Error {
  readonly state: InviteState;
  constructor(state: InviteState) {
    super(
      state === "revoked" ? "This invite has been revoked by the organizer"
      : state === "expired" ? "This invite has expired"
      : state === "not_open" ? "This assessment is not open yet"
      : "This invite is invalid",
    );
    this.name = "InviteInvalidError";
    this.state = state;
  }
}

/**
 * Candidate-side resolution of the SAVED assessment definition by invite
 * token. Returns exactly the module sequence the creator stored — never a
 * client-side default — after validating the full invite lifecycle
 * (invalid / revoked / not-yet-open / expired).
 */
export async function fetchAssessmentDefinition(inviteCode: string): Promise<{
  title: string;
  modules: AssessmentRecord["modules"];
  opens_at: string | null;
  expires_at: string;
}> {
  const { data, error } = await getClient().rpc("fetch_assessment_definition", {
    p_invite: inviteCode.trim().toUpperCase(),
  });
  if (error) {
    if (error.message.includes("invite_revoked")) throw new InviteInvalidError("revoked");
    if (error.message.includes("invite_not_open")) throw new InviteInvalidError("not_open");
    if (error.message.includes("invite_expired")) throw new InviteInvalidError("expired");
    throw new InviteInvalidError("invalid");
  }
  const r = (data ?? {}) as { title?: string; modules?: AssessmentRecord["modules"]; opens_at?: string | null; expires_at?: string };
  if (!r.modules || r.modules.length === 0) throw new InviteInvalidError("invalid");
  return {
    title: String(r.title ?? "Assessment"),
    modules: r.modules,
    opens_at: r.opens_at ?? null,
    expires_at: String(r.expires_at),
  };
}

/** Owner-only invite revocation — candidates then receive a distinct
 *  "revoked" state instead of being able to keep completing. */
export async function revokeAssessmentInvite(assessmentId: string): Promise<void> {
  const { error } = await getClient().rpc("revoke_assessment_invite", { p_assessment_id: assessmentId });
  if (error) throw new Error(error.message.includes("not_found_or_not_owner") ? "Assessment not found" : error.message);
}

export async function fetchMyAssessments(): Promise<AssessmentRecord[]> {
  const { data, error } = await getClient()
    .from("assessments")
    .select("id,title,modules,invite_code,window_hours,revoked,opens_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentRecord[];
}

export async function fetchAssessmentResults(assessmentId: string): Promise<Array<{ candidate_key: string; label: string; results: Record<string, unknown>; integrity_flags: string[]; completed_at: string }>> {
  const { data, error } = await getClient()
    .from("assessment_results")
    .select("candidate_key,label,results,integrity_flags,completed_at")
    .eq("assessment_id", assessmentId)
    .order("completed_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ candidate_key: string; label: string; results: Record<string, unknown>; integrity_flags: string[]; completed_at: string }>;
}

export async function submitAssessmentResult(p: { inviteCode: string; candidateKey: string; label?: string; results: Record<string, unknown>; flags?: string[] }): Promise<void> {
  const { error } = await getClient().rpc("submit_assessment_result", {
    p: { invite_code: p.inviteCode, candidate_key: p.candidateKey, label: p.label ?? "candidate", results: p.results, flags: p.flags ?? [] },
  });
  if (error) {
    const msg = error.message.includes("invite_invalid")
      ? "This invite is no longer valid"
      : error.message.includes("invalid_results")
        ? "Result payload was rejected — please retake the assessment"
        : error.message;
    throw new Error(msg);
  }
}
